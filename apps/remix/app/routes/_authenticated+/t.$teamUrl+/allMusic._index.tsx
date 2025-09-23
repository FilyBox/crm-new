import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { isValid } from 'date-fns';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { type IsrcSongs } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
import { ZFindIsrcSongsInternalRequestSchema } from '@documenso/trpc/server/isrcsong-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';

import { AdvancedFilterDialog } from '~/components/general/advanced-filter-drawer';
import CsvUploadInputWithLabel from '~/components/general/csv-input-with-label';
import { AllMusicTable } from '~/components/tables/allMusic-table';
import { TableArtistFilter } from '~/components/tables/lpm-table-artist-filter';
import { useOptionalCurrentTeam } from '~/providers/team';
import { useCsvFilesStore } from '~/storage/store-csv';
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
});

export default function AllMusicPage() {
  const [searchParams] = useSearchParams();
  const { clearCsvFiles } = useCsvFilesStore();

  const { filters, perPage, query, page, joinOperator, columnOrder, columnDirection } =
    useSortParams({ sortColumns });

  const team = useOptionalCurrentTeam();

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );
  const { _ } = useLingui();

  const { data, isLoading, isLoadingError, refetch } = trpc.allMusic.findAllMusic.useQuery({
    query: query,
    page: page,
    artistIds: findDocumentSearchParams.artistIds,
    orderByColumn: columnOrder,
    filterStructure: filters,
    joinOperator: joinOperator,
    perPage: perPage,
  });
  const [editingData, seteditingData] = useState<IsrcSongs | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  const { data: artistData, isLoading: artistDataloading } =
    trpc.isrcSongs.findIsrcUniqueArtists.useQuery();
  const findData = trpc.isrcSongs.findAllIsrc.useMutation();

  const createManyAllMusicMutation = trpc.allMusic.createManyAllMusic.useMutation({
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const createManyAllMusicTuStreamMutation = trpc.allMusic.createManyAllMusicTuStream.useMutation({
    onSettled: () => {
      setIsSubmitting(false);
    },
  });
  const updateIsrcSongsMutation = trpc.isrcSongs.updateIsrcSongsById.useMutation();
  const deleteIsrcSongsMutation = trpc.isrcSongs.deleteIsrcSongsById.useMutation();
  const deleteMultipleMutation = trpc.isrcSongs.deleteMultipleByIds.useMutation();

  const findAll = async () => {
    try {
      const result = await findData.mutateAsync({
        query: query,
        artistIds: findDocumentSearchParams.artistIds,
        orderByColumn: columnOrder,
        orderByDirection: columnDirection as 'asc' | 'desc',
        filterStructure: filters,
        joinOperator: joinOperator,
      });

      // Transform the data to match the expected type
      if (Array.isArray(result)) {
        return result;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching all distributions:', error);
      return [];
    }
  };

  const handleVirginCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);
      const convertDateFormat = (dateString: string): Date | undefined => {
        if (!dateString || dateString.trim() === '') return undefined;

        try {
          const date = new Date(dateString.trim());

          if (!isValid(date)) return undefined;

          // Asegurar que se guarde en UTC
          return new Date(date.toISOString());
        } catch (error) {
          console.warn(`Error converting date: ${dateString}`, error);
          return undefined;
        }
      };

      const validatedData = csvData.map((item) => ({
        productId: item['productId'] || '',
        productType: item['productType'] || '',
        productTitle: item['productTitle'] || '',
        productVersion: item['productVersion'] || undefined,
        productDisplayArtist: item['productDisplayArtist'] || '',
        parentLabel: item['parentLabel'] || undefined,
        label: item['label'] || '',
        originalReleaseDate: convertDateFormat(item['originalReleaseDate']) || new Date(),
        releaseDate: convertDateFormat(item['releaseDate']) || new Date(),
        upc: item['upc'] || '',
        catalog: item['catalog'] || '',
        productPriceTier: item['productPriceTier'] || undefined,
        productGenre: item['productGenre'] || '',
        submissionStatus: item['submissionStatus'] || '',
        productCLine: item['productCLine'] || '',
        productPLine: item['productPLine'] || '',
        preOrderDate: convertDateFormat(item['preOrderDate']),
        exclusives: item['exclusives'] || undefined,
        explicitLyrics: item['explicitLyrics'] || '',
        productPlayLink: item['productPlayLink'] || undefined,
        linerNotes: item['linerNotes'] || undefined,
        primaryMetadataLanguage: item['primaryMetadataLanguage'] || '',
        compilation: item['compilation'] || undefined,
        pdfBooklet: item['pdfBooklet'] || undefined,
        timedReleaseDate: convertDateFormat(item['timedReleaseDate']),
        timedReleaseMusicServices:
          convertDateFormat(item['timedReleaseMusicServices']) || undefined,
        lastProcessDate: convertDateFormat(item['lastProcessDate']) || new Date(),
        importDate: convertDateFormat(item['importDate']) || new Date(),

        // Campos administrativos
        createdBy: item['createdBy'] || 'system',
        lastModified: convertDateFormat(item['lastModified']) || new Date(),
        submittedAt: convertDateFormat(item['submittedAt']) || new Date(),
        submittedBy: item['submittedBy'] || undefined,
        vevoChannel: item['vevoChannel'] || undefined,

        // Campos de pistas
        trackType: item['trackType'] || 'default',
        trackId: item['trackId'] || '',
        trackVolume: item['trackVolume'] === '1' ? true : undefined,
        trackNumber: item['trackNumber'] || '',
        trackName: item['trackName'] || '',
        trackVersion: item['trackVersion'] || undefined,
        trackDisplayArtist: item['trackDisplayArtist'] || '',
        isrc: item['isrc'] || '',
        trackPriceTier: item['trackPriceTier'] || undefined,
        trackGenre: item['trackGenre'] || '',
        audioLanguage: item['audioLanguage'] || '',
        trackCLine: item['trackCLine'] || '',
        trackPLine: item['trackPLine'] || '',
        writersComposers: item['writersComposers'] || '',
        publishersCollectionSocieties: item['publishersCollectionSocieties'] || '',
        withholdMechanicals: item['withholdMechanicals'] || '',
        preOrderType: item['preOrderType'] || undefined,
        instantGratificationDate: convertDateFormat(item['instantGratificationDate']) || new Date(),
        duration: item['duration'] || '',
        sampleStartTime: item['sampleStartTime'] || '',
        explicitLyricsTrack: item['explicitLyricsTrack'] || '',
        albumOnly: item['albumOnly'] || '',
        lyrics: item['lyrics'] || undefined,
        additionalContributorsPerforming: item['additionalContributorsPerforming'] || undefined,
        additionalContributorsNonPerforming:
          item['additionalContributorsNonPerforming'] || undefined,
        producers: item['producers'] || '',
        continuousMix: item['continuousMix'] || '',
        continuouslyMixedIndividualSong: item['continuouslyMixedIndividualSong'] || '',
        trackPlayLink: item['trackPlayLink'] || '',
        license: item['license'] || '',
      }));

      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      const manyData = filteredData.map((item) => ({
        title: item.productTitle,
        catalog: item.catalog,
        UPC: item.upc,
        artists: item.productDisplayArtist,
        publishedAt: item.originalReleaseDate,
        generalLinks: item.trackPlayLink,
        recordLabel: item.label,
      }));

      void clearCsvFiles();

      toast.promise(
        createManyAllMusicMutation.mutateAsync({
          allMusic: manyData,
          agregadora: 'Virgin',
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

      // Refrescar los datos
      await refetch();
      // clearCsvFiles();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    }
  };

  const handleAdaCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);
      const convertDateFormat = (dateString: string): Date | undefined => {
        if (!dateString || dateString.trim() === '') return undefined;

        try {
          const date = new Date(dateString.trim());

          if (!isValid(date)) return undefined;

          // Asegurar que se guarde en UTC
          return new Date(date.toISOString());
        } catch (error) {
          console.warn(`Error converting date: ${dateString}`, error);
          return undefined;
        }
      };

      const validatedData = csvData.map((item) => ({
        title: item['proyecto'] || '',
        artists: item['nombreDistribucion'] || '',
        label: item['marketingOwner'] || '',
        isrc: item['isrc'] || '',
        catalog: item['numeroDeCatalogo'] || '',
      }));

      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      const manyData = filteredData.map((item) => ({
        title: item.title,
        catalog: item.catalog,
        artists: item.artists,
        recordLabel: item.label,
        isrcSong: item.isrc,
      }));

      void clearCsvFiles();

      toast.promise(
        createManyAllMusicMutation.mutateAsync({
          allMusic: manyData,
          agregadora: 'Ada',
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

      // Refrescar los datos
      await refetch();
      // clearCsvFiles();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    }
  };

  const handleTuStreamCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);
      const validatedData = csvData.map((item) => ({
        title: item['title'] || '',
        upc: item['UPC'] || '',
        artists: item['artists'] || '',
      }));

      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      const manyData = filteredData.map((item) => ({
        title: item.title,
        UPC: item.upc,
        artists: item.artists,
      }));

      void clearCsvFiles();

      toast.promise(
        createManyAllMusicMutation.mutateAsync({
          allMusic: manyData,
          agregadora: 'TuStreams',
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

      // Refrescar los datos
      await refetch();
      // clearCsvFiles();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
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
      throw new Error('Error deleting record');
    } finally {
      setIsMultipleDelete(false);
    }
  };

  const openCreateDialog = () => {
    seteditingData(null);
    setIsDialogOpen(true);
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

        <div className="-m-1 flex w-full flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
          <CsvUploadInputWithLabel
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleVirginCsvUpload}
            multiple={false}
            label="Virgin Import"
          />
          <CsvUploadInputWithLabel
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleTuStreamCsvUpload}
            multiple={false}
            label="TuStream Import"
          />

          <CsvUploadInputWithLabel
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleAdaCsvUpload}
            multiple={false}
            label="Ada Import"
          />

          <TableArtistFilter artistData={artistData} isLoading={artistDataloading} />

          <AdvancedFilterDialog tableToConsult="Isrc" />

          {/* <IsrcSheet
            onSubmit={editingData ? handleUpdate : handleCreate}
            initialData={editingData}
            artistData={artistData}
            setInitialData={seteditingData}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            isSubmitting={isSubmitting}
          /> */}
        </div>
      </div>

      <AllMusicTable
        data={data}
        onMultipleDelete={handleMultipleDelete}
        setIsMultipleDelete={setIsMultipleDelete}
        isMultipleDelete={isMultipleDelete}
        isLoading={isLoading}
        // findAll={findAll}
        isLoadingError={isLoadingError}
        onAdd={openCreateDialog}
        // onEdit={handleEdit}
        // onDelete={handleDelete}
      />
    </div>
  );
}
