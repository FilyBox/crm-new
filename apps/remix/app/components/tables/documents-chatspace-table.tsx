import { useMemo, useTransition } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { DocumentStatus as StatusOptions } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CircleDashed } from 'lucide-react';
import { Link } from 'react-router';
import { match } from 'ts-pattern';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { isDocumentCompleted } from '@documenso/lib/utils/document';
import { formatDocumentsPath } from '@documenso/lib/utils/teams';
import type { TFindDocumentsResponse } from '@documenso/trpc/server/document-router/schema';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable } from '@documenso/ui/primitives/data-table-table';

import { DocumentStatus } from '~/components/general/document/document-status';
import { useCurrentTeam } from '~/providers/team';

import { ChatTableActionDropdown } from './chat-table-action-dropdown';
import { ChatTableActionButton } from './chatspace-table-action-button';
import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { DataTableFilterList } from './data-table-filter-list';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableSortList } from './data-table-sort-list';
import { TableActionBar } from './table-action-bar';

ChatTableActionDropdown;
export type DocumentsTableProps = {
  data?: TFindDocumentsResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onMultipleDownload?: (ids: number[]) => Promise<void>;
  onMoveDocument?: (data: DocumentsTableRow) => void;
  onHandleRetry?: (documenDataId: string, documentId: number) => void;
};

type DocumentsTableRow = TFindDocumentsResponse['data'][number];

export const DocumentsChatSpaceTable = ({
  data,
  isLoading,
  isLoadingError,
  onMoveDocument,
  onMultipleDownload,
  onHandleRetry,
}: DocumentsTableProps) => {
  const { _, i18n } = useLingui();
  const currentLanguage = i18n.locale;

  const team = useCurrentTeam();
  const [isPending, startTransition] = useTransition();
  const updateSearchParams = useUpdateSearchParams();

  const columns = useMemo((): ColumnDef<DocumentsTableRow>[] => {
    const columns: ColumnDef<DocumentsTableRow>[] = [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },

      {
        header: _(msg`createdAt`),
        accessorKey: 'createdAt',
        meta: {
          label: 'createdAt',
          variant: 'dateRange',
        },
        enableColumnFilter: true,
        enableSorting: true,
        cell: ({ row }) =>
          row.original.createdAt
            ? format(row.original.createdAt, 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: _(msg`Title`),
        enableColumnFilter: true,
        enableHiding: true,
        accessorKey: 'title',
        cell: ({ row }) => <DataTableTitle row={row.original} teamUrl={team.url} />,
      },
      {
        id: 'uploader',
        enableSorting: false,
        enableHiding: false,
        header: _(msg`Uploader`),
        accessorKey: 'uploader',
        cell: ({ row }) => row.original.user.name ?? row.original.user.email,
      },
      // {
      //   header: _(msg`Status`),
      //   accessorKey: 'status',
      //   cell: ({ row }) => <DocumentStatus status={row.original.status} />,
      //   size: 140,
      // },
      {
        accessorKey: 'status',
        header: _(msg`Status`),
        cell: ({ row }) => <DocumentStatus status={row.original.status} />,

        enableHiding: true,
        enableColumnFilter: true,
        enableSorting: false,
        meta: {
          label: 'status',
          variant: 'multiSelect',
          options: Object.values(StatusOptions).map((status) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: status,
            // count: statusCounts[status],
            icon: CircleDashed,
          })),
          icon: CircleDashed,
        },
      },
      {
        header: _(msg`Actions`),
        enableSorting: false,
        enableHiding: false,
        accessorKey: 'actions',
        cell: ({ row }) =>
          (!row.original.deletedAt || isDocumentCompleted(row.original.status)) && (
            <div className="flex items-center gap-x-4">
              <ChatTableActionButton row={row.original} />
              <ChatTableActionDropdown
                row={row.original}
                onMoveDocument={onMoveDocument ? () => onMoveDocument(row.original) : undefined}
                onHandleRetry={
                  onHandleRetry
                    ? () => onHandleRetry(row.original.documentDataId, row.original.id)
                    : undefined
                }
              />
            </div>
          ),
      },
    ];
    return columns;
  }, [team, onMoveDocument, onHandleRetry]);

  // const columns = createColumns();

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data?.data || [],
    columns,
    pageCount: data?.totalPages || 1,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    defaultColumn: {
      columns,
      enableColumnFilter: false,
    },
    getRowId: (originalRow) => originalRow.id.toString(),
    shallow: false,
    clearOnDefault: true,
  });

  const onPaginationChange = (page: number, perPage: number) => {
    startTransition(() => {
      updateSearchParams({
        page,
        perPage,
      });
    });
  };

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <>
      <DataTable<DocumentsTableRow>
        currentTeamMemberRole={team.currentTeamRole}
        // onRetry={onRetry}
        data={results.data}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={onPaginationChange}
        onMoveDocument={onMoveDocument}
        columnVisibility={{
          sender: team !== undefined,
        }}
        error={{
          enable: isLoadingError || false,
        }}
        skeleton={{
          enable: isLoading || false,
          rows: 5,
          component: (
            <DataTableSkeleton columnCount={columns.length} cellWidths={['0.5rem']} shrinkZero />
          ),
        }}
        table={table}
        actionBar={
          <TableActionBar
            table={table}
            onMultipleDownload={onMultipleDownload}
            loading={isLoading || false}
            currentTeamMemberRole={team?.currentTeamRole}
          />
        }
      >
        <DataTableAdvancedToolbar loading={false} table={table}>
          <DataTableSortList table={table} align="start" loading={false} />
          <DataTableFilterList
            loading={isLoading || false}
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
        </DataTableAdvancedToolbar>
      </DataTable>
    </>
  );
};

type DataTableTitleProps = {
  row: DocumentsTableRow;
  teamUrl: string;
};

const DataTableTitle = ({ row, teamUrl }: DataTableTitleProps) => {
  const { user } = useSession();

  const recipient = row.recipients.find((recipient) => recipient.email === user.email);

  const isOwner = row.user.id === user.id;
  const isRecipient = !!recipient;
  const isCurrentTeamDocument = teamUrl && row.team?.url === teamUrl;

  const documentsPath = formatDocumentsPath(teamUrl);
  const formatPath = row.folderId
    ? `/chatspace/f/${row.folderId}/${row.id}`
    : `/chatspace/${row.id}`;

  return match({
    isOwner,
    isRecipient,
    isCurrentTeamDocument,
  })
    .with({ isOwner: true }, { isCurrentTeamDocument: true }, () => (
      <p
        // to={formatPath}
        title={row.title}
        className="block max-w-[10rem] truncate font-medium md:max-w-[20rem]"
      >
        {row.title}
      </p>
    ))
    .with({ isRecipient: true }, () => (
      <Link
        to={`/sign/${recipient?.token}`}
        title={row.title}
        className="block max-w-[10rem] truncate font-medium hover:underline md:max-w-[20rem]"
      >
        {row.title}
      </Link>
    ))
    .otherwise(() => (
      <span className="block max-w-[10rem] truncate font-medium hover:underline md:max-w-[20rem]">
        {row.title}
      </span>
    ));
};
