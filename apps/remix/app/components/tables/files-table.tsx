import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

import type { TFindFilesInternalResponse } from '@documenso/trpc/server/files-router/schema';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable } from '@documenso/ui/primitives/data-table-table';

import { useOptionalCurrentTeam } from '~/providers/team';

import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableSkeleton } from './data-table-skeleton';
import { TableActionDropdown } from './files-table-action-dropdown';
import { TableActionBar } from './table-action-bar';

interface DataTableProps<TData, TValue> {
  data?: TFindFilesInternalResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onAdd?: () => void;
  onEdit?: (data: DocumentsTableRow) => void;
  onDelete?: (data: DocumentsTableRow) => void;
  onMultipleDelete?: (ids: number[]) => Promise<void>;
  onMultipleDownload?: (ids: number[]) => Promise<void>;
  isMultipleDelete?: boolean;
  setIsMultipleDelete?: (value: boolean) => void;
  onMoveDocument?: (documentId: number) => void;
  onHandleRetry?: (documenDataId: string, documentId: number) => void;
}

type DocumentsTableRow = TFindFilesInternalResponse['data'][number];

export const FilesTable = ({
  data,
  isLoading,
  isLoadingError,
  onEdit,
  onDelete,
  onMoveDocument,
  onHandleRetry,
  onMultipleDelete,
  onMultipleDownload,
}: DataTableProps<DocumentsTableRow, DocumentsTableRow>) => {
  const { _, i18n } = useLingui();
  const currentLanguage = i18n.locale;
  const team = useOptionalCurrentTeam();

  const createColumns = (): ColumnDef<DocumentsTableRow>[] => {
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
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Title`)} />,
        accessorKey: 'title',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.title || '-',
      },

      {
        id: 'uploader',
        header: _(msg`uploader`),
        cell: ({ row }) => row.original.user.name ?? row.original.user.email,
      },

      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`CreatedAt`)} />,
        accessorKey: 'createdAt',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.createdAt
            ? format(row.original.createdAt, 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: _(msg`Actions`),
        cell: ({ row }) =>
          !row.original.deletedAt && (
            <div className="flex items-center gap-x-4">
              <TableActionDropdown
                row={row.original}
                onMoveDocument={onMoveDocument ? () => onMoveDocument(row.original.id) : undefined}
                onHandleRetry={
                  onHandleRetry
                    ? () => onHandleRetry(row.original.fileDataId, row.original.id)
                    : undefined
                }
              />
            </div>
          ),
      },
    ];
    return columns;
  };

  const columns = createColumns();

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

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <div className="relative">
      <DataTable
        onDelete={onDelete}
        onEdit={onEdit}
        currentTeamMemberRole={team?.currentTeamRole}
        data={results.data}
        from="tustreams"
        error={{
          enable: isLoadingError || false,
        }}
        skeleton={{
          enable: isLoading || false,
          rows: 5,
          component: (
            <DataTableSkeleton
              columnCount={columns.length}
              cellWidths={['3rem', '3rem', '3rem', '3rem', '2rem', '2rem', '2rem']}
              shrinkZero
            />
          ),
        }}
        table={table}
        actionBar={
          <TableActionBar
            onMultipleDownload={onMultipleDownload}
            onMultipleDelete={onMultipleDelete}
            table={table}
            download={true}
            loading={isLoading || false}
            currentTeamMemberRole={team?.currentTeamRole}
          />
        }
      >
        {/* <DataTableAdvancedToolbar loading={isLoading || false} table={table}>
          <DataTableSortList table={table} align="start" loading={isLoading || false} />
          <DataTableFilterList
            loading={isLoading || false}
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
        </DataTableAdvancedToolbar> */}
      </DataTable>
    </div>
  );
};
