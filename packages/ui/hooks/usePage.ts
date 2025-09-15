import { type UseQueryStateOptions, parseAsInteger, useQueryState } from 'nuqs';

const PAGE_KEY = 'page';

export function usePage({
  queryStateOptions,
}: { queryStateOptions?: Omit<UseQueryStateOptions<string>, 'parse'> } = {}) {
  const [page, setPage] = useQueryState(
    PAGE_KEY,
    parseAsInteger.withOptions(queryStateOptions ?? {}).withDefault(1),
  );
  return { page, setPage };
}
