import { useLingui } from '@lingui/react/macro';
import type { ColumnDef } from '@tanstack/react-table';

import type { TFindIsrcSongsResponse } from '@documenso/trpc/server/isrcsong-router/schema';
import { StackAvatarsArtistWithTooltipNew } from '@documenso/ui/components/lpm/stack-avatars-artist-with-tooltip-new';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable } from '@documenso/ui/primitives/data-table-table';

import { useCurrentTeam } from '~/providers/team';

import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableExportAllData } from './data-table-export-all-data';
import { DataTableFilterList } from './data-table-filter-list';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableSortList } from './data-table-sort-list';
import { TableActionBar } from './table-action-bar';

interface DataTableProps<TData, TValue> {
  data?: TFindIsrcSongsResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onAdd: () => void;
  onEdit?: (data: DocumentsTableRow) => void;
  findAll?: () => Promise<TData[]>;

  onDelete?: (data: DocumentsTableRow) => void;
  onMultipleDelete: (ids: number[]) => Promise<void>;
  isMultipleDelete?: boolean;
  setIsMultipleDelete?: (value: boolean) => void;
}

type DocumentsTableRow = TFindIsrcSongsResponse['data'][number];

export const IsrcTable = ({
  data,
  isLoading,
  isLoadingError,
  onAdd,
  onEdit,
  findAll,
  onDelete,
  isMultipleDelete = false,
  setIsMultipleDelete,
  onMultipleDelete,
}: DataTableProps<DocumentsTableRow, DocumentsTableRow>) => {
  const { t, i18n } = useLingui();

  const team = useCurrentTeam();

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
        size: 20,
        maxSize: 20,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={'ID'} />,
        enableHiding: true,
        accessorKey: 'id',
        size: 20,
        maxSize: 20,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t`Date`} />,
        enableColumnFilter: true,
        accessorKey: 'date',
        meta: {
          label: t`Date`,
          variant: 'dateRange',
        },
        enableHiding: true,
      },
      {
        header: t`Artists`,
        enableColumnFilter: false,
        accessorKey: 'artists',
        enableHiding: true,
        cell: ({ row }) => {
          const artists = row.original.artists?.map((artist) => ({
            name: artist.name,
            id: artist.id,
          }));
          return <StackAvatarsArtistWithTooltipNew enhancedAssignees={artists || []} />;
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t`Title`} />,
        meta: {
          label: t`Title`,
          variant: 'text',
        },
        enableColumnFilter: true,
        accessorKey: 'trackName',
        enableHiding: true,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={t`ISRC`} />,
        meta: {
          label: t`ISRC`,
        },
        enableColumnFilter: true,
        accessorKey: 'isrc',
        enableHiding: true,
      },
      {
        accessorKey: 'duration',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t`Duration`} />,
        meta: {
          label: t`Duration`,
        },
        enableColumnFilter: true,
        enableHiding: true,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Album'} />,
        enableColumnFilter: true,
        meta: {
          label: 'Album',
          variant: 'text',
        },
        enableHiding: true,
      },
      {
        accessorKey: 'label',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t`Label`} />,
        meta: {
          label: t`Label`,
          variant: 'text',
        },
        enableHiding: true,
        enableColumnFilter: false,
      },
      {
        enableHiding: true,

        enableColumnFilter: true,
        accessorKey: 'license',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t`License`} />,
        meta: {
          label: t`License`,
          variant: 'text',
        },
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
