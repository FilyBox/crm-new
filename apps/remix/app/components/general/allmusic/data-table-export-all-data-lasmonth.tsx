import * as React from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';

import { trpc } from '@documenso/trpc/react';
import { exportTableToCSV } from '@documenso/ui/lib/export';
import { Button } from '@documenso/ui/primitives/button';

interface DataTableExportAllDataProps<TData> {
  loading: boolean;
  columns: ColumnDef<TData>[];
  filename?: string;
}

export function DataTableExportAllDataLastMonth<TData>({
  loading,
  columns,
  filename,
}: DataTableExportAllDataProps<TData>) {
  const { _ } = useLingui();
  const findAllMusicNoPaginationMutation = trpc.allMusic.findAllMusicLastMonth.useMutation();

  const [exportData, setExportData] = React.useState<TData[]>([]);
  const [isExporting, setIsExporting] = React.useState(false);
  const table = useReactTable({
    columns,
    data: exportData,
    getCoreRowModel: getCoreRowModel(),
  });

  const ExportAll = async () => {
    setIsExporting(true);
    try {
      const data = await findAllMusicNoPaginationMutation.mutateAsync();

      setExportData((data || []) as TData[]);
      //toca esperar a que se actualice la tabla antes de exportar
      setTimeout(() => {
        exportTableToCSV(table, {
          excludeColumns: ['select', 'actions', 'id'],
          onlySelected: false,
          filename: filename,
        });
      }, 0);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={ExportAll}
      loading={isExporting}
      disabled={loading || isExporting}
    >
      {isExporting ? _(msg`Exporting`) : _(msg`Report Last Month`)}
    </Button>
  );
}
