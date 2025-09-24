import { useMemo, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { trpc } from '@documenso/trpc/react';
import { ZFindIsrcSongsInternalRequestSchema } from '@documenso/trpc/server/isrcsong-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';

import { AllMusicTable } from '~/components/tables/allMusic-table';
import { useOptionalCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export function meta() {
  return appMetaTags('Music');
}

const sortColumns = z.enum([
  'id',
  'date',
  'createdAt',
  'isrc',
  'artist',
  'duration',
  'trackName',
  'title',
  'license',
]);

export const TypeSearchParams = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.undefined()]),
);

const ZSearchParamsSchema = ZFindIsrcSongsInternalRequestSchema.pick({
  period: true,
  page: true,
  perPage: true,
  query: true,
}).extend({
  artistIds: z.string().transform(parseToIntegerArray).optional().catch([]),
  agregadoraIds: z.string().transform(parseToIntegerArray).optional().catch([]),
  recordLabelIds: z.string().transform(parseToIntegerArray).optional().catch([]),
});

export default function AllMusicPage() {
  const [searchParams] = useSearchParams();

  const { filters, perPage, query, page, joinOperator, columnOrder, columnDirection } =
    useSortParams({ sortColumns });

  const team = useOptionalCurrentTeam();

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );
  const { data, isLoading, isLoadingError, refetch } = trpc.allMusic.findAllMusic.useQuery({
    query: query,
    page: page,
    artistIds: findDocumentSearchParams.artistIds,
    agregadoraIds: findDocumentSearchParams.agregadoraIds,
    recordLabelIds: findDocumentSearchParams.recordLabelIds,
    orderByColumn: columnOrder,
    filterStructure: filters,
    joinOperator: joinOperator,
    perPage: perPage,
  });

  const findAllMusicNoPaginationMutation = trpc.allMusic.findAllMusicNoPagination.useMutation();

  const findAll = async () => {
    try {
      const result = await findAllMusicNoPaginationMutation.mutateAsync({
        artistIds: findDocumentSearchParams.artistIds,
        agregadoraIds: findDocumentSearchParams.agregadoraIds,
        recordLabelIds: findDocumentSearchParams.recordLabelIds,
        orderByColumn: columnOrder,
        filterStructure: filters,
        joinOperator: joinOperator,
      });

      if (Array.isArray(result.data)) {
        return result.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching all distributions:', error);
      return [];
    }
  };

  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  const allDataToFilter = trpc.allMusic.findInfoToFilter.useQuery();

  const deleteMultipleMutation = trpc.allMusic.deleteMultipleByIds.useMutation();

  const handleMultipleDelete = async (ids: number[]) => {
    try {
      toast.promise(deleteMultipleMutation.mutateAsync({ ids: ids }), {
        position: 'bottom-center',
        className: 'mb-16',
      });

      await refetch();
    } catch (error) {
      throw new Error('Error deleting record');
    } finally {
      setIsMultipleDelete(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-screen-xl flex-col gap-y-8 px-4 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8">
        <div className="flex flex-row items-center">
          {team && (
            <Avatar className="dark:border-border mr-3 h-12 w-12 border-2 border-solid border-white">
              {team.avatarImageId && <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />}
              <AvatarFallback className="text-muted-foreground text-xs">
                {team.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          )}

          <h2 className="text-4xl font-semibold">
            <Trans>Music</Trans>
          </h2>
        </div>
      </div>

      <AllMusicTable
        data={data}
        onMultipleDelete={handleMultipleDelete}
        allDataToFilter={allDataToFilter}
        setIsMultipleDelete={setIsMultipleDelete}
        isMultipleDelete={isMultipleDelete}
        isLoading={isLoading}
        isLoadingError={isLoadingError}
        findAll={findAll}
      />
    </div>
  );
}
