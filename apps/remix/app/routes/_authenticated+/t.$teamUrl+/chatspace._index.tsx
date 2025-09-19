import { useEffect, useMemo, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { useLingui } from '@lingui/react/macro';
import { queryOptions } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { downloadAnyFileMultiple } from '@documenso/lib/client-only/download-any-file-multiple';
import { FolderType } from '@documenso/lib/types/folder-type';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { formatChatPath } from '@documenso/lib/utils/teams';
import { type Document } from '@documenso/prisma/client';
import { ExtendedDocumentStatus } from '@documenso/prisma/types/extended-document-status';
import { trpc } from '@documenso/trpc/react';
import { ZFindDocumentsInternalRequestSchema } from '@documenso/trpc/server/document-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';

import { DocumentMoveToFolderDialog } from '~/components/dialogs/document-move-to-folder-dialog';
import { DocumentDropZoneWrapper } from '~/components/general/document/chatspace-drop-zone-wrapper';
import { FolderGrid } from '~/components/general/folder/folder-grid';
import { DocumentsChatSpaceTable } from '~/components/tables/documents-chatspace-table';
import { useOptionalCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export function meta() {
  return appMetaTags('Documents');
}

const ZSearchParamsSchema = ZFindDocumentsInternalRequestSchema.pick({
  status: true,
  period: true,
  page: true,
  perPage: true,
  query: true,
}).extend({
  senderIds: z.string().transform(parseToIntegerArray).optional().catch([]),
});

const sortColumns = z.enum(['createdAt', 'title']);

export default function DocumentsPage() {
  const [searchParams] = useSearchParams();
  const { folderId } = useParams();
  const { t } = useLingui();

  const {
    filters,
    perPage,
    query,
    page,
    statusParams,
    joinOperator,
    columnOrder,
    columnDirection,
  } = useSortParams({ sortColumns });

  const [isMovingDocument, setIsMovingDocument] = useState(false);
  const [documentToMove, setDocumentToMove] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<Document | null>(null);

  const team = useOptionalCurrentTeam();

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );

  const { data, isLoading, isFetching, isLoadingError, refetch } =
    trpc.document.findDocumentsInternalUseToChat.useQuery(
      {
        page: page,
        perPage: perPage,
        senderIds: findDocumentSearchParams.senderIds,
        orderByColumn: columnOrder,
        orderByDirection: columnDirection as 'asc' | 'desc',
        filterStructure: filters,
        joinOperator: joinOperator,
        folderId,
      },
      queryOptions({
        queryKey: [
          'chatDocuments',
          page,
          perPage,
          query,
          statusParams,
          columnDirection,
          joinOperator,
          filters,
          folderId,
        ],
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        placeholderData: (previousData) => previousData,
      }),
    );
  const getFiles = trpc.document.getMultipleDocumentById.useMutation();

  const retryDocument = trpc.document.retryChatDocument.useMutation();

  useEffect(() => {
    void refetch();
  }, [team?.url]);

  const getTabHref = (value: keyof typeof ExtendedDocumentStatus) => {
    const params = new URLSearchParams(searchParams);

    params.set('status', value);

    if (value === ExtendedDocumentStatus.ALL) {
      params.delete('status');
    }

    if (params.has('page')) {
      params.delete('page');
    }

    return `${formatChatPath(team?.url)}?${params.toString()}`;
  };

  async function handleMultipleDownload(ids: number[]) {
    try {
      const files = await getFiles.mutateAsync({
        fileIds: ids,
      });

      if (files) {
        await downloadAnyFileMultiple({ multipleFiles: files });
      }
    } catch (error) {
      throw new Error('Error downloading files');
    }
  }

  const handleRetry = async (documenDataId: string, documentId: number) => {
    await retryDocument.mutateAsync(
      {
        documenDataId: documenDataId,
        documentId: documentId,
      },
      {
        onSuccess: () => {
          toast.success(t`Document retried successfully`);
        },
        onError: (error) => {
          toast.error(t`Error retrying document`);
          console.error('Error:', error);
        },
      },
    );
  };

  return (
    <DocumentDropZoneWrapper>
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
        <FolderGrid
          initialData={editingUser}
          setInitialData={setEditingUser}
          type={FolderType.CHAT}
          parentId={folderId ?? null}
        />

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-8">
          <div className="flex flex-row items-center">
            {team && (
              <Avatar className="dark:border-border mr-3 h-12 w-12 border-2 border-solid border-white">
                {team.avatarImageId && <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />}
                <AvatarFallback className="text-muted-foreground text-xs">
                  {team.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            )}

            <h2 className="text-4xl font-semibold">
              <Trans>Process Contracts</Trans>
            </h2>
          </div>

          <div className="-m-1 flex flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
            {/* {team && <DocumentsTableSenderFilter label="Members:" teamId={team.id} />} */}
          </div>
        </div>

        <div className="mt-8">
          <div>
            <DocumentsChatSpaceTable
              data={data}
              onMultipleDownload={handleMultipleDownload}
              isLoading={isLoading || isFetching}
              isLoadingError={isLoadingError}
              onHandleRetry={async (documentDataId: string, documentId: number) =>
                handleRetry(documentDataId, documentId)
              }
              onMoveDocument={(documentRow) => {
                setDocumentToMove(documentRow.id);
                setIsMovingDocument(true);
              }}
            />
          </div>
        </div>

        {documentToMove && (
          <DocumentMoveToFolderDialog
            documentId={documentToMove}
            type={FolderType.CHAT}
            open={isMovingDocument}
            currentFolderId={folderId}
            onOpenChange={(open) => {
              setIsMovingDocument(open);

              if (!open) {
                setDocumentToMove(null);
              }
            }}
          />
        )}
      </div>
    </DocumentDropZoneWrapper>
  );
}
