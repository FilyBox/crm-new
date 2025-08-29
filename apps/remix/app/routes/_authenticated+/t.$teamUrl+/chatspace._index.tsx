import { useEffect, useMemo, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { z } from 'zod';

import { FolderType } from '@documenso/lib/types/folder-type';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { formatChatPath } from '@documenso/lib/utils/teams';
import { type Document } from '@documenso/prisma/client';
import { ExtendedDocumentStatus } from '@documenso/prisma/types/extended-document-status';
import { trpc } from '@documenso/trpc/react';
import { ZFindDocumentsInternalRequestSchema } from '@documenso/trpc/server/document-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';
import { useToast } from '@documenso/ui/primitives/use-toast';

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

  const {
    filters,
    applyFilters,
    perPage,
    query,
    page,
    statusParams,
    joinOperator,
    columnOrder,
    columnDirection,
  } = useSortParams({ sortColumns });

  console.log('page', page, 'perPage', perPage, 'query', query, 'statusParams', statusParams);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMovingDocument, setIsMovingDocument] = useState(false);
  const [documentToMove, setDocumentToMove] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<Document | null>(null);

  const team = useOptionalCurrentTeam();

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );

  // console.log

  console.log('columnOrder', columnOrder);
  console.log('columnDirection', columnDirection);

  const { data, isLoading, isLoadingError, refetch } =
    trpc.document.findDocumentsInternalUseToChat.useQuery({
      page: page,
      perPage: perPage,
      senderIds: findDocumentSearchParams.senderIds,
      orderByColumn: columnOrder,
      orderByDirection: columnDirection as 'asc' | 'desc',
      filterStructure: applyFilters ? filters : [],
      joinOperator: joinOperator,
    });

  const retryDocument = trpc.document.retryChatDocument.useMutation();

  const {
    data: foldersData,
    isLoading: isFoldersLoading,
    refetch: refetchFolders,
  } = trpc.folder.getFolders.useQuery({
    type: FolderType.CHAT,
    parentId: null,
  });

  useEffect(() => {
    void refetch();
    void refetchFolders();
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

  const navigateToFolder = (folderId?: string | null) => {
    const documentsPath = formatChatPath(team?.url);

    if (folderId) {
      void navigate(`${formatChatPath(team?.url)}/f/${folderId}`);
    } else {
      void navigate(documentsPath);
    }
  };

  const handleRetry = async (documenDataId: string, documentId: number) => {
    try {
      const result = await retryDocument.mutateAsync({
        documenDataId: documenDataId,
        documentId: documentId,
      });

      toast({
        description: 'Attempting to retry',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Error',
      });
      console.error('Error:', error);
    }
  };

  const handleViewAllFolders = () => {
    void navigate(`${formatChatPath(team?.url)}/folders`);
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
              <Trans>Chat with documents</Trans>
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
              isLoading={isLoading}
              isLoadingError={isLoadingError}
              onHandleRetry={async (documentDataId: string, documentId: number) =>
                handleRetry(documentDataId, documentId)
              }
              onMoveDocument={(documentRow) => {
                console.log('Moving document jiji:', documentRow.id);
                setDocumentToMove(documentRow.id);
                setIsMovingDocument(true);
              }}
            />
          </div>
        </div>
      </div>
    </DocumentDropZoneWrapper>
  );
}
