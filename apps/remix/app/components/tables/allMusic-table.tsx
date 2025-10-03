import { useTransition } from 'react';

import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

import type { TFindAllMusicResponse } from '@documenso/trpc/server/allMusic-router/schema';
import { StackAvatarsArtistWithTooltipNew } from '@documenso/ui/components/lpm/stack-avatars-artist-with-tooltip-new';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable } from '@documenso/ui/primitives/data-table-table';

import { useCurrentTeam } from '~/providers/team';

import { DataTableExportAllDataLastMonth } from '../general/allmusic/data-table-export-all-data-lasmonth';
import { DataTableFilterList } from '../general/allmusic/data-table-filter-list-allmusic';
import { CsvImportManager } from '../general/allmusic/import-csv-allMusic';
import { LinksWithTooltip } from '../general/links-with-tooltip';
import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableExportAllData } from './data-table-export-all-data';
import { DataTableSkeleton } from './data-table-skeleton';
import { TableActionBar } from './table-action-bar';

interface DataTableProps<TData, TValue> {
  data?: TFindAllMusicResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  allDataToFilter: any;
  onAdd?: () => void;
  onEdit?: (data: DocumentsTableRow) => void;
  findAll?: () => Promise<TData[]>;
  onDelete?: (data: DocumentsTableRow) => void;
  onMultipleDelete: (ids: number[]) => Promise<void>;
  isMultipleDelete?: boolean;
  setIsMultipleDelete?: (value: boolean) => void;
}

type DocumentsTableRow = TFindAllMusicResponse['data'][number];

export const AllMusicTable = ({
  data,
  isLoading,
  isLoadingError,
  onEdit,
  findAll,
  allDataToFilter,
  onDelete,
  onMultipleDelete,
}: DataTableProps<DocumentsTableRow, DocumentsTableRow>) => {
  const { _, i18n } = useLingui();
  const currentLanguage = i18n.locale;
  const team = useCurrentTeam();
  const [isPending, startTransition] = useTransition();

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
        header: ({ column }) => <DataTableColumnHeader column={column} title={'ID'} />,
        enableHiding: true,
        accessorKey: 'id',
        size: 20,
      },
      {
        accessorKey: 'publishedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Lanzamiento'} />,
        meta: {
          label: 'Lanzamiento',
          variant: 'dateRange',
        },
        cell: ({ row }) =>
          row.original.publishedAt
            ? format(new Date(row.original.publishedAt), 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
        enableColumnFilter: true,
        enableHiding: true,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Title`)} />,
        enableColumnFilter: true,
        accessorKey: 'title',
        meta: {
          label: _(msg`Title`),
          variant: 'text',
        },
        enableHiding: true,
      },
      {
        accessorKey: 'recordLabel',
        header: _(msg`Record label`),
        cell: ({ row }) => {
          return <div>{row.original.recordLabel?.name || '-'}</div>;
        },
        enableHiding: true,
        meta: {
          label: _(msg`Record label`),
        },
        enableColumnFilter: false,
      },
      {
        header: _(msg`Artists`),
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
        header: ({ column }) => <DataTableColumnHeader column={column} title={'UPC'} />,
        enableColumnFilter: true,
        accessorKey: 'UPC',
        enableHiding: true,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={'ISRC'} />,
        enableColumnFilter: true,
        meta: {
          label: 'ISRC',
        },
        accessorKey: 'isrcSong',
        enableHiding: true,
      },
      {
        header: _(msg`Agregator`),
        meta: {
          label: _(msg`Agregator`),
        },
        enableColumnFilter: false,
        accessorKey: 'agregadora',
        cell: ({ row }) => {
          return <div>{row.original.agregadora?.name || '-'}</div>;
        },
        enableHiding: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Agregator %`)} />
        ),
        accessorKey: 'agregadoraPercentage',
        meta: {
          label: _(msg`Agregator %`),
        },
        enableColumnFilter: true,
        enableHiding: true,
      },
      {
        header: 'Distribuidor',
        enableColumnFilter: false,
        accessorKey: 'distribuidor',
        cell: ({ row }) => {
          return <div>{row.original.distribuidor?.name || '-'}</div>;
        },
        enableHiding: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Distributor %`)} />
        ),
        accessorKey: 'distribuidorPercentage',
        meta: {
          label: _(msg`Distributor %`),
        },
        enableColumnFilter: true,
        enableHiding: true,
      },

      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Catalog`)} />,
        enableColumnFilter: true,
        meta: {
          label: _(msg`Catalog`),
        },
        accessorKey: 'catalog',
        enableHiding: true,
      },

      {
        accessorKey: 'videoLinks',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Video Links`)} />
        ),
        meta: {
          label: _(msg`Video Links`),
        },
        cell: ({ row }) => {
          return <LinksWithTooltip Links={row.original.videoLinks || []} position="bottom" />;
        },
        enableHiding: true,
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        accessorKey: 'generalLinks',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`General Links`)} />
        ),
        meta: {
          label: _(msg`General Links`),
        },
        cell: ({ row }) => {
          return <LinksWithTooltip Links={row.original.generalLinks || []} position="bottom" />;
        },
        enableHiding: true,
        enableColumnFilter: false,
        enableSorting: false,
      },
    ];
    return columns;
  };

  const columns = createColumns();

  const { table, shallow, debounceMs, throttleMs, columnSizeVars } = useDataTable({
    data: data?.data || [],
    columns,
    pageCount: data?.totalPages || 1,
    enableAdvancedFilter: true,
    initialState: {
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
        isLoading={isLoading || false}
        columnSizeVars={columnSizeVars}
        onDelete={onDelete}
        onEdit={onEdit}
        expandibleCardHeightCollapsed={220}
        expandibleCardHeightExpanded={300}
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
          <DataTableFilterList
            loading={false}
            table={table}
            shallow={shallow}
            allDataToFilter={allDataToFilter}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />

          {findAll && (
            <DataTableExportAllData
              filename={`all-music-${Date.now()}`}
              findAll={findAll}
              loading={isPending}
              columns={columns}
            />
          )}

          <DataTableExportAllDataLastMonth
            filename={`songs-last-month-${Date.now()}`}
            loading={isPending}
            columns={columns}
          />
          <CsvImportManager />
        </DataTableAdvancedToolbar>
      </DataTable>
    </div>
  );
};
