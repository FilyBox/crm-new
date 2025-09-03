import { useMemo } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { EventColor } from '@prisma/client';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { CheckIcon, CircleDashed, XIcon } from 'lucide-react';

import type { TFindEventResponse } from '@documenso/trpc/server/events-router/schema';
import { useDataTable } from '@documenso/ui/lib/use-data-table';

import { DataTableColumnHeader } from '../../tables/data-table-column-header';
import { DataTableFilterList } from '../../tables/data-table-filter-list';

type EventTableRow = TFindEventResponse['data'][number];

interface EventsFiltersProps {
  data?: TFindEventResponse;
  isLoading: boolean;
}

export function EventsFilters({ data, isLoading = false }: EventsFiltersProps) {
  const { _ } = useLingui();

  const createColumns = (): ColumnDef<EventTableRow>[] => {
    const columns: ColumnDef<EventTableRow>[] = [
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Name`)} />,
        accessorKey: 'name',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.name,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Description`)} />
        ),
        accessorKey: 'description',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.description || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Venue`)} />,
        accessorKey: 'venue',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.venue || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Beginning`)} />,
        accessorKey: 'beginning',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'beginning',
          variant: 'dateRange',
        },
        cell: ({ row }) =>
          row.original.beginning
            ? format(row.original.beginning, 'd MMM yyyy HH:mm', { locale: es })
            : '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`End`)} />,
        accessorKey: 'end',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'end',
          variant: 'dateRange',
        },
        cell: ({ row }) =>
          row.original.end ? format(row.original.end, 'd MMM yyyy HH:mm', { locale: es }) : '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Published`)} />,
        accessorKey: 'published',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'published',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.published === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`All Day`)} />,
        accessorKey: 'allDay',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'allDay',
          variant: 'boolean',
        },
        cell: ({ row }) => {
          if (row.original.allDay === true) {
            return (
              <div className="w-fit rounded bg-green-500 p-1 text-white">
                <CheckIcon size={16} />
              </div>
            );
          } else {
            return (
              <div className="w-fit rounded bg-red-500 p-1 text-white">
                <XIcon size={16} />
              </div>
            );
          }
        },
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Color`)} />,
        accessorKey: 'color',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'color',
          variant: 'multiSelect',
          options: EventColor
            ? Object.values(EventColor).map((color) => ({
                label: color.charAt(0).toUpperCase() + color.slice(1),
                value: color,
                icon: CircleDashed,
              }))
            : [
                { label: 'Blue', value: 'blue', icon: CircleDashed },
                { label: 'Orange', value: 'orange', icon: CircleDashed },
                { label: 'Violet', value: 'violet', icon: CircleDashed },
                { label: 'Rose', value: 'rose', icon: CircleDashed },
                { label: 'Emerald', value: 'emerald', icon: CircleDashed },
                { label: 'Sky', value: 'sky', icon: CircleDashed },
              ],
          icon: CircleDashed,
        },
        cell: ({ row }) => row.original.color || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Created`)} />,
        accessorKey: 'createdAt',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'createdAt',
          variant: 'dateRange',
        },
        cell: ({ row }) =>
          row.original.createdAt
            ? format(row.original.createdAt, 'd MMM yyyy HH:mm', { locale: es })
            : '-',
      },
    ];
    return columns;
  };

  const columns = useMemo(() => createColumns(), [_]);

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

  return (
    <DataTableFilterList
      loading={isLoading}
      table={table}
      shallow={shallow}
      debounceMs={debounceMs}
      throttleMs={throttleMs}
      align="start"
    />
  );
}
