import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import type { ColumnDef } from '@tanstack/react-table';
import { DateTime } from 'luxon';

import type { TFindDistributionInternalResponse } from '@documenso/trpc/server/distributionStatement-router/schema';
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

export type DocumentsTableProps = {
  data?: TFindDistributionInternalResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onMoveDocument?: (documentId: number) => void;
  onAdd: () => void;
  onEdit?: (data: DocumentsTableRow) => void;
  onDelete?: (data: DocumentsTableRow) => void;
};

interface DataTableProps<TData, TValue> {
  data?: TFindDistributionInternalResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onMoveDocument?: (documentId: number) => void;
  findAll?: () => Promise<TData[]>;

  onAdd?: () => void;
  onEdit?: (data: DocumentsTableRow) => void;
  onDelete?: (data: DocumentsTableRow) => void;
  onMultipleDelete: (ids: number[]) => Promise<void>;
  isMultipleDelete?: boolean;
  setIsMultipleDelete?: (value: boolean) => void;
}

type DocumentsTableRow = TFindDistributionInternalResponse['data'][number];

export const DistributionTable = ({
  data,
  isLoading,
  isLoadingError,
  onMoveDocument,
  findAll,
  onEdit,
  onDelete,
  onMultipleDelete,
}: DataTableProps<DocumentsTableRow, DocumentsTableRow>) => {
  const { _, i18n } = useLingui();

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
        size: 40,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`ID`)} />,
        enableHiding: true,
        enableColumnFilter: false,
        accessorKey: 'id',
        cell: ({ row }) => row.original.id,
      },
      {
        enableHiding: true,
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Marketing Owner`)} />
        ),
        accessorKey: 'marketingOwner',
        cell: ({ row }) => row.original.marketingOwner || '-',
      },
      {
        enableHiding: true,
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Nombre Distribución`)} />
        ),
        accessorKey: 'nombreDistribucion',
        cell: ({ row }) => row.original.nombreDistribucion || '-',
      },
      {
        enableHiding: true,
        enableColumnFilter: true,
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Proyecto`)} />,
        accessorKey: 'proyecto',
        cell: ({ row }) => row.original.proyecto || '-',
      },
      {
        enableHiding: true,
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Número de Catálogo`)} />
        ),
        accessorKey: 'numeroDeCatalogo',
        cell: ({ row }) => row.original.numeroDeCatalogo || '-',
      },
      {
        enableHiding: true,
        enableColumnFilter: true,
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`UPC`)} />,
        accessorKey: 'upc',
        cell: ({ row }) => row.original.upc || '-',
      },
      {
        enableHiding: true,
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Local Product Number`)} />
        ),
        accessorKey: 'localProductNumber',
        cell: ({ row }) => row.original.localProductNumber || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`ISRC`)} />,
        enableHiding: true,
        enableColumnFilter: true,
        accessorKey: 'isrc',
        cell: ({ row }) => row.original.isrc || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Título Catálogo`)} />
        ),
        enableHiding: true,
        enableColumnFilter: true,
        accessorKey: 'tituloCatalogo',
        cell: ({ row }) => row.original.tituloCatalogo || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Mes Reportado`)} />
        ),
        enableHiding: true,
        enableColumnFilter: true,
        accessorKey: 'mesReportado',
        cell: ({ row }) => (row.original.mesReportado ? String(row.original.mesReportado) : '-'),
      },
      {
        header: _(msg`Territorio`),
        enableHiding: true,
        accessorKey: 'distributionStatementMusicPlatforms',
        cell: ({ row }) => {
          const platforms = row.original.distributionStatementMusicPlatforms;
          if (!platforms || platforms.length === 0) return '-';

          // If you want to display all platform names, join them with commas
          return platforms[0]?.name;

          // Or if you want to display just the first platform name:
          // return platforms[0]?.name || '-';
        },
      },
      {
        enableHiding: true,
        enableColumnFilter: true,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Código del Territorio`)} />
        ),
        accessorKey: 'codigoDelTerritorio',

        cell: ({ row }) => row.original.codigoDelTerritorio || '-',
      },

      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Nombre del Territorio`)} />
        ),
        enableHiding: true,
        enableColumnFilter: false,
        accessorKey: 'distributionStatementTerritories',
        cell: ({ row }) => {
          const territories = row.original.distributionStatementTerritories;
          if (!territories || territories.length === 0) return '-';

          return territories[0]?.name;
        },
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Tipo de Precio`)} />
        ),
        accessorKey: 'tipoDePrecio',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.tipoDePrecio || '-',
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Tipo de Ingreso`)} />
        ),
        accessorKey: 'tipoDeIngreso',
        enableHiding: true,
        enableColumnFilter: true,
        cell: ({ row }) => row.original.tipoDeIngreso || '-',
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Venta`)} />,
        accessorKey: 'venta',
        cell: ({ row }) => (row.original.venta !== null ? String(row.original.venta) : '-'),
        meta: {
          label: 'venta',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`RTL`)} />,
        accessorKey: 'rtl',
        cell: ({ row }) => (row.original.rtl !== null ? row.original.rtl : '-'),
        meta: {
          label: 'rtl',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`PPD`)} />,
        accessorKey: 'ppd',
        cell: ({ row }) => (row.original.ppd !== null ? row.original.ppd : '-'),
        meta: {
          label: 'ppd',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`RBP`)} />,
        accessorKey: 'rbp',
        cell: ({ row }) => (row.original.rbp !== null ? row.original.rbp : '-'),
        meta: {
          label: 'rbp',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Tipo de Cambio`)} />
        ),
        accessorKey: 'tipoDeCambio',
        cell: ({ row }) => (row.original.tipoDeCambio !== null ? row.original.tipoDeCambio : '-'),
        meta: {
          label: 'tipoDeCambio',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Valor Recibido`)} />
        ),
        accessorKey: 'valorRecibido',
        cell: ({ row }) => (row.original.valorRecibido !== null ? row.original.valorRecibido : '-'),
        meta: {
          label: 'valorRecibido',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Regalías Artísticas`)} />
        ),
        accessorKey: 'regaliasArtisticas',
        cell: ({ row }) =>
          row.original.regaliasArtisticas !== null ? String(row.original.regaliasArtisticas) : '-',
        meta: {
          label: 'regaliasArtisticas',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Costo Distribución`)} />
        ),
        accessorKey: 'costoDistribucion',
        cell: ({ row }) =>
          row.original.costoDistribucion !== null ? row.original.costoDistribucion : '-',
        meta: {
          label: 'costoDistribucion',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => <DataTableColumnHeader column={column} title={_(msg`Copyright`)} />,
        accessorKey: 'copyright',
        cell: ({ row }) => (row.original.copyright !== null ? String(row.original.copyright) : '-'),
        meta: {
          label: 'copyright',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Cuota Administración`)} />
        ),
        accessorKey: 'cuotaAdministracion',
        cell: ({ row }) =>
          row.original.cuotaAdministracion !== null
            ? String(row.original.cuotaAdministracion)
            : '-',
        meta: {
          label: 'cuotaAdministracion',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Costo Carga`)} />
        ),
        accessorKey: 'costoCarga',
        cell: ({ row }) =>
          row.original.costoCarga !== null ? String(row.original.costoCarga) : '-',
        meta: {
          label: 'costoCarga',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Otros Costos`)} />
        ),
        accessorKey: 'otrosCostos',
        cell: ({ row }) =>
          row.original.otrosCostos !== null ? String(row.original.otrosCostos) : '-',
        meta: {
          label: 'otrosCostos',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Ingresos Recibidos`)} />
        ),
        accessorKey: 'ingresosRecibidos',
        cell: ({ row }) =>
          row.original.ingresosRecibidos !== null ? row.original.ingresosRecibidos : '-',
        meta: {
          label: 'ingresosRecibidos',
          variant: 'number',
        },
        enableHiding: true,
        enableColumnFilter: true,
      },
      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Fecha de Creación`)} />
        ),
        accessorKey: 'createdAt',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'createdAt',
          variant: 'date',
        },
        cell: ({ row }) =>
          i18n.date(row.original.createdAt, { ...DateTime.DATETIME_SHORT, hourCycle: 'h12' }),
      },

      {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={_(msg`Última Actualización`)} />
        ),
        accessorKey: 'updatedAt',
        enableHiding: true,
        enableColumnFilter: true,
        meta: {
          label: 'updatedAt',
          variant: 'date',
        },
        cell: ({ row }) =>
          i18n.date(row.original.updatedAt, { ...DateTime.DATETIME_SHORT, hourCycle: 'h12' }),
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
