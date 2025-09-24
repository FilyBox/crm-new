import { useTransition } from 'react';

import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import type { TFindAllMusicResponse } from '@documenso/trpc/server/allMusic-router/schema';
import { StackAvatarsArtistWithTooltipNew } from '@documenso/ui/components/lpm/stack-avatars-artist-with-tooltip-new';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable } from '@documenso/ui/primitives/data-table-table';

import { useCurrentTeam } from '~/providers/team';

import { CsvImportManager } from '../general/allmusic/import-csv-allMusic';
import { LinksWithTooltip } from '../general/links-with-tooltip';
import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableExportAllData } from './data-table-export-all-data';
import { DataTableFilterList } from './data-table-filter-list';
import { DataTableSkeleton } from './data-table-skeleton';
import { TableActionBar } from './table-action-bar';
import { TableFilter } from './table-filter';

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
  isMultipleDelete = false,
  setIsMultipleDelete,
  onMultipleDelete,
}: DataTableProps<DocumentsTableRow, DocumentsTableRow>) => {
  const { _, i18n } = useLingui();
  const currentLanguage = i18n.locale;
  const team = useCurrentTeam();
  const [isPending, startTransition] = useTransition();

  const updateSearchParams = useUpdateSearchParams();

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
          label: 'title',
          variant: 'text',
        },
        enableHiding: true,
      },
      {
        accessorKey: 'recordLabel',
        header: 'Disquera',
        cell: ({ row }) => {
          return <div>{row.original.recordLabel?.name || '-'}</div>;
        },
        enableHiding: true,
        enableColumnFilter: false,
      },
      {
        header: 'Artists',
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
        accessorKey: 'isrcSong',
        enableHiding: true,
      },
      {
        header: 'Agregadora',
        enableColumnFilter: false,
        accessorKey: 'agregadora',
        cell: ({ row }) => {
          return <div>{row.original.agregadora?.name || '-'}</div>;
        },
        enableHiding: true,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Agregadora %'} />,
        accessorKey: 'agregadoraPercentage',
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
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Distribuidor %'} />,
        accessorKey: 'distribuidorPercentage',
        enableColumnFilter: true,
        enableHiding: true,
      },

      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Catálogo'} />,
        enableColumnFilter: true,
        accessorKey: 'catalog',
        enableHiding: true,
      },

      {
        accessorKey: 'videoLinks',
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Links de Video'} />,
        cell: ({ row }) => {
          return <LinksWithTooltip Links={row.original.videoLinks || []} position="bottom" />;
        },
        enableHiding: true,
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        accessorKey: 'generalLinks',
        header: ({ column }) => <DataTableColumnHeader column={column} title={'Links Generales'} />,
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

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
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

  const onPaginationChange = (page: number, perPage: number) => {
    startTransition(() => {
      updateSearchParams({
        page,
        perPage,
      });
    });
  };

  return (
    <div className="relative">
      <DataTable
        setIsMultipleDelete={setIsMultipleDelete}
        isMultipleDelete={isMultipleDelete}
        onDelete={onDelete}
        onEdit={onEdit}
        currentTeamMemberRole={team?.currentTeamRole}
        data={results.data}
        perPage={results.perPage}
        currentPage={results.currentPage}
        totalPages={results.totalPages}
        onPaginationChange={onPaginationChange}
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
          {/* <DataTableSortList table={table} align="start" loading={false} /> */}
          <DataTableFilterList
            loading={false}
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />

          <TableFilter
            data={allDataToFilter.data?.artists}
            isLoading={allDataToFilter.isLoading}
            label="Artist"
            searchParamsIdentifier="artistIds"
          />

          <TableFilter
            data={allDataToFilter.data?.agregadora}
            isLoading={allDataToFilter.isLoading}
            label="Agregadora"
            searchParamsIdentifier="agregadoraIds"
          />

          <TableFilter
            data={allDataToFilter.data?.recordLabel}
            isLoading={allDataToFilter.isLoading}
            label="Disquera"
            searchParamsIdentifier="recordLabelIds"
          />
          {findAll && (
            <DataTableExportAllData findAll={findAll} loading={isPending} columns={columns} />
          )}
          <CsvImportManager />
        </DataTableAdvancedToolbar>
      </DataTable>
    </div>
  );
};
