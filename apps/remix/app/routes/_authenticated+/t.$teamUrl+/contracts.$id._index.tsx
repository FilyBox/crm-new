import { useCallback, useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { TeamMemberRole } from '@prisma/client';
import { addDays } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, Save } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useForm } from 'react-hook-form';
import { Link, redirect, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { match } from 'ts-pattern';
import * as z from 'zod';

import { getSession } from '@documenso/auth/server/lib/utils/get-session';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { AppError } from '@documenso/lib/errors/app-error';
import { getContractById } from '@documenso/lib/server-only/document/get-contract-by-id';
import { getDocumentById } from '@documenso/lib/server-only/document/get-document-by-id';
import { getFieldsForDocument } from '@documenso/lib/server-only/field/get-fields-for-document';
import { getRecipientsForDocument } from '@documenso/lib/server-only/recipient/get-recipients-for-document';
import { getTeamByUrl } from '@documenso/lib/server-only/team/get-team';
import { DocumentVisibility } from '@documenso/lib/types/document-visibility';
import { formatContractsPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { generateUUID } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent } from '@documenso/ui/primitives/card';
import { FeatureCard } from '@documenso/ui/primitives/card-fancy';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form';
import PDFViewer from '@documenso/ui/primitives/pdf-viewer';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';

import { ChatDemo } from '~/components/general/chat/chat-component';
import { FullSizeCard } from '~/components/general/fullSize-Card';
import { useCurrentTeam } from '~/providers/team';
import { superLoaderJson, useSuperLoaderData } from '~/utils/super-json-loader';

import { EditableText } from '../../../components/general/editable-text';
import type { Route } from './+types/contracts.$id._index';

export async function loader({ params, request }: Route.LoaderArgs) {
  const { user } = await getSession(request);
  const teamUrl = params.teamUrl;

  if (!teamUrl) {
    throw new Response('Not Found', { status: 404 });
  }

  const team = await getTeamByUrl({ userId: user.id, teamUrl });

  const { id } = params;

  const documentId = Number(id);

  const documentRootPath = formatContractsPath(team?.url);

  const contract = await getContractById({
    contractId: documentId,
    userId: user.id,
    teamId: team.id,
  }).catch(() => null);

  if (!contract) {
    throw new AppError('NotFound', {
      message: 'Contract not found.',
      statusCode: 404,
    });
  }

  if (!documentId || Number.isNaN(documentId)) {
    throw redirect(documentRootPath);
  }

  const document = await getDocumentById({
    documentId: contract.documentId,
    userId: user.id,
    teamId: team?.id,
  }).catch(() => null);
  if (document?.teamId && !team?.url) {
    throw redirect(documentRootPath);
  }

  const documentVisibility = document?.visibility;
  const currentTeamMemberRole = team.currentTeamRole;
  const isRecipient = document?.recipients.find((recipient) => recipient.email === user.email);
  let canAccessDocument = true;

  if (team && !isRecipient && document?.userId !== user.id) {
    canAccessDocument = match([documentVisibility, currentTeamMemberRole])
      .with([DocumentVisibility.EVERYONE, TeamMemberRole.ADMIN], () => true)
      .with([DocumentVisibility.EVERYONE, TeamMemberRole.MANAGER], () => true)
      .with([DocumentVisibility.EVERYONE, TeamMemberRole.MEMBER], () => true)
      .with([DocumentVisibility.MANAGER_AND_ABOVE, TeamMemberRole.ADMIN], () => true)
      .with([DocumentVisibility.MANAGER_AND_ABOVE, TeamMemberRole.MANAGER], () => true)
      .with([DocumentVisibility.ADMIN, TeamMemberRole.ADMIN], () => true)
      .otherwise(() => false);
  }

  if (!document || !document.documentData || (team && !canAccessDocument)) {
    throw redirect(documentRootPath);
  }

  if (team && !canAccessDocument) {
    throw redirect(documentRootPath);
  }

  // Todo: Get full document instead?
  const [recipients, fields] = await Promise.all([
    getRecipientsForDocument({
      documentId,
      teamId: team?.id,
      userId: user.id,
    }),
    getFieldsForDocument({
      documentId,
      userId: user.id,
      teamId: team?.id,
    }),
  ]);

  const documentWithRecipients = {
    ...document,
    recipients,
  };

  return superLoaderJson({
    document: documentWithRecipients,
    documentRootPath,
    fields,
    contract,
  });
}

const contractFormSchema = z.object({
  title: z.string(),
  artists: z.string(),
  status: z.enum(['NO_ESPECIFICADO', 'VIGENTE', 'FINALIZADO']),
  startDate: z.date(),
  endDate: z.date(),
  isPossibleToExpand: z.enum(['SI', 'NO', 'NO_ESPECIFICADO']),
  possibleExtensionTime: z.string(),
  summary: z.string(),
});

export default function DocumentPage() {
  const loaderData = useSuperLoaderData<typeof loader>();
  const { id } = useCurrentTeam();
  const { user } = useSession();
  const { i18n, t } = useLingui();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLanguage = i18n.locale;
  const { document, documentRootPath, contract } = loaderData;
  const { documentData } = document;
  const [chatName, setChatName] = useQueryState('chatId');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const UUID = useMemo(() => {
    return chatName || generateUUID();
  }, [chatName]); // Solo chatName, NO searchParams

  const updateContractMutation = trpc.contracts.updateContractsById.useMutation({
    onSuccess: () => {
      toast.success(t`Updated successfully`);
      setHasUnsavedChanges(false);
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(t`Failed to update`);
      setIsSaving(false);
    },
  });

  const form = useForm<z.infer<typeof contractFormSchema>>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      title: contract?.title || '',
      artists: contract?.artists || '',
      status: contract?.status as 'NO_ESPECIFICADO' | 'VIGENTE' | 'FINALIZADO' | undefined,
      startDate: contract?.startDate ? addDays(new Date(contract.startDate), 1) : undefined,
      endDate: contract?.endDate ? addDays(new Date(contract.endDate), 1) : undefined,
      isPossibleToExpand: contract?.isPossibleToExpand || '',
      possibleExtensionTime: contract?.possibleExtensionTime || '',
      summary: contract?.summary || '',
    },
  });
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && type === 'change') {
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleFieldChange = (fieldName: keyof typeof contractFormSchema.shape, value: any) => {
    form.setValue(fieldName, value);
    setHasUnsavedChanges(true);
  };

  const handleSaveContract = async () => {
    try {
      setIsSaving(true);
      const currentValues = form.getValues();
      const updatedData = {
        ...currentValues,
        id: contract.id,
        documentId: contract.documentId,
      };

      await updateContractMutation.mutateAsync(updatedData);
    } catch (error) {
      console.error('Error updating contract:', error);
    }
  };

  const handleDiscardChanges = () => {
    form.reset({
      title: contract?.title || '',
      artists: contract?.artists || '',
      status: contract?.status as 'NO_ESPECIFICADO' | 'VIGENTE' | 'FINALIZADO' | undefined,
      startDate: contract?.startDate ? addDays(new Date(contract.startDate), 1) : undefined,
      endDate: contract?.endDate ? addDays(new Date(contract.endDate), 1) : undefined,
      isPossibleToExpand: contract?.isPossibleToExpand || 'NO_ESPECIFICADO',
      possibleExtensionTime: contract?.possibleExtensionTime || '',
      summary: contract?.summary || '',
    });
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    if (!chatName) {
      const newUUID = generateUUID();
      setChatName(newUUID); // Sin void
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set('chatId', newUUID);
          return newParams;
        },
        { replace: true },
      );
    }
  }, []); // Mantener array vacío

  const handleChatChange = useCallback(
    (chatId: string) => {
      setChatName(chatId);
    },
    [setChatName],
  );

  const handleNewChat = useCallback(() => {
    const newUUID = generateUUID();
    setChatName(newUUID);
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('chatId', newUUID);
        return newParams;
      },
      { replace: true },
    );
  }, [setChatName, setSearchParams]);

  // CAMBIO: Memorizar el componente ChatDemo
  const chatDemo = useMemo(
    () => (
      <ChatDemo
        id={chatName || UUID}
        teamId={id}
        contractId={contract.documentId}
        initialMessages={[]}
        selectedChatModel="chat-model"
        contractName={contract.fileName || contract.title}
        isReadonly={false}
        body={''}
        userId={user.id}
      />
    ),
    [chatName, UUID, id, contract.documentId, contract.fileName, contract.title, user.id],
  );

  return (
    <div
      className={`mx-auto w-full max-w-screen-xl px-4 sm:px-6`}
      style={{ scrollbarGutter: 'stable' }}
    >
      <h1 className="block max-w-[20rem] truncate text-2xl font-semibold sm:mt-4 md:max-w-[30rem] md:text-3xl">
        {contract.fileName}
      </h1>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-y-2 sm:mt-2.5 sm:gap-y-0">
        <Link to={documentRootPath} className="flex items-center text-[#7AC455] hover:opacity-80">
          <ChevronLeft className="mr-2 inline-block h-5 w-5" />
          <Trans>Contracts</Trans>
        </Link>
      </div>

      <div
        className={`relative mt-4 flex w-full flex-col gap-x-6 gap-y-8 sm:mt-8 md:flex-row lg:gap-x-8 lg:gap-y-0`}
      >
        <div className="flex-1">
          <Card className="rounded-xl before:rounded-xl" gradient>
            <CardContent className="p-2">
              <PDFViewer key={documentData.id} documentData={documentData} document={document} />
            </CardContent>
          </Card>
        </div>

        <div className="w-full flex-1 md:w-[350px]">
          <div className="sticky top-20">
            <FeatureCard
              contentClassName="h-[calc(100vh-10rem)] flex flex-col justify-between"
              className="p-5"
            >
              <div className="flex h-full flex-col gap-2">
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="flex flex-col gap-0 space-y-0 px-1">
                        <FormControl>
                          <EditableText
                            value={field.value}
                            onChange={(value: string) => {
                              handleFieldChange('title', value);
                            }}
                            variant="input"
                            placeholder={t`Title - Not defined`}
                            className="text-primary line-clamp-1 p-0 text-lg font-semibold"
                            displayClassName="p-0 h-fit text-base min-h-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Form>

                {hasUnsavedChanges && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{
                        duration: 0.3,
                        ease: 'easeOut',
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="mt-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20"
                    >
                      <div className="flex-1">
                        <p className="text-base text-amber-800 dark:text-amber-200">
                          <Trans>You have unsaved changes</Trans>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDiscardChanges}
                          disabled={isSaving}
                        >
                          <Trans>Discard</Trans>
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveContract}
                          disabled={isSaving}
                          loading={isSaving}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          <Trans>Save Changes</Trans>
                        </Button>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}

                <motion.section
                  layout
                  style={{ containerType: 'size' }}
                  className="h-full"
                  transition={{
                    layout: {
                      duration: 0.1,
                      ease: 'easeOut',
                    },
                  }}
                >
                  <ScrollArea className="h-[100cqh] pb-3">
                    <Form {...form}>
                      <div className="flex flex-col gap-4 p-1">
                        {/* Artists Field */}
                        <FormField
                          control={form.control}
                          name="artists"
                          render={({ field }) => (
                            <FormItem className="flex flex-col gap-0 space-y-0">
                              <FormLabel className="text-foreground text-lg font-medium">
                                <Trans>Individuals involved</Trans>
                              </FormLabel>
                              <FormControl>
                                <EditableText
                                  value={field.value}
                                  onChange={(value: string) => {
                                    handleFieldChange('artists', value);
                                  }}
                                  autoResize={true}
                                  variant="textarea"
                                  placeholder={t`Not defined`}
                                  className="p-0 text-base"
                                  displayClassName="p-0 h-fit text-base min-h-0"
                                  editClassName=""
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Status Field */}
                        <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem className="flex flex-col gap-0 space-y-0">
                              <FormLabel className="text-foreground text-lg font-medium">
                                <Trans>Status</Trans>
                              </FormLabel>
                              <FormControl>
                                <EditableText
                                  value={field.value}
                                  onChange={(value: string) => {
                                    handleFieldChange(
                                      'status',
                                      value as 'NO_ESPECIFICADO' | 'VIGENTE' | 'FINALIZADO',
                                    );
                                  }}
                                  variant="select"
                                  options={
                                    [
                                      { value: 'NO_ESPECIFICADO', label: 'No Especificado' },
                                      { value: 'VIGENTE', label: 'Vigente' },
                                      { value: 'FINALIZADO', label: 'Finalizado' },
                                    ] as Array<{
                                      value: 'NO_ESPECIFICADO' | 'VIGENTE' | 'FINALIZADO';
                                      label: string;
                                    }>
                                  }
                                  placeholder={t`Not defined`}
                                  className="h-fit p-0 text-base"
                                  displayClassName="p-0 h-fit text-base min-h-0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Date Fields Row */}
                        <div className="flex w-full items-center justify-between gap-4">
                          {/* Start Date */}
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-1 flex-col gap-0 space-y-0">
                                <FormLabel className="text-foreground text-lg font-medium">
                                  <Trans>Start Date</Trans>
                                </FormLabel>
                                <FormControl>
                                  <EditableText
                                    value={field.value as Date | undefined}
                                    onChange={(value: Date | undefined) => {
                                      handleFieldChange('startDate', value);
                                    }}
                                    variant="date"
                                    dateFormat="d MMM yyyy"
                                    locale={currentLanguage === 'es' ? es : enUS}
                                    placeholder={t`Not defined`}
                                    className="p-0 text-base"
                                    displayClassName="p-0 h-fit text-base min-h-0"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* End Date */}
                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-1 flex-col gap-0 space-y-0">
                                <FormLabel className="text-foreground text-lg font-medium">
                                  <Trans>End Date</Trans>
                                </FormLabel>
                                <FormControl>
                                  <EditableText
                                    value={field.value as Date | undefined}
                                    onChange={(value: Date | undefined) => {
                                      handleFieldChange('endDate', value);
                                    }}
                                    variant="date"
                                    dateFormat="d MMM yyyy"
                                    locale={currentLanguage === 'es' ? es : enUS}
                                    placeholder={t`Not defined`}
                                    className="p-0 text-base"
                                    displayClassName="p-0 h-fit text-base min-h-0"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Extension Fields Row */}
                        <div className="flex w-full items-center justify-between gap-4">
                          {/* Can Extend */}
                          <FormField
                            control={form.control}
                            name="isPossibleToExpand"
                            render={({ field }) => (
                              <FormItem className="flex flex-1 flex-col gap-0 space-y-0">
                                <FormLabel className="text-foreground text-lg font-medium">
                                  <Trans>Can Extend</Trans>
                                </FormLabel>
                                <FormControl>
                                  <EditableText
                                    value={field.value}
                                    onChange={(value: string) => {
                                      handleFieldChange(
                                        'isPossibleToExpand',
                                        value as 'NO_ESPECIFICADO' | 'SI' | 'NO',
                                      );
                                    }}
                                    variant="select"
                                    options={
                                      [
                                        { value: 'NO_ESPECIFICADO', label: 'No Especificado' },
                                        { value: 'SI', label: 'Sí' },
                                        { value: 'NO', label: 'No' },
                                      ] as Array<{
                                        value: 'NO_ESPECIFICADO' | 'SI' | 'NO';
                                        label: string;
                                      }>
                                    }
                                    placeholder={t`Not defined`}
                                    className="h-fit p-0 text-base"
                                    displayClassName="p-0 h-fit text-base min-h-0"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Extension Time */}
                          <FormField
                            control={form.control}
                            name="possibleExtensionTime"
                            render={({ field }) => (
                              <FormItem className="flex flex-1 flex-col gap-0 space-y-0">
                                <FormLabel className="text-foreground text-lg font-medium">
                                  <Trans>Extension Time</Trans>
                                </FormLabel>
                                <FormControl>
                                  <EditableText
                                    value={field.value}
                                    onChange={(value: string) => {
                                      handleFieldChange('possibleExtensionTime', value);
                                    }}
                                    variant="input"
                                    placeholder={t`Not defined`}
                                    className="p-0 text-base"
                                    displayClassName="p-0 h-fit text-base min-h-0"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Summary Field */}
                        <FormField
                          control={form.control}
                          name="summary"
                          render={({ field }) => (
                            <FormItem className="flex flex-col gap-0 space-y-0">
                              <FormLabel className="text-foreground text-lg font-medium">
                                <Trans>Summary</Trans>
                              </FormLabel>
                              <FormControl>
                                <EditableText
                                  value={field.value}
                                  onChange={(value: string) => {
                                    handleFieldChange('summary', value);
                                  }}
                                  variant="textarea"
                                  autoResize={true}
                                  placeholder={t`No summary yet`}
                                  className="h-fit p-0"
                                  displayClassName="p-0 h-fit text-base min-h-0"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Form>
                  </ScrollArea>
                </motion.section>
              </div>

              <FullSizeCard
                documentId={document.id}
                selectedChatId={chatName || UUID}
                title={contract.fileName || contract.title}
                identifier="chat"
                className="max-h-14 min-h-fit"
                onChatChange={handleChatChange}
                onNewChat={handleNewChat}
              >
                {chatDemo}
              </FullSizeCard>
            </FeatureCard>
          </div>
        </div>
      </div>
    </div>
  );
}
