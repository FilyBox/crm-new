import { useLingui } from '@lingui/react';
import type { TeamMemberRole } from '@prisma/client';
import { ContractStatus, ExpansionPossibility } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { CircleDashed } from 'lucide-react';

import type { TFindContractsResponse } from '@documenso/trpc/server/contracts-router/schema';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable } from '@documenso/ui/primitives/data-table-table';

import { useOptionalCurrentTeam } from '~/providers/team';

import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableFilterList } from './data-table-filter-list';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableSortList } from './data-table-sort-list';
import { TableActionBar } from './table-action-bar';

interface DataTableProps<TData, TValue> {
  data?: TFindContractsResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onAdd: () => void;
  onRetry?: (data: DocumentsTableRow) => void;
  currentTeamMemberRole?: TeamMemberRole;

  onEdit?: (data: DocumentsTableRow) => void;
  onMultipleDelete: (ids: number[]) => Promise<void>;
  onDelete?: (data: DocumentsTableRow) => void;
  onNavegate?: (data: DocumentsTableRow) => void;
  onMoveDocument?: (data: DocumentsTableRow) => void;
}

type DocumentsTableRow = TFindContractsResponse['data'][number];

export const ContractsTable = ({
  data,
  isLoading,
  isLoadingError,
  onRetry,
  onEdit,
  onNavegate,
  onMultipleDelete,
  onDelete,
  onMoveDocument,
}: DataTableProps<DocumentsTableRow, DocumentsTableRow>) => {
  const { _, i18n } = useLingui();

  // if (onEdit) {
  //   console.warn('onEdit dei');
  // }
  // if (onDelete) {
  //   console.warn('onDelete dei');
  // }
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
        accessorKey: 'id',
        header: 'ID',
        maxSize: 20,
        enableResizing: false,
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
        enableHiding: true,
        enableColumnFilter: true,
        enableResizing: true,
      },
      {
        accessorKey: 'fileName',
        header: ({ column }) => <DataTableColumnHeader column={column} title="FileName" />,
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'artists',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Individuals involved" />
        ),
        enableHiding: true,
        enableSorting: false,
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="StartDate" />,
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'startDate',
          variant: 'dateRange',
        },
      },
      {
        accessorKey: 'endDate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="EndDate" />,
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'endDate',
          variant: 'dateRange',
        },
      },
      {
        accessorKey: 'isPossibleToExpand',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Expandable" />,
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'isPossibleToExpand',
          variant: 'multiSelect',
          options: Object.values(ExpansionPossibility).map((possibility) => ({
            label: possibility.charAt(0).toUpperCase() + possibility.slice(1),
            value: possibility,
            // count: possibilityCounts[possibility], // Assuming you have a way to count these
            icon: CircleDashed,
          })),
        },
      },
      {
        accessorKey: 'possibleExtensionTime',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ExtensionTime" />,
        enableHiding: true,
        meta: {
          label: 'posibleExtensionTime',
          variant: 'boolean',

          icon: CircleDashed,
        },
      },

      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'Status',
          variant: 'multiSelect',
          options: Object.values(ContractStatus).map((status) => ({
            label: status.charAt(0).toUpperCase() + status.slice(1),
            value: status,
            // count: statusCounts[status],
            icon: CircleDashed,
          })),
          icon: CircleDashed,
        },
      },
      {
        accessorKey: 'documentId',
        header: ({ column }) => <DataTableColumnHeader column={column} title="DocumentID" />,
        enableHiding: true,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="CreatedAt" />,
        enableHiding: true,
      },
      {
        accessorKey: 'summary',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Summary" />,
        enableHiding: true,
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
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    defaultColumn: {
      columns,
      enableColumnFilter: false,
      enableResizing: true,
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
    <>
      <DataTable
        columnSizeVars={columnSizeVars}
        onDelete={onDelete}
        onEdit={onEdit}
        expandibleCardHeightCollapsed={330}
        expandibleCardHeightExpanded={700}
        currentTeamMemberRole={team?.currentTeamRole}
        onRetry={onRetry}
        onNavegate={onNavegate}
        data={results.data}
        onMoveDocument={onMoveDocument}
        error={{
          enable: isLoadingError || false,
        }}
        skeleton={{
          enable: isLoading || false,
          rows: 5,
          component: (
            <DataTableSkeleton
              columnCount={columns.length}
              cellWidths={['2rem', '2rem', '2rem', '10rem', '6rem', '6rem', '6rem']}
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
        </DataTableAdvancedToolbar>
      </DataTable>
    </>
  );
};
