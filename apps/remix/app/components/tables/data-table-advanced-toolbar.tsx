import type * as React from 'react';

import type { Table } from '@tanstack/react-table';

import { cn } from '@documenso/ui/lib/utils';
import { Skeleton } from '@documenso/ui/primitives/skeleton';

import { DataTableViewOptions } from './data-table-view-options';

interface DataTableAdvancedToolbarProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  loading: boolean;
}

export function DataTableAdvancedToolbar<TData>({
  table,
  children,
  loading,
  className,
  ...props
}: DataTableAdvancedToolbarProps<TData>) {
  if (loading) {
    return (
      <div
        role="toolbar"
        aria-orientation="horizontal"
        className={cn('flex w-full items-start justify-between gap-2 p-1', className)}
        {...props}
      >
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-[85px]" />
          <Skeleton className="h-9 w-[85px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[85px]" />
        </div>
      </div>
    );
  }
  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn('flex w-full items-start justify-between gap-2 p-1', className)}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      <div className="flex items-center gap-2">
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
