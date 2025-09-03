import { useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { TeamMemberRole } from '@prisma/client';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { ChevronLeft } from 'lucide-react';
import { Link, redirect } from 'react-router';
import { match } from 'ts-pattern';

import { getSession } from '@documenso/auth/server/lib/utils/get-session';
import { AppError } from '@documenso/lib/errors/app-error';
import { getContractById } from '@documenso/lib/server-only/document/get-contract-by-id';
import { getDocumentById } from '@documenso/lib/server-only/document/get-document-by-id';
import { getFieldsForDocument } from '@documenso/lib/server-only/field/get-fields-for-document';
import { getRecipientsForDocument } from '@documenso/lib/server-only/recipient/get-recipients-for-document';
import { getTeamByUrl } from '@documenso/lib/server-only/team/get-team';
import { DocumentVisibility } from '@documenso/lib/types/document-visibility';
import { formatContractsPath } from '@documenso/lib/utils/teams';
import { Card, CardContent } from '@documenso/ui/primitives/card';
import PDFViewer from '@documenso/ui/primitives/pdf-viewer';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';

import { superLoaderJson, useSuperLoaderData } from '~/utils/super-json-loader';

import type { Route } from './+types/documents.$id._index';

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

  // if (document?.folderId) {
  //   console.log('document has folderId, redirecting to root path');
  //   throw redirect(documentRootPath);
  // }

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

export default function DocumentPage() {
  const loaderData = useSuperLoaderData<typeof loader>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { i18n } = useLingui();
  const currentLanguage = i18n.locale;
  // const retryDocument = trpc.document.retryContractData.useMutation();

  const { document, documentRootPath, contract } = loaderData;
  const { documentData } = document;

  const handleRetry = () => {
    try {
      setIsGenerating(true);
      // const { publicAccessToken, id } = await retryDocument.mutateAsync({
      //   documentId: contract.documentId,
      // });
      // void navigate(`${documentRootPath}/${contract.documentId}/${id}/${publicAccessToken}/retry`);
    } catch (error) {
      console.error('Error navigating to folders:', error);
      setIsGenerating(false);
    }
  };
  return (
    <div className="mx-auto w-full max-w-screen-xl sm:px-6">
      <h1
        className="block max-w-[20rem] truncate text-2xl font-semibold sm:mt-4 md:max-w-[30rem] md:text-3xl"
        title={document.title}
      >
        {document.title}
      </h1>

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-y-2 sm:mt-2.5 sm:gap-y-0">
        <Link to={documentRootPath} className="flex items-center text-[#7AC455] hover:opacity-80">
          <ChevronLeft className="mr-2 inline-block h-5 w-5" />
          <Trans>Contracts</Trans>
        </Link>
      </div>

      <div className="relative mt-4 flex w-full flex-col gap-x-6 gap-y-8 sm:mt-8 md:flex-row lg:gap-x-8 lg:gap-y-0">
        <div className="flex-1">
          <Card className="rounded-xl before:rounded-xl" gradient>
            <CardContent className="p-2">
              <PDFViewer key={documentData.id} documentData={documentData} document={document} />
            </CardContent>
          </Card>
        </div>

        <div className="w-full flex-1 md:w-[350px]">
          <div className="sticky top-20">
            <Card className="p-4">
              <ScrollArea className="h-[32rem]">
                <div className="flex flex-col gap-4 p-3">
                  <span className="line-clamp-1 text-2xl font-semibold">{contract?.fileName}</span>
                  {contract?.title && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">Title</span>
                      <span className="text-base">{contract.title}</span>
                    </div>
                  )}

                  {contract?.artists && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">Artists</span>
                      <span className="text-base">{contract.artists}</span>
                    </div>
                  )}

                  {contract?.status && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <span className="text-base">{contract.status}</span>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {contract?.startDate && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Start Date</span>
                        <span className="text-base">
                          {format(contract.startDate as Date, 'd MMM yyyy', {
                            locale: currentLanguage === 'es' ? es : enUS,
                          })}
                        </span>
                      </div>
                    )}

                    {contract?.endDate && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">End Date</span>
                        <span className="text-base">
                          {format(contract.endDate as Date, 'd MMM yyyy', {
                            locale: currentLanguage === 'es' ? es : enUS,
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    {contract?.isPossibleToExpand !== undefined && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Can Extend</span>
                        <span className="text-base">{contract.isPossibleToExpand}</span>
                      </div>
                    )}

                    {contract?.possibleExtensionTime && (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Extension Time</span>
                        <span className="text-base">{contract.possibleExtensionTime}</span>
                      </div>
                    )}
                  </div>

                  {contract?.summary && (
                    <div className="mt-2 flex flex-col">
                      <span className="text-sm font-medium text-gray-500">Summary</span>
                      <p className="mt-1 text-base">{contract.summary}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
