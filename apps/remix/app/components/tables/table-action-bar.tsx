import * as React from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import NumberFlow from '@number-flow/react';
import { TeamMemberRole } from '@prisma/client';
import type { Table } from '@tanstack/react-table';
import { AnimatePresence, type Transition, type Variants, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Trash2,
} from 'lucide-react';
import { toast as sonnertoast, useSonner } from 'sonner';
import { toast } from 'sonner';
import { match } from 'ts-pattern';

import { trpc } from '@documenso/trpc/react';
import { exportTableToCSV } from '@documenso/ui/lib/export';
import { Button } from '@documenso/ui/primitives/button';
import {
  DataTableActionBar,
  DataTableActionBarSelection,
} from '@documenso/ui/primitives/data-table-action-bar';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@documenso/ui/primitives/select';
import { Separator } from '@documenso/ui/primitives/separator';

const CONTAINER_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    width: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    width: 'auto',
    scale: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
      width: {
        duration: 0.3,
      },
      scale: {
        duration: 0.2,
      },
    },
  },
  exit: {
    opacity: 0,
    width: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const ITEM_VARIANTS: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

interface DataTablePaginationProps<TData extends { id: number }>
  extends React.ComponentProps<'div'> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  loading: boolean;
  currentTeamMemberRole?: TeamMemberRole;
  download?: boolean;
  onMultipleDownload?: (ids: number[]) => Promise<void>;
  onMultipleDelete?: (ids: number[]) => Promise<void>;
}

export function TableActionBar<TData extends { id: number }>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  loading,
  download,
  currentTeamMemberRole,
  onMultipleDelete,
  onMultipleDownload,
}: DataTablePaginationProps<TData>) {
  const { toasts } = useSonner();

  function removeAllToasts() {
    toasts.forEach((t) => toast.dismiss(t.id));
  }

  const rows = table.getFilteredSelectedRowModel().rows;

  const [isPending, startTransition] = React.useTransition();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const isOperationPending = React.useMemo(() => {
    return isDownloading || isPending;
  }, [isDownloading, isPending]);

  const getFiles = trpc.files.getMultipleDocumentById.useMutation();

  const BUTTON_MOTION_CONFIG = {
    initial: 'rest',
    whileHover: 'hover',
    whileTap: 'tap',
    variants: {
      rest: { maxWidth: '32px' },
      hover: {
        maxWidth: '140px',
        transition: { type: 'spring', stiffness: 200, damping: 35, delay: 0.15 },
      },
      disabled: { maxWidth: '32px' },
      tap: { scale: 0.95 },
    },
    transition: { type: 'spring', stiffness: 250, damping: 25 },
  } as const;

  const LABEL_VARIANTS: Variants = {
    rest: { opacity: 0, x: 4 },
    hover: { opacity: 1, x: 0, visibility: 'visible' },
    tap: { opacity: 1, x: 0, visibility: 'visible' },
  };

  const LABEL_TRANSITION: Transition = {
    type: 'spring',
    stiffness: 200,
    damping: 25,
  };

  const { _ } = useLingui();

  // async function handleDownload() {
  //   try {
  //     const files = await getFiles.mutateAsync({
  //       fileIds: rows.map((row) => row.original.id),
  //     });

  //     if (files) {
  //       await downloadAnyFileMultiple({ multipleFiles: files });
  //     }
  //   } catch (error) {
  //     console.log('error downloading files:', error);
  //     throw new Error('Error downloading files');
  //   }
  // }

  const handleMultipleDownload = () => {
    try {
      const ids = rows.map((row) => row.original.id);
      if (onMultipleDownload) {
        setIsDownloading(true);
        toast.promise(onMultipleDownload(ids), {
          loading: _(msg`Downloading files...`),
          success: () => {
            setIsDownloading(false);
            return _(msg`Files downloaded successfully`);
          },
          error: () => {
            setIsDownloading(false);
            return _(msg`Error downloading files`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        });
      }
    } catch (error) {
      toast.error(_(msg`Error downloading files`));
      console.error('Error downloading files:', error);
    }
  };

  const handleMultipleDelete = () => {
    try {
      const ids = rows.map((row) => row.original.id);
      if (onMultipleDelete) {
        setIsDownloading(true);
        toast.promise(onMultipleDelete(ids), {
          loading: _(msg`Deleting records...`),
          success: () => {
            setIsDownloading(false);
            return _(msg`Records deleted successfully`);
          },
          error: () => {
            setIsDownloading(false);
            return _(msg`Error deleting records`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        });
      }
    } catch (error) {
      toast.error(_(msg`Error deleting records`));
      console.error('Error deleting record:', error);
    }
  };

  const onTaskExport = React.useCallback(() => {
    startTransition(() => {
      exportTableToCSV(table, {
        excludeColumns: ['select', 'actions'],
        onlySelected: true,
      });
    });
  }, [table]);

  const canEditDelete = match(currentTeamMemberRole)
    .with(TeamMemberRole.ADMIN, () => true)
    .with(TeamMemberRole.MANAGER, () => false)
    .with(TeamMemberRole.MEMBER, () => false)
    .otherwise(() => true);

  const canExport = match(currentTeamMemberRole)
    .with(TeamMemberRole.ADMIN, () => true)
    .with(TeamMemberRole.MANAGER, () => true)
    .with(TeamMemberRole.MEMBER, () => false)
    .otherwise(() => true);

  return (
    <DataTableActionBar className="z-[55] min-h-[57px]" table={table} visible={true}>
      <div className="flex flex-col items-center gap-1.5 sm:flex-row">
        <div className="flex w-full items-center justify-between space-x-2 sm:w-fit sm:justify-center">
          <p className="whitespace-nowrap text-sm font-medium">
            <Trans>Per page</Trans>
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-full sm:w-[4.5rem] [&[data-size]]:h-8">
              <NumberFlow value={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top" className="z-[60] mb-2">
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Separator
          orientation="vertical"
          className="hidden data-[orientation=vertical]:h-5 sm:block"
        />
        <div className="mx-auto flex w-full shrink-0 items-center justify-between gap-1 sm:w-fit sm:justify-center">
          <Button
            size={'icon'}
            className="h-fit w-fit p-2"
            variant={'secondary'}
            aria-label="Go to first page"
            onClick={() => table.setPageIndex(0)}
            disabled={loading || !table.getCanPreviousPage()}
          >
            <ChevronsLeft size={16} />
          </Button>
          <Button
            size={'icon'}
            className="h-fit w-fit p-2"
            variant={'secondary'}
            disabled={loading || table.getState().pagination.pageIndex + 1 === 1}
            onClick={() => table.previousPage()}
          >
            <ChevronLeft size={16} />
          </Button>
          <div className="mr-3 flex items-center text-sm tabular-nums">
            <span className="text-muted-foreground flex min-w-5 items-end justify-end">
              <NumberFlow value={table.getState().pagination.pageIndex + 1} />
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              /{' '}
              {loading ? (
                <div className="h-4 w-5 animate-pulse rounded-sm bg-slate-200/50" />
              ) : (
                table.getPageCount()
              )}
            </span>
          </div>
          <Button
            size={'icon'}
            className="h-fit w-fit p-2"
            variant={'secondary'}
            disabled={loading || table.getState().pagination.pageIndex + 1 === table.getPageCount()}
            onClick={() => table.nextPage()}
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            size={'icon'}
            variant={'secondary'}
            className="h-fit w-fit p-2"
            aria-label="Go to first page"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={loading || !table.getCanNextPage()}
          >
            <ChevronsRight size={16} />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {rows.length > 0 && (
            <motion.div
              layout
              layoutRoot
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={CONTAINER_VARIANTS}
              className="mx-auto flex flex-wrap items-center space-x-2 overflow-hidden sm:flex-nowrap"
              style={{ originX: 0 }}
            >
              <motion.div layout variants={ITEM_VARIANTS} className="flex-shrink-0">
                <Separator
                  orientation="vertical"
                  className="hidden data-[orientation=vertical]:h-5 sm:block"
                />
              </motion.div>
              <motion.div layout variants={ITEM_VARIANTS} className="flex-shrink-0">
                <DataTableActionBarSelection table={table} />
              </motion.div>
              {canExport ||
                (canEditDelete && onMultipleDelete && (
                  <motion.div layout variants={ITEM_VARIANTS} className="flex-shrink-0">
                    <Separator
                      orientation="vertical"
                      className="hidden data-[orientation=vertical]:h-5 sm:block"
                    />
                  </motion.div>
                ))}

              {canEditDelete && onMultipleDelete && (
                <motion.div layout variants={ITEM_VARIANTS} className="flex-shrink-0">
                  <motion.button
                    {...BUTTON_MOTION_CONFIG}
                    className={`flex h-8 w-auto items-center gap-2 overflow-hidden whitespace-nowrap rounded-lg bg-red-200/60 p-2 ${isOperationPending ? 'cursor-not-allowed text-red-500 opacity-50 dark:!text-red-200' : 'text-red-600 dark:text-red-300'} dark:bg-red-800/80`}
                    aria-label="Reject"
                    disabled={isOperationPending}
                    onClick={() => {
                      removeAllToasts();
                      sonnertoast.warning('Esta acción sera permanente', {
                        description: 'Estas seguro que quieres eliminar estos registros?',
                        action: {
                          label: 'Eliminar',
                          onClick: () => handleMultipleDelete(),
                        },
                        className: 'mb-16',
                        position: 'bottom-center',
                        closeButton: true,
                      });
                    }}
                  >
                    <Trash2 size={16} className="shrink-0" />
                    <motion.span
                      variants={LABEL_VARIANTS}
                      transition={LABEL_TRANSITION}
                      className="invisible text-sm"
                    >
                      <Trans>Delete</Trans>
                    </motion.span>
                  </motion.button>
                </motion.div>
              )}

              {canExport && (
                <motion.div layout variants={ITEM_VARIANTS} className="flex-shrink-0">
                  <motion.button
                    {...BUTTON_MOTION_CONFIG}
                    className={`bg-secondary/50 ${isOperationPending ? 'dark:text-primary/50 text-foreground cursor-not-allowed' : ''} hover:bg-secondary/70 dark:!text-primary text-foreground flex h-8 w-auto items-center gap-2 overflow-hidden whitespace-nowrap rounded-lg p-2`}
                    aria-label="Reject"
                    disabled={isOperationPending}
                    onClick={onMultipleDownload ? handleMultipleDownload : onTaskExport}
                  >
                    <Download size={16} className="shrink-0" />
                    <motion.span
                      variants={LABEL_VARIANTS}
                      transition={LABEL_TRANSITION}
                      className="invisible text-sm"
                    >
                      {onMultipleDownload ? _(msg`Download`) : _(msg`Export`)}
                    </motion.span>
                  </motion.button>
                </motion.div>
              )}

              {/* <motion.div layout variants={ITEM_VARIANTS} className="flex-shrink-0">
                <DataTableActionBarAction
                  size="icon"
                  className="h-8 w-8"
                  tooltip="Export"
                  isPending={getIsActionPending('export')}
                  onClick={onTaskExport}
                >
                  <Download />
                </DataTableActionBarAction>
              </motion.div> */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DataTableActionBar>
  );
}
