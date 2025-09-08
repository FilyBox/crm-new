import { useEffect, useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { TypeOfTuStreams } from '@prisma/client';
import { useNavigate, useSearchParams } from 'react-router';
import { toast as sonnertoast } from 'sonner';
import { toast } from 'sonner';
import { z } from 'zod';

import { type TtuStreams } from '@documenso/lib/types/tustreams';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { formTuStreamsPath } from '@documenso/lib/utils/teams';
import { type tuStreams } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
import {
  type TFindTuStreamsResponse,
  ZFindTuStreamsInternalRequestSchema,
} from '@documenso/trpc/server/tustreams-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';

import { ArtistCreateDialog } from '~/components/dialogs/artist-create-dialog';
import { AdvancedFilterDialog } from '~/components/general/advanced-filter-drawer';
import CsvUploadInput from '~/components/general/csv-input';
import TuStreamsSheet from '~/components/sheets/tustreams-sheet';
import { TableArtistFilter } from '~/components/tables/lpm-table-artist-filter';
import { TuStreamsTable } from '~/components/tables/tustreams-table';
import { useOptionalCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export const ExtendedTuStreamsType = {
  ...TypeOfTuStreams,

  ALL: 'ALL',
} as const;

export type ExtendedTuStreamsType =
  (typeof ExtendedTuStreamsType)[keyof typeof ExtendedTuStreamsType];

export function meta() {
  return appMetaTags('TuStreams');
}

const sortColumns = z.enum([
  'id',
  'date',
  'artist',
  'title',
  'UPC',
  'createdAt',
  'type',
  'total',
  'teamId',
  'userId',
]);
export const TypeSearchParams = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.undefined()]),
);

const ZSearchParamsSchema = ZFindTuStreamsInternalRequestSchema.pick({
  type: true,
  period: true,
  page: true,
  perPage: true,
  query: true,
}).extend({
  artistIds: z.string().transform(parseToIntegerArray).optional().catch([]),
});
export default function TuStreamsPage() {
  const [searchParams] = useSearchParams();

  const {
    filters,
    applyFilters,
    applySorting,
    perPage,
    query,
    page,
    typeParams,
    statusParams,
    joinOperator,
    columnOrder,
    columnDirection,
  } = useSortParams({ sortColumns, type: ['EP', 'Album', 'Sencillo'] });

  const findDocumentSearchParams = useMemo(() => {
    const searchParamsObject = Object.fromEntries(searchParams.entries());

    const result = ZSearchParamsSchema.safeParse(searchParamsObject);

    if (!result.success) {
      return {
        type: ['EP', 'Album', 'Sencillo', 'Single', 'ALL'].includes(searchParamsObject.type)
          ? (searchParamsObject.type as ExtendedTuStreamsType)
          : undefined,
        period: searchParamsObject.period as '7d' | '14d' | '30d',
        page: searchParamsObject.page ? Number(searchParamsObject.page) : undefined,
        perPage: searchParamsObject.perPage ? Number(searchParamsObject.perPage) : undefined,
        query: searchParamsObject.query,
      };
    }

    return result.data;
  }, [searchParams]);

  const navigate = useNavigate();
  const team = useOptionalCurrentTeam();
  const releasesRootPath = formTuStreamsPath(team?.url);

  const { data, isLoading, isLoadingError, refetch } = trpc.tuStreams.findTuStreams.useQuery({
    query: query,
    type: typeParams,
    period: findDocumentSearchParams.period,
    page: page,
    perPage: perPage,
    artistIds: findDocumentSearchParams.artistIds,
    orderByColumn: columnOrder,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: applyFilters ? filters : [],
    joinOperator: joinOperator,
  });

  const { data: allArtistData, isLoading: artistLoading } = trpc.tuStreams.findArtists.useQuery();

  const createManyTuStreamsMutation = trpc.tuStreams.createManyTuStreams.useMutation();

  const createMutation = trpc.tuStreams.createTuStreams.useMutation();
  const updateMutation = trpc.tuStreams.updateTuStreams.useMutation();
  const deleteMutation = trpc.tuStreams.deleteTuStreams.useMutation();
  const deleteMultipleMutation = trpc.tuStreams.deleteMultipleByIds.useMutation();
  const findData = trpc.tuStreams.findAllTuStreams.useMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingData, seteditingData] = useState<TtuStreams | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);
  const { _ } = useLingui();

  // const [type, setType] = useState<TFindTuStreamsInternalResponse['type']>({
  //   [ExtendedTuStreamsType.Album]: 0,
  //   [ExtendedTuStreamsType.EP]: 0,
  //   [ExtendedTuStreamsType.Single]: 0,
  //   [ExtendedTuStreamsType.Sencillo]: 0,
  //   [ExtendedTuStreamsType.ALL]: 0,
  // });

  // useEffect(() => {
  //   if (data?.types) {
  //     setType(data.types);
  //   }
  // }, [data?.types]);

  const spanishMonths: Record<string, number> = {
    enero: 0,
    Enero: 0,
    febrero: 1,
    Febrero: 1,
    marzo: 2,
    Marzo: 2,
    abril: 3,
    Abril: 3,
    mayo: 4,
    Mayo: 4,
    junio: 5,
    Junio: 5,
    julio: 6,
    Julio: 6,
    agosto: 7,
    Agosto: 7,
    septiembre: 8,
    Septiembre: 8,
    octubre: 9,
    Octubre: 9,
    noviembre: 10,
    Noviembre: 10,
    diciembre: 11,
    Diciembre: 11,
  };

  function parseSpanishDate(dateString: string): Date | null {
    if (!dateString) return null;

    try {
      // No need to normalize to lowercase since we have both cases in the mapping
      const normalizedInput = dateString.trim();

      // Match patterns like "24 de abril", "24 abril", "24 de Abril", etc.
      const regex = /(\d+)(?:\s+de)?\s+([a-zA-Zé]+)(?:\s+de\s+(\d{4}))?/;
      const match = normalizedInput.match(regex);

      if (!match) return null;

      const day = parseInt(match[1], 10);
      const monthName = match[2];
      // If year is provided use it, otherwise use current year
      const year = match[3] ? parseInt(match[3], 10) : new Date().getFullYear();

      if (!Object.prototype.hasOwnProperty.call(spanishMonths, monthName)) return null;
      const month = spanishMonths[monthName];
      const date = new Date(year, month, day);

      return date;
    } catch (error) {
      console.error(`Failed to parse date: ${dateString}`, error);
      return null;
    }
  }

  function formatDate(date: Date | null): string {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  const handleCsvUpload = async (file: File) => {
    if (!file) return;

    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);

      const validatedData = csvData.map((item) => {
        const parsedDate = parseSpanishDate(item['Fecha'] || item['Date'] || '');
        // Validate type to ensure it's one of the allowed TypeOfTuStreams values
        let type: 'EP' | 'Album' | 'Sencillo' | 'Single' | undefined = undefined;
        const typeValue = item['type'] || item['Tipo'] || item['Type'] || item['Tipo de Release'];
        if (
          typeValue === 'EP' ||
          typeValue === 'Album' ||
          typeValue === 'Sencillo' ||
          typeValue === 'Single'
        ) {
          type = typeValue as 'EP' | 'Album' | 'Sencillo' | 'Single';
        }

        // Parse total as float
        const convertToNumber = (value: string | undefined): number | undefined => {
          if (value === undefined || value === '') return undefined;
          const num = parseFloat(value.replace(',', '.'));
          return isNaN(num) ? undefined : num;
        };

        return {
          title: item['Titulo'] || item['Title'] || item['Lanzamiento'] || undefined,
          UPC: item['UPC'] || item['Codigo UPC'] || undefined,
          artist: item['Artista'] || item['Artist'] || undefined,
          type,
          total: convertToNumber(item['total'] || item['Total'] || item['Monto'] || item['Valor']),
          date: parsedDate || undefined,
        };
      });
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== undefined && value !== ''),
      );

      sonnertoast.promise(
        createManyTuStreamsMutation.mutateAsync({
          tuStreams: filteredData,
        }),
        {
          loading: _(msg`Processing file...`),

          success: (data: number) => {
            return _(msg`${data} records created successfully`);
          },
          error: () => {
            return _(msg`Error processing file`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        },
      );

      // Refresh the data
      await refetch();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const findAll = async () => {
    try {
      const result = await findData.mutateAsync({});
      // Transform the data to match the expected type
      if (Array.isArray(result)) {
        return result;
      } else if (result && 'data' in result) {
        return result.data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching all distributions:', error);
      return [];
    }
  };

  const handleCreate = async (newRecord: Omit<TtuStreams, 'id'>) => {
    try {
      toast.promise(
        createMutation.mutateAsync({
          title: newRecord.title || undefined,
          UPC: newRecord.UPC || undefined,
          artistsToUpdate: newRecord.artistsToUpdate ?? [],

          // artists: newRecord.artists || undefined,
          type: newRecord.type || undefined,
          total: newRecord.total || undefined,
          date: newRecord.date || undefined,
        }),
        {
          loading: _(msg`Creating record...`),

          success: () => {
            return _(msg`Record created successfully`);
          },
          error: () => {
            return _(msg`Error creating records`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        },
      );

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating record:', error);
    } finally {
      await refetch();
    }
  };

  const handleUpdate = async (updated: TtuStreams) => {
    try {
      toast.promise(
        updateMutation.mutateAsync({
          id: updated.id,
          title: updated.title || undefined,
          UPC: updated.UPC || undefined,
          artistsToUpdate: updated.artistsToUpdate ?? [],
          artists: updated.artists,
          // artists: updated.tuStreamsArtists || undefined,
          type: updated.type || undefined,
          total: updated.total || undefined,
          date: updated.date || undefined,
        }),
        {
          loading: _(msg`Updating record...`),

          success: () => {
            return _(msg`Record updated successfully`);
          },
          error: () => {
            return _(msg`Error updating records`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        },
      );

      seteditingData(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating record:', error);
    } finally {
      await refetch();
    }
  };

  const handleEdit = (record: TFindTuStreamsResponse['data'][number]) => {
    seteditingData(record as tuStreams);
    setIsDialogOpen(true);
  };

  const handleDelete = async (deleteData: TFindTuStreamsResponse['data'][number]) => {
    try {
      toast.promise(deleteMutation.mutateAsync({ id: deleteData.id }), {
        loading: _(msg`Deleting record...`),

        success: () => {
          return _(msg`Record deleted successfully`);
        },
        error: () => {
          return _(msg`Error deleting records`);
        },
        position: 'bottom-center',
        className: 'mb-16',
      });
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      await refetch();
    }
  };

  const handleMultipleDelete = async (ids: number[]) => {
    try {
      toast.promise(deleteMultipleMutation.mutateAsync({ ids: ids }), {
        position: 'bottom-center',
        className: 'mb-16',
      });
      await refetch();
    } catch (error) {
      console.error('Error deleting record:', error);
    } finally {
      setIsMultipleDelete(false);
    }
  };

  const openCreateDialog = () => {
    seteditingData(null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    void refetch();
  }, [team?.url]);

  const getTabHref = (value: keyof typeof ExtendedTuStreamsType) => {
    const params = new URLSearchParams(searchParams);

    params.set('type', value);

    if (value === ExtendedTuStreamsType.ALL) {
      params.delete('type');
    }

    if (params.has('page')) {
      params.delete('page');
    }

    return `${formTuStreamsPath(team?.url)}?${params.toString()}`;
  };

  const handleTaskClick = (taskId: number) => {
    void navigate(`${releasesRootPath}/${taskId}`);
  };

  return (
    <div className="mx-auto max-w-screen-xl gap-y-8 px-4 md:px-8">
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

          <h1 className="truncate text-2xl font-semibold md:text-3xl">
            <Trans>TuStreams</Trans>
          </h1>
        </div>

        <div className="-m-1 flex w-full flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
          {/* <Tabs value={typeParams || 'ALL'} className="overflow-x-auto">
            <TabsList>
              {['Sencillo', 'Single', 'Album', 'EP', 'ALL'].map((value) => {
                return (
                  <TabsTrigger
                    key={value}
                    className="hover:text-foreground min-w-[60px]"
                    value={value}
                    asChild
                  >
                    <Link
                      to={getTabHref(value as keyof typeof ExtendedTuStreamsType)}
                      preventScrollReset
                    >
                      <TuStreamsType type={value as ExtendedTuStreamsType} />

                      {value !== 'ALL' && (
                        <span className="ml-1 inline-block opacity-50">
                          {type[value as ExtendedTuStreamsType]}
                        </span>
                      )}
                    </Link>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs> */}
          <CsvUploadInput
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleCsvUpload}
            multiple={false}
          />
          <TableArtistFilter artistData={allArtistData} isLoading={artistLoading} />

          <AdvancedFilterDialog tableToConsult="TuStreams" />

          <ArtistCreateDialog />

          <TuStreamsSheet
            onSubmit={editingData ? handleUpdate : handleCreate}
            initialData={editingData}
            artistData={allArtistData}
            setInitialData={seteditingData}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="w-full">
          <TuStreamsTable
            onMultipleDelete={handleMultipleDelete}
            isMultipleDelete={isMultipleDelete}
            setIsMultipleDelete={setIsMultipleDelete}
            data={data?.tuStreams}
            isLoading={isLoading}
            findAll={findAll}
            isLoadingError={isLoadingError}
            onAdd={openCreateDialog}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
