import { useTransition } from 'react';

import { msg } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import type { TeamMemberRole } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import type { TFindLpmResponse } from '@documenso/trpc/server/lpm-router/schema';
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
  data?: TFindLpmResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onAdd: () => void;
  onEdit?: (data: DocumentsTableRow) => void;
  currentTeamMemberRole?: TeamMemberRole;

  onDelete?: (data: DocumentsTableRow) => void;
  findAll?: () => Promise<TData[]>;

  onMultipleDelete: (ids: number[]) => Promise<void>;
  isMultipleDelete?: boolean;
  setIsMultipleDelete?: (value: boolean) => void;
}

type DocumentsTableRow = TFindLpmResponse['data'][number];

export const LpmTable = ({
  data,
  isLoading,
  isLoadingError,
  onAdd,
  currentTeamMemberRole,
  findAll,
  onEdit,
  onDelete,
  isMultipleDelete = false,
  setIsMultipleDelete,
  onMultipleDelete,
}: DataTableProps<DocumentsTableRow, DocumentsTableRow>) => {
  const { _, i18n } = useLingui();
  const currentLanguage = i18n.locale;
  const team = useOptionalCurrentTeam();
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
      // {
      //   header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`ID`)} />,
      //   accessorKey: 'id',
      //   enableHiding: true,
      //   enableColumnFilter: true,
      //   cell: ({ row }) => row.original.id || '-',
      // },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product ID`)} />
        ),
        accessorKey: 'productId',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productId || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product Type`)} />
        ),
        accessorKey: 'productType',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productType || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product Title`)} />
        ),
        accessorKey: 'productTitle',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productTitle || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product Version`)} />
        ),
        accessorKey: 'productVersion',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productVersion || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product Display Artist`)} />
        ),
        accessorKey: 'productDisplayArtist',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productDisplayArtist || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Parent Label`)} />
        ),
        accessorKey: 'parentLabel',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.parentLabel || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Label`)} />,
        accessorKey: 'label',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.label || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Original Release Date`)} />
        ),
        accessorKey: 'originalReleaseDate',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.originalReleaseDate
            ? format(new Date(row.original.originalReleaseDate), 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Release Date`)} />
        ),
        accessorKey: 'releaseDate',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.releaseDate
            ? format(new Date(row.original.releaseDate), 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`UPC`)} />,
        accessorKey: 'upc',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.upc || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Catalog`)} />,
        accessorKey: 'catalog',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.catalog || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product Price Tier`)} />
        ),
        accessorKey: 'productPriceTier',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productPriceTier || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product Genre`)} />
        ),
        accessorKey: 'productGenre',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productGenre || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Submission Status`)} />
        ),
        accessorKey: 'submissionStatus',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.submissionStatus || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product C Line`)} />
        ),
        accessorKey: 'productCLine',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productCLine || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product P Line`)} />
        ),
        accessorKey: 'productPLine',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productPLine || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`PreOrder Date`)} />
        ),
        accessorKey: 'preOrderDate',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.preOrderDate
            ? format(new Date(row.original.preOrderDate), 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Exclusives`)} />
        ),
        accessorKey: 'exclusives',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.exclusives || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Explicit Lyrics`)} />
        ),
        accessorKey: 'explicitLyrics',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.explicitLyrics || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Product Play Link`)} />
        ),
        accessorKey: 'productPlayLink',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.productPlayLink || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Liner Notes`)} />
        ),
        accessorKey: 'linerNotes',
        enableHiding: true,
        enableColumnFilter: true,
        size: 50,
        maxSize: 50,
        cell: ({ row }) => row.original.linerNotes || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Primary Metadata Language`)} />
        ),
        accessorKey: 'primaryMetadataLanguage',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.primaryMetadataLanguage || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Compilation`)} />
        ),
        accessorKey: 'compilation',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.compilation || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`PDF Booklet`)} />
        ),
        accessorKey: 'pdfBooklet',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.pdfBooklet || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Timed Release Date`)} />
        ),
        accessorKey: 'timedReleaseDate',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.timedReleaseDate
            ? format(new Date(row.original.timedReleaseDate), 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Timed Release Music Services`)} />
        ),
        accessorKey: 'timedReleaseMusicServices',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.timedReleaseMusicServices || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Last Process Date`)} />
        ),
        accessorKey: 'lastProcessDate',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.lastProcessDate
            ? format(new Date(row.original.lastProcessDate), 'd MMM yyyy HH:mm', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Import Date`)} />
        ),
        accessorKey: 'importDate',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.importDate
            ? format(new Date(row.original.importDate), 'd MMM yyyy HH:mm', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Created By`)} />
        ),
        accessorKey: 'createdBy',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.createdBy || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Last Modified`)} />
        ),
        accessorKey: 'lastModified',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.lastModified
            ? format(new Date(row.original.lastModified), 'd MMM yyyy HH:mm', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Submitted At`)} />
        ),
        accessorKey: 'submittedAt',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.submittedAt
            ? format(new Date(row.original.submittedAt), 'd MMM yyyy HH:mm', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Submitted By`)} />
        ),
        accessorKey: 'submittedBy',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.submittedBy || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Vevo Channel`)} />
        ),
        accessorKey: 'vevoChannel',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.vevoChannel || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Type`)} />
        ),
        accessorKey: 'trackType',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackType || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Track ID`)} />,
        accessorKey: 'trackId',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackId || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Volume`)} />
        ),
        accessorKey: 'trackVolume',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackVolume || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Number`)} />
        ),
        accessorKey: 'trackNumber',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackNumber || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Name`)} />
        ),
        accessorKey: 'trackName',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackName || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Version`)} />
        ),
        accessorKey: 'trackVersion',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackVersion || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Display Artist`)} />
        ),
        accessorKey: 'trackDisplayArtist',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackDisplayArtist || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`ISRC`)} />,
        accessorKey: 'isrc',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.isrc || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Price Tier`)} />
        ),
        accessorKey: 'trackPriceTier',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackPriceTier || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Genre`)} />
        ),
        accessorKey: 'trackGenre',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackGenre || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Audio Language`)} />
        ),
        accessorKey: 'audioLanguage',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.audioLanguage || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track C Line`)} />
        ),
        accessorKey: 'trackCLine',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackCLine || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track P Line`)} />
        ),
        accessorKey: 'trackPLine',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackPLine || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Writers/Composers`)} />
        ),
        accessorKey: 'writersComposers',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.writersComposers || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Publishers/Collection Societies`)} />
        ),
        accessorKey: 'publishersCollectionSocieties',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.publishersCollectionSocieties || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Withhold Mechanicals`)} />
        ),
        accessorKey: 'withholdMechanicals',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.withholdMechanicals || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`PreOrder Type`)} />
        ),
        accessorKey: 'preOrderType',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.preOrderType || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Instant Gratification Date`)} />
        ),
        accessorKey: 'instantGratificationDate',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) =>
          row.original.instantGratificationDate
            ? format(new Date(row.original.instantGratificationDate), 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Duration`)} />,
        accessorKey: 'duration',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.duration || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Sample Start Time`)} />
        ),
        accessorKey: 'sampleStartTime',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.sampleStartTime || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Explicit Lyrics Track`)} />
        ),
        accessorKey: 'explicitLyricsTrack',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.explicitLyricsTrack || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Album Only`)} />
        ),
        accessorKey: 'albumOnly',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.albumOnly || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Lyrics`)} />,
        accessorKey: 'lyrics',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.lyrics || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={_(msg`Additional Contributors (Performing)`)}
          />
        ),
        accessorKey: 'additionalContributorsPerforming',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.additionalContributorsPerforming || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={_(msg`Additional Contributors (Non-Performing)`)}
          />
        ),
        accessorKey: 'additionalContributorsNonPerforming',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.additionalContributorsNonPerforming || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Producers`)} />,
        accessorKey: 'producers',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.producers || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Continuous Mix`)} />
        ),
        accessorKey: 'continuousMix',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.continuousMix || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={_(msg`Continuously Mixed Individual Song`)}
          />
        ),
        accessorKey: 'continuouslyMixedIndividualSong',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.continuouslyMixedIndividualSong || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Track Play Link`)} />
        ),
        accessorKey: 'trackPlayLink',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.trackPlayLink || '-',
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
      sorting: [{ id: 'id', desc: true }],
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
    artist: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <DataTable
      from="lpm"
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
            columnCount={10}
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
          table={table}
          shallow={shallow}
          debounceMs={debounceMs}
          loading={false}
          throttleMs={throttleMs}
          align="start"
        />
        {findAll && (
          <DataTableExportAllData findAll={findAll} loading={isPending} columns={columns} />
        )}
      </DataTableAdvancedToolbar>
    </DataTable>
  );
};
