import { useEffect, useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { type TRelease } from '@documenso/lib/types/release';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { formReleasePath } from '@documenso/lib/utils/teams';
import { type Releases } from '@documenso/prisma/client';
import { ExtendedRelease } from '@documenso/prisma/types/extended-release';
import { ExtendedReleaseType } from '@documenso/prisma/types/extended-release';
import { trpc } from '@documenso/trpc/react';
import {
  type TFindReleaseInternalResponse,
  type TFindReleaseResponse,
  ZFindReleaseInternalRequestSchema,
} from '@documenso/trpc/server/releases-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';
import { Tabs, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';

import { AdvancedFilterDialog } from '~/components/general/advanced-filter-drawer';
import CsvUploadInput from '~/components/general/csv-input';
import { ReleaseType } from '~/components/general/task/release-type';
import ReleasesSheet from '~/components/sheets/releases-sheet';
import { TableArtistFilter } from '~/components/tables/lpm-table-artist-filter';
import { ReleasesTable } from '~/components/tables/releases-table';
import { useOptionalCurrentTeam } from '~/providers/team';
import { useCsvFilesStore } from '~/storage/store-csv';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export function meta() {
  return appMetaTags('Releases');
}

const sortColumns = z.enum([
  'id',
  'createdAt',
  'date',
  'lanzamiento',
  'typeOfRelease',
  'release',
  'uploaded',
  'streamingLink',
  'assets',
  'canvas',
  'cover',
  'audioWAV',
  'video',
  'banners',
  'pitch',
  'EPKUpdates',
  'WebSiteUpdates',
  'Biography',
]);
export const TypeSearchParams = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.undefined()]),
);

const ZSearchParamsSchema = ZFindReleaseInternalRequestSchema.pick({
  type: true,
  release: true,
  period: true,
  page: true,
  perPage: true,
  query: true,
}).extend({
  artistIds: z.string().transform(parseToIntegerArray).optional().catch([]),
});
export default function TasksPage() {
  const [searchParams] = useSearchParams();

  const {
    filters,
    applyFilters,
    perPage,
    query,
    page,
    joinOperator,
    columnOrder,
    columnDirection,
  } = useSortParams({ sortColumns });
  const { _ } = useLingui();

  const findDocumentSearchParams = useMemo(() => {
    const searchParamsObject = Object.fromEntries(searchParams.entries());

    const result = ZSearchParamsSchema.safeParse(searchParamsObject);

    if (!result.success) {
      return {
        type: ['EP', 'Album', 'Sencillo', 'ALL'].includes(searchParamsObject.type)
          ? (searchParamsObject.type as ExtendedReleaseType)
          : undefined,
        release: searchParamsObject.release as ExtendedRelease,
        period: searchParamsObject.period as '7d' | '14d' | '30d',
        page: searchParamsObject.page ? Number(searchParamsObject.page) : undefined,
        perPage: searchParamsObject.perPage ? Number(searchParamsObject.perPage) : undefined,
        query: searchParamsObject.query,
      };
    }

    return result.data;
  }, [searchParams]);

  const team = useOptionalCurrentTeam();

  const { data, isLoading, isLoadingError, refetch } = trpc.release.findRelease.useQuery({
    query: query,
    // type: findDocumentSearchParams.type,
    // release: findDocumentSearchParams.release,
    page: page,
    perPage: perPage,
    artistIds: findDocumentSearchParams.artistIds,
    orderByColumn: columnOrder,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: applyFilters ? filters : [],
    joinOperator: joinOperator,
  });

  const { data: artistData, isLoading: artistDataloading } =
    trpc.release.findReleasesUniqueArtists.useQuery();

  const createManyReleasesMutation = trpc.release.createManyReleases.useMutation();

  const createMutation = trpc.release.createRelease.useMutation();
  const updateMutation = trpc.release.updateRelease.useMutation();
  const deleteMutation = trpc.release.deleteRelease.useMutation();
  const deleteMultipleMutation = trpc.release.deleteMultipleByIds.useMutation();

  const { clearCsvFiles } = useCsvFilesStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dataIntial, setData] = useState<TFindReleaseResponse | null>(null);
  const [editingData, seteditingData] = useState<TRelease | null>(null);
  // const [csvFiles, setCsvFiles] = useState<CSVFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  const [type, setType] = useState<TFindReleaseInternalResponse['type']>({
    [ExtendedReleaseType.Album]: 0,
    [ExtendedReleaseType.EP]: 0,
    [ExtendedReleaseType.Sencillo]: 0,
    [ExtendedReleaseType.ALL]: 0,
  });

  const [release, setRelease] = useState<TFindReleaseInternalResponse['release']>({
    [ExtendedRelease.Focus]: 0,
    [ExtendedRelease.Soft]: 0,
    [ExtendedRelease.ALL]: 0,
  });

  useEffect(() => {
    if (data?.releases) {
      setData(data.releases);
    }
  }, [data]);

  useEffect(() => {
    if (data?.types) {
      setType(data.types);
    }
  }, [data?.types]);

  useEffect(() => {
    if (data?.releasesCount) {
      setRelease(data.releasesCount);
    }
  }, [data?.releasesCount]);

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
      const normalizedInput = dateString.trim();

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

  function formatDate(date: Date | null): Date | undefined {
    if (!date) return undefined;

    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dateFormated = new Date(isoDate);

    // Verificar que la fecha es válida
    if (isNaN(dateFormated.getTime())) return undefined;

    return dateFormated;
  }

  const handleCsvUpload = async (file: File) => {
    if (!file) return;

    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);

      const validatedData = csvData.map((item) => {
        const parsedDate = parseSpanishDate(item['Fecha'] || '');

        const formattedDate = formatDate(parsedDate);
        const convertDateFormat = (dateString: string): Date | undefined => {
          if (!dateString || dateString.trim() === '') return undefined;

          try {
            // Asume formato MM/dd/yyyy
            let [year, month, day] = dateString.split('-');

            if (!month || !day || !year) return undefined;
            //si formato dd/mm/yyyy
            if (Number(month) > 12 && Number(day) < 12) {
              const [dayAfterCheck, monthAfterCheck, yearAfterCheck] = dateString.split('/');
              month = dayAfterCheck;
              day = monthAfterCheck;
              year = yearAfterCheck;
            }
            // Check if the year is less than 4 digits
            if (year.length < 4) {
              // This might be a different date format, try to detect it
              // The format might be yyyy/mm/dd instead of mm/dd/yyyy
              if (Number(month) > 31) {
                // day is too large, likely the year
                const temp = month;
                day = year;
                month = day;
                year = temp;
              } else if (Number(month) > 12 && Number(year) <= 12) {
                // month is too large, likely the format is dd/yy/mm
                const temp = year;
                year = `20${temp}`.substring(0, 4); // Assume 20xx for 2-digit years
                month = day;
                day = month;
              } else {
                // If year is still less than 4 digits, pad it
                year = year.length === 2 ? `20${year}` : `200${year}`;
              }
            }
            // Crear fecha en formato ISO (yyyy-MM-dd)
            const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const date = new Date(isoDate);

            // Verificar que la fecha es válida
            if (isNaN(date.getTime())) return undefined;

            return date;
          } catch (error) {
            console.warn(`Error converting date: ${dateString}`, error);
            return undefined;
          }
        };

        // Validate typeOfRelease to ensure it's one of the allowed values
        let typeOfRelease: 'Sencillo' | 'Album' | 'EP' | undefined = undefined;
        // if (
        //   item['Tipo de Release'] === 'Sencillo' ||
        //   item['Tipo de Release'] === 'Album' ||
        //   item['Tipo de Release'] === 'EP'
        // ) {
        // }
        typeOfRelease =
          (item['Tipo de Release'] as 'Sencillo' | 'Album' | 'EP') ||
          (item['typeOfRelease'] as 'Sencillo' | 'Album' | 'EP');

        // Validate release to ensure it's one of the allowed values
        let release: 'Soft' | 'Focus' | undefined = undefined;
        // if (item['Release'] === 'Soft' || item['Release'] === 'Focus') {
        //   release = item['Release'] as 'Soft' | 'Focus';
        // }
        release = (item['Release'] as 'Soft' | 'Focus') || (item['release'] as 'Soft' | 'Focus');

        // Convert string values to boolean for boolean fields
        const convertToBoolean = (value: string | undefined): boolean | undefined => {
          if (value === undefined) return false;
          return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
        };

        return {
          date: convertDateFormat(item['date'] || item['Date']) || formattedDate || undefined,
          artist:
            item['Artista'] ||
            item['artist'] ||
            item['releasesArtists'] ||
            item['artista'] ||
            undefined,
          lanzamiento: item['Lanzamiento'] || item['lanzamiento'] || undefined,
          typeOfRelease,
          release,
          uploaded: item['Uploaded'] || item['uploaded'] || undefined,
          streamingLink: item['Streaming Link'] || item['streamingLink'] || undefined,
          assets: convertToBoolean(item['Assets'] || item['assets']) || undefined,
          canvas: convertToBoolean(item['Canvas'] || item['canvas']),
          cover: convertToBoolean(item['Portada'] || item['cover']), // Convert cover to boolean
          audioWAV: convertToBoolean(item['Audio WAV'] || item['audioWAV']), // Convert audioWAV to boolean
          video: convertToBoolean(item['Video'] || item['video']),
          banners: convertToBoolean(item['Banners'] || item['banners']),
          pitch: convertToBoolean(item['Pitch'] || item['pitch']),

          EPKUpdates: convertToBoolean(item['Actualización del EPK'] || item['EPKUpdates']),
          WebSiteUpdates: convertToBoolean(
            item['Actualización del sitio web'] || item['WebSiteUpdates'],
          ),
          Biography: convertToBoolean(
            item['Actualización de Biografía'] || item['Biography'] || item['biography'],
          ),
        };
      });
      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      toast.promise(
        createManyReleasesMutation.mutateAsync({
          releases: filteredData,
        }),
        {
          loading: _(msg`Processing file...`),

          success: (data: number) => {
            return _(msg`A total of ${data} records created successfully`);
          },
          error: () => {
            return _(msg`Error processing file`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        },
      );

      await refetch();
      clearCsvFiles();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (newRecord: Omit<TRelease, 'id'>) => {
    try {
      toast.promise(
        createMutation.mutateAsync({
          date: newRecord.date || undefined,
          artist: newRecord.artist || undefined,
          artistsToUpdate: newRecord.artistsToUpdate ?? [],
          lanzamiento: newRecord.lanzamiento || undefined,
          typeOfRelease: newRecord.typeOfRelease || undefined,
          release: newRecord.release || undefined,
          uploaded: newRecord.uploaded || undefined,
          streamingLink: newRecord.streamingLink || undefined,
          assets: newRecord.assets || undefined,
          canvas: newRecord.canvas || undefined,
          cover: newRecord.cover || undefined,
          audioWAV: newRecord.audioWAV || undefined,
          video: newRecord.video || undefined,
          banners: newRecord.banners || undefined,
          pitch: newRecord.pitch || undefined,
          EPKUpdates: newRecord.EPKUpdates || undefined,
          WebSiteUpdates: newRecord.WebSiteUpdates || undefined,
          Biography: newRecord.Biography || undefined,
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
      await refetch();
    } catch (error) {
      console.error('Error creating record:', error);
    }
    // const record = { ...newRecord, id: Number(dataIntial?.releases?.length ?? 0) + 1 };

    setIsDialogOpen(false);
  };

  const handleUpdate = async (updated: TRelease) => {
    try {
      toast.promise(
        updateMutation.mutateAsync({
          id: updated.id,
          date: updated.date || undefined,
          artist: updated.artist || undefined,
          lanzamiento: updated.lanzamiento || undefined,
          typeOfRelease: updated.typeOfRelease || undefined,
          release: updated.release || undefined,
          uploaded: updated.uploaded || undefined,
          streamingLink: updated.streamingLink || undefined,
          assets: updated.assets,
          canvas: updated.canvas,
          artistsToUpdate: updated.artistsToUpdate ?? [],
          artists: updated.artists,
          cover: updated.cover,
          audioWAV: updated.audioWAV,
          video: updated.video,
          banners: updated.banners,
          pitch: updated.pitch,
          EPKUpdates: updated.EPKUpdates,
          WebSiteUpdates: updated.WebSiteUpdates,
          Biography: updated.Biography,
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
      seteditingData(null);
      await refetch();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const handleEdit = (record: TFindReleaseResponse['data'][number]) => {
    seteditingData(record as Releases);
    setIsDialogOpen(true);
  };

  const handleDelete = async (deleteData: TFindReleaseResponse['data'][number]) => {
    try {
      toast.promise(deleteMutation.mutateAsync({ releaseId: deleteData.id }), {
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
      await deleteMultipleMutation.mutateAsync({ ids: ids });
      console.log('Deleting records with IDs in index contracts:', ids);
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

  const getTabHref = (value: keyof typeof ExtendedReleaseType) => {
    const params = new URLSearchParams(searchParams);

    params.set('type', value);

    if (value === ExtendedReleaseType.ALL) {
      params.delete('type');
    }

    if (params.has('page')) {
      params.delete('page');
    }

    return `${formReleasePath(team?.url)}?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-screen-xl gap-y-8 px-4 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8 pt-1">
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
            <Trans>Releases</Trans>
          </h1>
        </div>

        <div className="-m-1 flex w-full flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
          <Tabs value={findDocumentSearchParams.type || 'ALL'} className="overflow-x-auto">
            <TabsList>
              {['Sencillo', 'Album', 'EP', 'ALL'].map((value) => {
                return (
                  <TabsTrigger
                    key={value}
                    className="hover:text-foreground min-w-[60px]"
                    value={value}
                    asChild
                  >
                    <Link
                      to={getTabHref(value as keyof typeof ExtendedReleaseType)}
                      preventScrollReset
                    >
                      <ReleaseType type={value as ExtendedReleaseType} />

                      {value !== 'ALL' && (
                        <span className="ml-1 inline-block opacity-50">
                          {type[value as ExtendedReleaseType]}
                        </span>
                      )}
                    </Link>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          <div className="flex w-full flex-wrap items-center justify-between gap-x-2 sm:w-48">
            <TableArtistFilter artistData={artistData} isLoading={artistDataloading} />
          </div>

          <CsvUploadInput
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleCsvUpload}
            multiple={false}
          />

          {/* <div className="flex w-full flex-wrap items-center justify-between gap-x-2 sm:w-48">
            <DocumentSearch initialValue={findDocumentSearchParams.query} />
          </div> */}
          <AdvancedFilterDialog tableToConsult="Releases" />
          <ReleasesSheet
            onSubmit={editingData ? handleUpdate : handleCreate}
            initialData={editingData}
            artistData={artistData}
            setInitialData={seteditingData}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="mt w-full">
          <ReleasesTable
            onMultipleDelete={handleMultipleDelete}
            releaseTyleCounts={type}
            releasesCount={release}
            isMultipleDelete={isMultipleDelete}
            setIsMultipleDelete={setIsMultipleDelete}
            data={data?.releases}
            isLoading={isLoading}
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
