import React from 'react';

import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { addDays, format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { toast as sonnertoast } from 'sonner';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './context-menu';
import { Skeleton } from './skeleton';
import { TableBody, TableCell, TableRow } from './table';

interface DataTableBodyProps<TData> {
  table: TanstackTable<TData>;
  data?: TData[];
  onEdit?: (data: TData) => void;
  onDelete?: (data: TData) => void;
  onNavegate?: (data: TData) => void;
  onRetry?: (data: TData) => void;
  onMoveDocument?: (data: TData) => void;
  from?: string;
  canEditDelete?: boolean;
  skeleton?: {
    enable: boolean;
    rows: number;
    component?: React.ReactNode;
  };
}

function DataTableBodyComponent<TData>({
  table,
  onEdit,
  onDelete,
  onNavegate,
  onRetry,
  onMoveDocument,
  skeleton,
  canEditDelete,
}: DataTableBodyProps<TData>) {
  const { i18n } = useLingui();
  const currentLanguage = i18n.locale;

  const dateColumnIds = [
    'releaseDate',
    'originalReleaseDate',
    'createdAt',
    'date',
    'preOrderDate',
    'lastProcessDate',
    'timedReleaseDate',
    'timedReleaseMusicServices',
    'importDate',
    'instantGratificationDate',
    'submittedAt',
    'lastModified',
  ];

  return (
    <TableBody>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row) => (
          <ContextMenu key={row.id}>
            <ContextMenuTrigger asChild className="h-fit w-fit">
              <TableRow
                data-state={row.getIsSelected() && 'selected'}
                className="hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{
                      width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                    }}
                  >
                    {/* Your existing cell rendering logic here */}
                    {cell.column.id === 'summary' && cell.getValue() ? (
                      <span title={cell.getValue() as string}>
                        {(cell.getValue() as string).length > 50
                          ? `${(cell.getValue() as string).substring(0, 50)}...`
                          : (cell.getValue() as string)}
                      </span>
                    ) : dateColumnIds.includes(cell.column.id) ? (
                      `${
                        cell.getValue()
                          ? format(cell.getValue() as Date, 'd MMM yyyy', {
                              locale: currentLanguage === 'es' ? es : enUS,
                            })
                          : '-'
                      }`
                    ) : cell.column.id === 'endDate' || cell.column.id === 'startDate' ? (
                      `${
                        cell.getValue()
                          ? format(addDays(cell.getValue() as Date, 1), 'd MMM yyyy', {
                              locale: currentLanguage === 'es' ? es : enUS,
                            })
                          : '-'
                      }`
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </ContextMenuTrigger>
            <ContextMenuContent className="z-[60] w-40 text-center">
              {onEdit && canEditDelete && (
                <ContextMenuItem
                  className="text-center"
                  onClick={() => {
                    onEdit(row.original);
                  }}
                  inset
                >
                  <Trans>Edit</Trans>
                </ContextMenuItem>
              )}

              {onNavegate && (
                <ContextMenuItem
                  onClick={() => {
                    onNavegate(row.original);
                  }}
                  inset
                >
                  <Trans>View</Trans>
                </ContextMenuItem>
              )}

              {onRetry && (
                <ContextMenuItem
                  onClick={() => {
                    onRetry(row.original);
                  }}
                  inset
                >
                  <Trans>Retry</Trans>
                </ContextMenuItem>
              )}

              {onMoveDocument && (
                <ContextMenuItem
                  onClick={() => {
                    onMoveDocument(row.original);
                  }}
                  inset
                >
                  <Trans>Move To Folder</Trans>
                </ContextMenuItem>
              )}

              {onDelete && canEditDelete && (
                <ContextMenuItem
                  onClick={() => {
                    sonnertoast.warning('Esta acción sera permanente', {
                      description: 'Estas seguro que quieres eliminar este elemento?',
                      action: {
                        label: 'Eliminar',
                        onClick: () => onDelete(row.original),
                      },
                      className: 'mb-16 ',
                      position: 'bottom-center',
                      closeButton: true,
                    });
                  }}
                  inset
                >
                  <Trans>Delete</Trans>
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))
      ) : skeleton?.enable ? (
        Array.from({ length: skeleton.rows }).map((_, i) => (
          <TableRow key={`skeleton-row-${i}`}>{skeleton.component ?? <Skeleton />}</TableRow>
        ))
      ) : (
        <></>
      )}
    </TableBody>
  );
}

// Memoized version for better performance during resizing
export const MemoizedDataTableBody = React.memo(DataTableBodyComponent, (prev, next) => {
  // Only re-render if the actual data changes, not during column resizing
  return (
    prev.table.options.data === next.table.options.data &&
    prev.table.getState().rowSelection === next.table.getState().rowSelection
  );
}) as typeof DataTableBodyComponent;

export { DataTableBodyComponent };
