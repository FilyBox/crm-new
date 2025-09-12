import { useEffect, useMemo, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { DocumentSource, FolderType, OrganisationType } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router';
import { Link } from 'react-router';
import { z } from 'zod';

import { downloadAnyFileMultiple } from '@documenso/lib/client-only/download-any-file-multiple';
import { useCurrentOrganisation } from '@documenso/lib/client-only/providers/organisation';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import { ExtendedDocumentStatus } from '@documenso/prisma/types/extended-document-status';
import { trpc } from '@documenso/trpc/react';
import {
  type TFindDocumentsInternalResponse,
  ZFindDocumentsInternalRequestSchema,
} from '@documenso/trpc/server/document-router/schema';
import type { TFindDocumentsResponse } from '@documenso/trpc/server/document-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';
import { Tabs, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';

import { DocumentMoveToFolderDialog } from '~/components/dialogs/document-move-to-folder-dialog';
import { DocumentDropZoneWrapper } from '~/components/general/document/document-drop-zone-wrapper';
import { DocumentSearch } from '~/components/general/document/document-search';
import { DocumentStatus } from '~/components/general/document/document-status';
import { FolderGrid } from '~/components/general/folder/folder-grid';
import { PeriodSelector } from '~/components/general/period-selector';
import { DocumentsTableSenderFilter } from '~/components/tables/documents-table-sender-filter';
import { DocumentsTable } from '~/components/tables/new-documents-table';
import { useCurrentTeam } from '~/providers/team';
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
  const organisation = useCurrentOrganisation();
  const team = useCurrentTeam();

  const { filters, joinOperator, columnDirection } = useSortParams({ sortColumns });

  const { folderId } = useParams();
  const [searchParams] = useSearchParams();

  const [isMovingDocument, setIsMovingDocument] = useState(false);
  const [documentToMove, setDocumentToMove] = useState<number | null>(null);

  const [stats, setStats] = useState<TFindDocumentsInternalResponse['stats']>({
    [ExtendedDocumentStatus.DRAFT]: 0,
    [ExtendedDocumentStatus.PENDING]: 0,
    [ExtendedDocumentStatus.COMPLETED]: 0,
    [ExtendedDocumentStatus.REJECTED]: 0,
    [ExtendedDocumentStatus.INBOX]: 0,
    [ExtendedDocumentStatus.ALL]: 0,
  });

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );

  const { data, isLoading, isFetching, isLoadingError } =
    trpc.document.findDocumentsInternal.useQuery(
      {
        ...findDocumentSearchParams,
        folderId,
        source: DocumentSource.DOCUMENT,
        orderByDirection: columnDirection as 'asc' | 'desc',
        filterStructure: filters,
        joinOperator: joinOperator,
      },
      queryOptions({
        queryKey: [
          'Documents',
          findDocumentSearchParams,
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

  const getTabHref = (value: keyof typeof ExtendedDocumentStatus) => {
    const params = new URLSearchParams(searchParams);

    params.set('status', value);

    if (value === ExtendedDocumentStatus.ALL) {
      params.delete('status');
    }

    if (value === ExtendedDocumentStatus.INBOX && organisation.type === OrganisationType.PERSONAL) {
      params.delete('status');
    }

    if (params.has('page')) {
      params.delete('page');
    }

    let path = formatDocumentsPath(team.url);

    if (folderId) {
      path += `/f/${folderId}`;
    }

    if (params.toString()) {
      path += `?${params.toString()}`;
    }

    return path;
  };

  useEffect(() => {
    if (data?.stats) {
      setStats(data.stats);
    }
  }, [data?.stats]);

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
  const documentRootPath = formatDocumentsPath(team?.url);

  const handleOnNavigate = (document: TFindDocumentsResponse['data'][number]) => {
    const documentPath = `${documentRootPath}/${document.id}`;
    window.location.href = documentPath;
  };

  return (
    <DocumentDropZoneWrapper>
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8">
        <FolderGrid type={FolderType.DOCUMENT} parentId={folderId ?? null} />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-8">
          <div className="flex flex-row items-center">
            <Avatar className="dark:border-border mr-3 h-12 w-12 border-2 border-solid border-white">
              {team.avatarImageId && <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />}
              <AvatarFallback className="text-muted-foreground text-xs">
                {team.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>

            <h2 className="text-4xl font-semibold">
              <Trans>Created Contracts</Trans>
            </h2>
          </div>

          <div className="-m-1 flex flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
            <Tabs value={findDocumentSearchParams.status || 'ALL'} className="overflow-x-auto">
              <TabsList>
                {[
                  ExtendedDocumentStatus.INBOX,
                  ExtendedDocumentStatus.PENDING,
                  ExtendedDocumentStatus.COMPLETED,
                  ExtendedDocumentStatus.DRAFT,
                  ExtendedDocumentStatus.ALL,
                ]
                  .filter((value) => {
                    if (organisation.type === OrganisationType.PERSONAL) {
                      return value !== ExtendedDocumentStatus.INBOX;
                    }

                    return true;
                  })
                  .map((value) => (
                    <TabsTrigger
                      key={value}
                      className="hover:text-foreground min-w-[60px]"
                      value={value}
                      asChild
                    >
                      <Link to={getTabHref(value)} preventScrollReset>
                        <DocumentStatus status={value} />

                        {value !== ExtendedDocumentStatus.ALL && (
                          <span className="ml-1 inline-block opacity-50">{stats[value]}</span>
                        )}
                      </Link>
                    </TabsTrigger>
                  ))}
              </TabsList>
            </Tabs>

            {team && <DocumentsTableSenderFilter teamId={team.id} />}

            <div className="flex w-48 flex-wrap items-center justify-between gap-x-2 gap-y-4">
              <PeriodSelector />
            </div>
            <div className="flex w-48 flex-wrap items-center justify-between gap-x-2 gap-y-4">
              <DocumentSearch initialValue={findDocumentSearchParams.query} />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div>
            <DocumentsTable
              data={data}
              onMultipleDownload={handleMultipleDownload}
              isLoading={isLoading || isFetching}
              isLoadingError={isLoadingError}
              onMoveDocument={(documentRow) => {
                setDocumentToMove(documentRow.id);
                setIsMovingDocument(true);
              }}
              onNavegate={handleOnNavigate}
            />
          </div>
        </div>

        {/* <div className="mt-8">
          <div>
            {data && data.count === 0 ? (
              <DocumentsTableEmptyState
                status={findDocumentSearchParams.status || ExtendedDocumentStatus.ALL}
              />
            ) : (
              <DocumentsTable
                data={data}
                isLoading={isLoading}
                isLoadingError={isLoadingError}
                onMoveDocument={(documentId) => {
                  setDocumentToMove(documentId);
                  setIsMovingDocument(true);
                }}
              />
            )}
          </div>
        </div> */}

        {documentToMove && (
          <DocumentMoveToFolderDialog
            documentId={documentToMove}
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
