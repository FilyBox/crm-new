import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { TypeOfTuStreams } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CircleDashed } from 'lucide-react';

import type { TFindTuStreamsResponse } from '@documenso/trpc/server/tustreams-router/schema';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable } from '@documenso/ui/primitives/data-table-table';

import { useOptionalCurrentTeam } from '~/providers/team';

import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableExportAllData } from './data-table-export-all-data';
import { DataTableFilterList } from './data-table-filter-list';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableSortList } from './data-table-sort-list';
import { TableActionBar } from './table-action-bar';

interface DataTableProps<TData, TValue> {
  data?: TFindTuStreamsResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onAdd: () => void;
  onEdit?: (data: DocumentsTableRow) => void;
  onDelete?: (data: DocumentsTableRow) => void;
  onMultipleDelete: (ids: number[]) => Promise<void>;
  findAll?: () => Promise<TData[]>;
}

type DocumentsTableRow = TFindTuStreamsResponse['data'][number];

export const TuStreamsTable = ({
  data,
  isLoading,
  isLoadingError,
  onEdit,
  findAll,
  onDelete,
  onMultipleDelete,
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
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Date`)} />,
        accessorKey: 'date',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'date',
          variant: 'date',
        },
        cell: ({ row }) =>
          row.original.date
            ? format(row.original.date, 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Title`)} />,
        accessorKey: 'title',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.title || '-',
      },
      {
        header: _(msg`Artists`),

        accessorKey: 'artists',
        enableHiding: true,
        enableSorting: false,

        cell: ({ row }) => row.original.artists || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Type`)} />,
        accessorKey: 'type',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.type || '-',
        meta: {
          label: 'tpye',
          variant: 'multiSelect',
          options: Object.values(TypeOfTuStreams).map((possibility) => ({
            label: possibility.charAt(0).toUpperCase() + possibility.slice(1),
            value: possibility,
            // count: possibilityCounts[possibility], // Assuming you have a way to count these
            icon: CircleDashed,
          })),
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`UPC`)} />,
        accessorKey: 'UPC',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.UPC || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`total`)} />,
        accessorKey: 'total',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'total',
          variant: 'number',
        },
        cell: ({ row }) => row.original.total || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`CreatedAt`)} />,
        accessorKey: 'createdAt',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'createdAt',
          variant: 'date',
        },
        cell: ({ row }) =>
          row.original.createdAt
            ? format(row.original.createdAt, 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
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
            onMultipleDelete={onMultipleDelete}
            table={table}
            loading={isLoading || false}
            currentTeamMemberRole={team?.currentTeamRole}
          />
        }
      >
        <DataTableAdvancedToolbar loading={false} table={table}>
          <DataTableSortList table={table} align="start" loading={false} />
          <DataTableFilterList
            loading={false}
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
          {findAll && (
            <DataTableExportAllData
              findAll={findAll}
              loading={isLoading || false}
              columns={columns}
            />
          )}
        </DataTableAdvancedToolbar>
      </DataTable>
    </div>
  );
};
