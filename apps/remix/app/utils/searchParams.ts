import { useMemo } from 'react';

import { useSearchParams } from 'react-router';
import { z } from 'zod';

export const TypeSearchParams = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.undefined()]),
);

export function useSortParams({
  sortColumns,
  status,
  type,
}: {
  sortColumns: z.ZodEnum<[string, ...string[]]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  status?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type?: any;
}) {
  const [searchParams] = useSearchParams();
  const sort = useMemo(
    () => TypeSearchParams.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );
  const filters = useMemo(() => {
    try {
      const f = sort.filters && JSON.parse(sort.filters as string);
      return Array.isArray(f) ? f : [];
    } catch (error) {
      console.error('Error parsing filters:', error);
      return [];
    }
  }, [sort.filters]);

  const applyFilters = useMemo(() => sort.applyFilters === 'true', [sort.applyFilters]);

  const applySorting = useMemo(() => sort.applySorting === 'true', [sort.applySorting]);

  const {
    perPage,
    page,
    query,
    status: statusParams,
    type: typeParams,
  } = useMemo(() => {
    let q = '';
    let st: typeof status;
    let tp: typeof type;
    let pp = 10;
    let p = 1;

    if (sort.perPage) {
      const n = parseInt(sort.perPage as string, 10);
      pp = isNaN(n) || n <= 0 ? 10 : n;
    }
    if (sort.page) {
      const n = parseInt(sort.page as string, 10);
      p = isNaN(n) || n <= 0 ? 1 : n;
    }
    if (sort.query) {
      q = sort.query as string;
    }
    if (sort.status) {
      const s = sort.status as string;
      if (status) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        st = status.includes(s) ? (s as any) : undefined;
      }
    }
    if (sort.type) {
      const t = sort.type as string;
      if (type) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tp = type.includes(t) ? (t as any) : undefined;
      }
    }

    return { perPage: pp, page: p, type: tp, query: q, status: st };
  }, [sort.perPage, sort.query, sort.status, sort.page, sort.type]);

  const joinOperator = useMemo(
    () => (sort.joinOperator === 'or' ? 'or' : 'and'),
    [sort.joinOperator],
  ) as 'or' | 'and';

  const columnOrder = useMemo(() => {
    try {
      const arr = sort.sort && JSON.parse(sort.sort as string);
      if (Array.isArray(arr) && arr.length > 0) {
        const { id } = arr[0];
        return sortColumns.safeParse(id).success ? id : undefined;
      }
    } catch (error) {
      console.error('Error parsing sort order:', error);
      return undefined;
    }
    return 'id';
  }, [sort.sort]);

  const columnDirection = useMemo(() => {
    try {
      const arr = sort.sort && JSON.parse(sort.sort as string);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[0].desc ? 'desc' : 'asc';
      }
    } catch (error) {
      console.error('Error parsing sort direction:', error);
      return undefined;
    }
    return 'asc';
  }, [sort.sort]);

  return {
    filters,
    applyFilters,
    applySorting,
    perPage,
    page,
    query,
    statusParams,
    typeParams,
    joinOperator,
    columnOrder,
    columnDirection,
  };
}
