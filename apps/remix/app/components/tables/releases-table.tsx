import { useTransition } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Release, TypeOfRelease } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CheckIcon, CircleDashed, XIcon } from 'lucide-react';
import { Link } from 'react-router';

import { useUpdateSearchParams } from '@documenso/lib/client-only/hooks/use-update-search-params';
import type {
  TFindReleaseInternalResponse,
  TFindReleaseResponse,
} from '@documenso/trpc/server/releases-router/schema';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable } from '@documenso/ui/primitives/data-table-table';

import { useCurrentTeam } from '~/providers/team';

import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableFilterList } from './data-table-filter-list';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableSortList } from './data-table-sort-list';
import { TableActionBar } from './table-action-bar';

interface DataTableProps<TData, TValue> {
  data?: TFindReleaseResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onAdd: () => void;
  onRetry?: (data: ReleaseTableRow) => void;
  releaseTyleCounts: TFindReleaseInternalResponse['type'];
  releasesCount: TFindReleaseInternalResponse['release'];
  onEdit?: (data: ReleaseTableRow) => void;
  onMultipleDelete: (ids: number[]) => Promise<void>;
  isMultipleDelete?: boolean;
  setIsMultipleDelete?: (value: boolean) => void;
  onDelete?: (data: ReleaseTableRow) => void;
  onNavegate?: (data: ReleaseTableRow) => void;
  onMoveDocument?: (data: ReleaseTableRow) => void;
}

type ReleaseTableRow = TFindReleaseResponse['data'][number];

export const ReleasesTable = ({
  data,
  isLoading,
  isLoadingError,
  onEdit,
  onDelete,
  onMultipleDelete,
  isMultipleDelete = false,
  setIsMultipleDelete,
}: DataTableProps<ReleaseTableRow, ReleaseTableRow>) => {
  const { _, i18n } = useLingui();
  const currentLanguage = i18n.locale;
  const team = useCurrentTeam();
  const [isPending, startTransition] = useTransition();

  const updateSearchParams = useUpdateSearchParams();

  const createColumns = (): ColumnDef<ReleaseTableRow>[] => {
    const columns: ColumnDef<ReleaseTableRow>[] = [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Created`)} />,
        accessorKey: 'createdAt',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'startDate',
          variant: 'dateRange',
        },
        cell: ({ row }) =>
          row.original.createdAt
            ? format(row.original.createdAt, 'd MMM yyyy HH:mm', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Date`)} />,
        accessorKey: 'date',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'date',
          variant: 'dateRange',
        },
        cell: ({ row }) =>
          row.original.date
            ? format(row.original.date, 'd MMM yyyy', {
                locale: currentLanguage === 'es' ? es : enUS,
              })
            : '-',
      },

      {
        // header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Artists`)} />,
        accessorKey: 'artists',
        enableHiding: true,
        enableColumnFilter: false,
        cell: ({ row }) => row.original.artists,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Lanzamiento`)} />
        ),
        accessorKey: 'lanzamiento',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.lanzamiento || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Type`)} />,
        accessorKey: 'typeOfRelease',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.typeOfRelease || '-',
        meta: {
          label: 'typeOfRelease',
          variant: 'multiSelect',
          options: Object.values(TypeOfRelease).map((status) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: status,
            // count: releaseTyleCounts[status],
            icon: CircleDashed,
          })),
          icon: CircleDashed,
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Release`)} />,
        accessorKey: 'release',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'release',
          variant: 'multiSelect',
          options: Object.values(Release).map((status) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: status,
            // count: releasesCount[status],
            icon: CircleDashed,
          })),
          icon: CircleDashed,
        },
        cell: ({ row }) => row.original.release || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Uploaded`)} />,
        accessorKey: 'uploaded',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.uploaded || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Streaming Link`)} />
        ),
        accessorKey: 'streamingLink',
        enableHiding: true,
        cell: ({ row }) =>
          row.original.streamingLink ? (
            <Link
              to={row.original.streamingLink}
              className="text-primary hover:underline"
              target="_blank"
            >
              Link
            </Link>
          ) : (
            '-'
          ),
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Assets`)} />,
        accessorKey: 'assets',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'assets',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.assets === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.assets === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Canvas`)} />,
        accessorKey: 'canvas',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'canvas',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.canvas === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.canvas === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Cover`)} />,
        accessorKey: 'cover',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'cover',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.cover === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.cover === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Audio`)} />,
        accessorKey: 'audioWAV',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'audioWAV',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.audioWAV === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.audioWAV === false) {
            return (
              <div className="w-fit rounded bg-red-500 px-2 py-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Video`)} />,
        accessorKey: 'video',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'video',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.video === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.video === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Banners`)} />,
        accessorKey: 'banners',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'banners',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.banners === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.banners === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Pitch`)} />,
        accessorKey: 'pitch',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'pitch',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.pitch === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.pitch === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`EPK`)} />,
        accessorKey: 'EPKUpdates',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'epkUpdates',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.EPKUpdates === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.EPKUpdates === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`WebSite Updates`)} />
        ),
        accessorKey: 'WebSiteUpdates',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'webSiteUpdates',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.WebSiteUpdates === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.WebSiteUpdates === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Biography`)} />,
        accessorKey: 'Biography',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'biography',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.Biography === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else if (row.original.Biography === false) {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          } else {
            return <span className="text-muted-foreground">-</span>;
          }
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
      <DataTable
        setIsMultipleDelete={setIsMultipleDelete}
        isMultipleDelete={isMultipleDelete}
        onDelete={onDelete}
        onEdit={onEdit}
        currentTeamMemberRole={team.currentTeamRole}
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
            currentTeamMemberRole={team.currentTeamRole}
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
        </DataTableAdvancedToolbar>
      </DataTable>
    </>
  );
};
