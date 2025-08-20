import { Skeleton } from '@documenso/ui/primitives/skeleton';
import { TableCell } from '@documenso/ui/primitives/table';

interface DataTableSkeletonProps extends React.ComponentProps<'div'> {
  columnCount: number;
  rowCount?: number;
  filterCount?: number;
  cellWidths?: string[];
  withViewOptions?: boolean;
  withPagination?: boolean;
  shrinkZero?: boolean;
}

export function DataTableSkeleton({
  columnCount,
  rowCount = 10,
  filterCount = 0,
  cellWidths = ['auto'],
  withViewOptions = true,
  withPagination = true,
  shrinkZero = false,
  className,
  ...props
}: DataTableSkeletonProps) {
  const cozyCellWidths = Array.from(
    { length: columnCount },
    (_, index) => cellWidths[index % cellWidths.length] ?? 'auto',
  );

  return (
    <>
      {Array.from({ length: columnCount }).map((_, j) => (
        <TableCell
          key={j}
          style={{
            width: cozyCellWidths[j],
            minWidth: shrinkZero ? cozyCellWidths[j] : 'auto',
          }}
        >
          <Skeleton className="h-6 w-full" />
        </TableCell>
      ))}
    </>
  );
}
