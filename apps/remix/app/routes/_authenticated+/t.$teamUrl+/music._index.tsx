import { useEffect, useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { type TLpm } from '@documenso/lib/types/lpm';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { trpc } from '@documenso/trpc/react';
import { ZFindLpmInternalRequestSchema } from '@documenso/trpc/server/lpm-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';

import { ArtistCreateDialog } from '~/components/dialogs/artist-create-dialog';
import { AdvancedFilterDialog } from '~/components/general/advanced-filter-drawer';
import CsvUploadInput from '~/components/general/csv-input';
import { VirginSheet } from '~/components/sheets/virgin-sheet';
import { LpmTable } from '~/components/tables/lpm-table';
import { TableArtistFilter } from '~/components/tables/lpm-table-artist-filter';
import { useOptionalCurrentTeam } from '~/providers/team';
import { useCsvFilesStore } from '~/storage/store-csv';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

const ZSearchParamsSchema = ZFindLpmInternalRequestSchema.pick({
  period: true,
  page: true,
  perPage: true,
  query: true,
}).extend({
  artistIds: z.string().transform(parseToIntegerArray).optional().catch([]),
});
const sortColumns = z.enum([
  'id',
  'productId',
  'productType',
  'productTitle',
  'productVersion',
  'productDisplayArtist',
  'parentLabel',
  'label',
  'originalReleaseDate',
  'releaseDate',
  'upc',
  'catalog',
  'productPriceTier',
  'productGenre',
  'submissionStatus',
  'productCLine',
  'productPLine',
  'preOrderDate',
  'exclusives',
  'explicitLyrics',
  'additionalContributorsNonPerforming',
  'additionalContributorsPerforming',
  'albumOnly',
  'audioLanguage',
  'compilation',
  'continuousMix',
  'createdBy',
  'duration',
  'importDate',
  'explicitLyricsTrack',
  'instantGratificationDate',
  'lastModified',
  'lastProcessDate',
  'linerNotes',
  'isrc',
  'lyrics',
  'producers',
  'sampleStartTime',
  'trackCLine',
  'trackId',
  'trackGenre',
  'trackName',
  'trackNumber',
  'trackPLine',
  'trackPriceTier',
  'trackType',
  'trackVolume',
  'writersComposers',
  'timedReleaseDate',
  'timedReleaseMusicServices',
  'pdfBooklet',
  'preOrderType',
  'submittedAt',
  'productPlayLink',
  'publishersCollectionSocieties',
  'trackDisplayArtist',
  'submittedBy',
  'continuouslyMixedIndividualSong',
  'primaryMetadataLanguage',
  'trackVersion',
  'vevoChannel',
  'trackPlayLink',
  'withholdMechanicals',
  'teamId',
  'userId',
]);
export const TypeSearchParams = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.undefined()]),
);

export function meta() {
  return appMetaTags('Music');
}

export default function TablePage() {
  const [searchParams] = useSearchParams();
  const { filters, perPage, query, page, joinOperator, columnOrder, columnDirection } =
    useSortParams({ sortColumns });

  const { _ } = useLingui();
  const { clearCsvFiles } = useCsvFilesStore();

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );

  const { data, isLoading, isLoadingError, refetch } = trpc.lpm.findLpm.useQuery({
    query: query,
    artistIds: findDocumentSearchParams.artistIds,
    page: page,
    perPage: perPage,
    orderByColumn: columnOrder,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: filters,
    joinOperator: joinOperator,
  });

  const { data: artistData, isLoading: artistDataloading } =
    trpc.lpm.findLpmUniqueArtists.useQuery();

  const createManyMusicMutation = trpc.lpm.createManyMusic.useMutation();

  const createLpmMutation = trpc.lpm.createLpm.useMutation();
  const updateLpmMutation = trpc.lpm.updateLpmById.useMutation();
  const deleteLpmMutation = trpc.lpm.deleteLpmById.useMutation();
  const deleteMultipleMutation = trpc.lpm.deleteMultipleByIds.useMutation();
  const findData = trpc.lpm.findAllLpm.useMutation();

  const team = useOptionalCurrentTeam();

  const [editingData, seteditingData] = useState<TLpm | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  useEffect(() => {
    void refetch();
  }, [team?.url]);

  const findAll = async () => {
    try {
      const result = await findData.mutateAsync({});

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

  const handleCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);
      const convertDateFormat = (dateString: string): Date | undefined => {
        if (!dateString || dateString.trim() === '') return undefined;

        try {
          // Asume formato MM/dd/yyyy
          const [month, day, year] = dateString.split('/');
          if (!month || !day || !year) return undefined;

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
      const validatedData = csvData.map((item) => ({
        productId: item['Product Id'] || '',
        productType: item['Product Type'] || '',
        productTitle: item['Product Title'] || '',
        productVersion: item['Product Version'] || undefined,
        productDisplayArtist: item['Product Display Artist'] || '',
        parentLabel: item['Parent Label'] || undefined,
        label: item['Label'] || '',
        originalReleaseDate: convertDateFormat(item['Original Release Date']) || new Date(),
        releaseDate: convertDateFormat(item['Release Date']) || new Date(),
        upc: item['UPC'] || '',
        catalog: item['Catalog #'] || '',
        productPriceTier: item['Product Price Tier'] || undefined,
        productGenre: item['Product Genre'] || '',
        submissionStatus: item['Submission Status'] || '',
        productCLine: item['Product C Line'] || '',
        productPLine: item['Product P Line'] || '',
        preOrderDate: convertDateFormat(item['Pre-Order Date']),
        exclusives: item['Exclusives'] || undefined,
        explicitLyrics: item['ExplicitLyrics'] || '',
        productPlayLink: item['Product Play Link'] || undefined,
        linerNotes: item['Liner Notes'] || undefined,
        primaryMetadataLanguage: item['Primary Metadata Language'] || '',
        compilation: item['Compilation'] || undefined,
        pdfBooklet: item['PDF Booklet'] || undefined,
        timedReleaseDate: convertDateFormat(item['Timed Release Date']),
        timedReleaseMusicServices:
          convertDateFormat(item['Timed Release Music Services']) || undefined,
        lastProcessDate: convertDateFormat(item['Last Process Date']) || new Date(),
        importDate: convertDateFormat(item['Import Date']) || new Date(),

        // Campos administrativos
        createdBy: item['Created By'] || 'system',
        lastModified: convertDateFormat(item['Last Modified']) || new Date(),
        submittedAt: convertDateFormat(item['Submitted At']) || new Date(),
        submittedBy: item['Submitted By'] || undefined,
        vevoChannel: item['Vevo Channel'] || undefined,

        // Campos de pistas
        trackType: item['TrackType'] || 'default',
        trackId: item['Track Id'] || '',
        trackVolume: item['Track Volume'] === '1' ? true : undefined,
        trackNumber: item['Track Number'] || '',
        trackName: item['Track Name'] || '',
        trackVersion: item['Track Version'] || undefined,
        trackDisplayArtist: item['Track Display Artist'] || item['Artista'] || '',
        isrc: item['Isrc'] || '',
        trackPriceTier: item['Track Price Tier'] || undefined,
        trackGenre: item['Track Genre'] || '',
        audioLanguage: item['Audio Language'] || '',
        trackCLine: item['Track C Line'] || '',
        trackPLine: item['Track P Line'] || '',
        writersComposers: item['Writers/Composers'] || '',
        publishersCollectionSocieties: item['Publishers/Collection Societies'] || '',
        withholdMechanicals: item['Withhold Mechanicals'] || '',
        preOrderType: item['Pre-Order Type'] || undefined,
        instantGratificationDate:
          convertDateFormat(item['Instant Gratification Date']) || new Date(),
        duration: item['Duration'] || '',
        sampleStartTime: item['Sample Start Time'] || '',
        explicitLyricsTrack: item['Explicit Lyrics'] || '',
        albumOnly: item['Album Only'] || '',
        lyrics: item['Lyrics'] || undefined,
        additionalContributorsPerforming: item['AdditionalContributors.Performing'] || undefined,
        additionalContributorsNonPerforming:
          item['AdditionalContributors.NonPerforming'] || undefined,
        producers: item['Producers'] || '',
        continuousMix: item['Continuous Mix'] || '',
        continuouslyMixedIndividualSong: item['Continuously Mixed Individual Song'] || '',
        trackPlayLink: item['Track Play Link'] || '',

        // Campos adicionales de licencia
        license: item['Licencia'] || '',
      }));
      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );
      toast.promise(
        createManyMusicMutation.mutateAsync({
          music: filteredData,
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

      // toast({
      //   description: `Se han creado
      //    ${result}
      //    registros exitosamente`,
      // });

      // Refrescar los datos
      await refetch();
      clearCsvFiles();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (newRecord: Omit<TLpm, 'id'>) => {
    setIsSubmitting(true);
    try {
      toast.promise(
        createLpmMutation.mutateAsync({
          // Use properties from newRecord
          productId: newRecord.productId,
          productType: newRecord.productType,
          productTitle: newRecord.productTitle,
          productVersion: newRecord.productVersion ?? undefined,
          parentLabel: newRecord.parentLabel ?? undefined,
          label: newRecord.label,
          originalReleaseDate: newRecord.originalReleaseDate ?? undefined,
          releaseDate: newRecord.releaseDate,
          upc: newRecord.upc,
          artistsToUpdate: newRecord.artistsToUpdate ?? [],
          catalog: newRecord.catalog,
          productPriceTier: newRecord.productPriceTier ?? undefined,
          productGenre: newRecord.productGenre ?? '',
          submissionStatus: newRecord.submissionStatus,
          productCLine: newRecord.productCLine,
          productPLine: newRecord.productPLine,
          preOrderDate: newRecord.preOrderDate ?? undefined,
          exclusives: newRecord.exclusives ?? undefined,
          explicitLyrics: newRecord.explicitLyrics,
          productPlayLink: newRecord.productPlayLink ?? undefined,
          linerNotes: newRecord.linerNotes ?? undefined,
          primaryMetadataLanguage: newRecord.primaryMetadataLanguage,
          compilation: newRecord.compilation ?? undefined,
          pdfBooklet: newRecord.pdfBooklet ?? undefined,
          timedReleaseDate: newRecord.timedReleaseDate ?? undefined,
          timedReleaseMusicServices: newRecord.timedReleaseMusicServices ?? undefined,
          lastProcessDate: newRecord.lastProcessDate,
          importDate: newRecord.importDate,

          // Required fields from schema
          createdBy: newRecord.createdBy ?? 'system',
          lastModified: newRecord.lastModified ?? new Date(),
          submittedAt: newRecord.submittedAt ?? new Date(),
          submittedBy: newRecord.submittedBy ?? undefined,
          vevoChannel: newRecord.vevoChannel ?? undefined,

          // Required track fields
          trackType: newRecord.trackType ?? 'default',
          trackId: newRecord.trackId ?? '',
          // trackVolume: newRecord.trackVolume ?? undefined,
          trackNumber: newRecord.trackNumber ?? '',
          trackName: newRecord.trackName ?? '',
          trackVersion: newRecord.trackVersion ?? undefined,
          trackDisplayArtist: newRecord.trackDisplayArtist ?? '',
          isrc: newRecord.isrc ?? '',
          trackPriceTier: newRecord.trackPriceTier ?? undefined,
          trackGenre: newRecord.trackGenre ?? '',
          audioLanguage: newRecord.audioLanguage ?? '',
          trackCLine: newRecord.trackCLine ?? '',
          trackPLine: newRecord.trackPLine ?? '',
          writersComposers: newRecord.writersComposers ?? '',
          publishersCollectionSocieties: newRecord.publishersCollectionSocieties ?? '',
          withholdMechanicals: newRecord.withholdMechanicals ?? '',
          preOrderType: newRecord.preOrderType ?? undefined,
          instantGratificationDate: newRecord.instantGratificationDate ?? new Date(),
          duration: newRecord.duration ?? '',
          sampleStartTime: newRecord.sampleStartTime ?? '',
          explicitLyricsTrack: newRecord.explicitLyricsTrack ?? '',
          albumOnly: newRecord.albumOnly ?? '',
          lyrics: newRecord.lyrics ?? undefined,
          additionalContributorsPerforming: newRecord.additionalContributorsPerforming ?? undefined,
          additionalContributorsNonPerforming:
            newRecord.additionalContributorsNonPerforming ?? undefined,
          producers: newRecord.producers ?? '',
          continuousMix: newRecord.continuousMix ?? '',
          continuouslyMixedIndividualSong: newRecord.continuouslyMixedIndividualSong ?? '',
          trackPlayLink: newRecord.trackPlayLink ?? '',
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

      await refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating record:', error);
    } finally {
      setIsSubmitting(false);
    }
    setIsDialogOpen(false);
  };

  const handleUpdate = async (updatedLpm: TLpm) => {
    setIsSubmitting(true);
    try {
      toast.promise(
        updateLpmMutation.mutateAsync({
          id: updatedLpm.id,
          productId: updatedLpm.productId,
          productType: updatedLpm.productType,
          productTitle: updatedLpm.productTitle,
          productVersion: updatedLpm.productVersion ?? undefined,
          parentLabel: updatedLpm.parentLabel ?? undefined,
          label: updatedLpm.label,
          artistsToUpdate: updatedLpm.artistsToUpdate ?? [],
          artists: updatedLpm.productDisplayArtist,

          originalReleaseDate: updatedLpm.originalReleaseDate ?? undefined,
          releaseDate: updatedLpm.releaseDate,
          upc: updatedLpm.upc,

          catalog: updatedLpm.catalog,
          productPriceTier: updatedLpm.productPriceTier ?? undefined,
          productGenre: updatedLpm.productGenre ?? '',
          submissionStatus: updatedLpm.submissionStatus,
          productCLine: updatedLpm.productCLine,
          productPLine: updatedLpm.productPLine,
          preOrderDate: updatedLpm.preOrderDate ?? new Date(),
          exclusives: updatedLpm.exclusives ?? undefined,
          explicitLyrics: updatedLpm.explicitLyrics,
          productPlayLink: updatedLpm.productPlayLink ?? undefined,
          linerNotes: updatedLpm.linerNotes ?? undefined,
          primaryMetadataLanguage: updatedLpm.primaryMetadataLanguage,
          compilation: updatedLpm.compilation ?? undefined,
          pdfBooklet: updatedLpm.pdfBooklet ?? undefined,
          timedReleaseDate: updatedLpm.timedReleaseDate ?? new Date(),
          timedReleaseMusicServices: updatedLpm.timedReleaseMusicServices ?? undefined,
          lastProcessDate: updatedLpm.lastProcessDate,
          importDate: updatedLpm.importDate,

          // Required fields from schema
          createdBy: updatedLpm.createdBy ?? 'system',
          lastModified: updatedLpm.lastModified ?? new Date(),
          submittedAt: updatedLpm.submittedAt ?? new Date(),
          submittedBy: updatedLpm.submittedBy ?? undefined,
          vevoChannel: updatedLpm.vevoChannel ?? undefined,

          // Required track fields
          trackType: updatedLpm.trackType ?? 'default',
          trackId: updatedLpm.trackId ?? '',
          trackVolume: updatedLpm.trackVolume ?? undefined,
          trackNumber: updatedLpm.trackNumber ?? '',
          trackName: updatedLpm.trackName ?? '',
          trackVersion: updatedLpm.trackVersion ?? undefined,
          trackDisplayArtist: updatedLpm.trackDisplayArtist ?? '',
          isrc: updatedLpm.isrc ?? '',
          trackPriceTier: updatedLpm.trackPriceTier ?? undefined,
          trackGenre: updatedLpm.trackGenre ?? '',
          audioLanguage: updatedLpm.audioLanguage ?? '',
          trackCLine: updatedLpm.trackCLine ?? '',
          trackPLine: updatedLpm.trackPLine ?? '',
          writersComposers: updatedLpm.writersComposers ?? '',
          publishersCollectionSocieties: updatedLpm.publishersCollectionSocieties ?? '',
          withholdMechanicals: updatedLpm.withholdMechanicals ?? '',
          preOrderType: updatedLpm.preOrderType ?? undefined,
          instantGratificationDate: updatedLpm.instantGratificationDate ?? new Date(),
          duration: updatedLpm.duration ?? '',
          sampleStartTime: updatedLpm.sampleStartTime ?? '',
          explicitLyricsTrack: updatedLpm.explicitLyricsTrack ?? '',
          albumOnly: updatedLpm.albumOnly ?? '',
          lyrics: updatedLpm.lyrics ?? undefined,
          additionalContributorsPerforming:
            updatedLpm.additionalContributorsPerforming ?? undefined,
          additionalContributorsNonPerforming:
            updatedLpm.additionalContributorsNonPerforming ?? undefined,
          producers: updatedLpm.producers ?? '',
          continuousMix: updatedLpm.continuousMix ?? '',
          continuouslyMixedIndividualSong: updatedLpm.continuouslyMixedIndividualSong ?? '',
          trackPlayLink: updatedLpm.trackPlayLink ?? '',
        }),
        {
          loading: _(msg`Updating record...`),
          success: () => {
            return _(msg`Record updated successfully`);
          },
          error: () => {
            return _(msg`Error updating record`);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deleteData: TLpm) => {
    try {
      toast.promise(deleteLpmMutation.mutateAsync({ id: deleteData.id }), {
        loading: _(msg`Deleting record...`),
        success: () => {
          return _(msg`Deleted record successfully`);
        },
        error: () => {
          return _(msg`Error deleting record`);
        },
        position: 'bottom-center',
        className: 'mb-16',
      });
      await refetch();
    } catch (error) {
      throw new Error('Error deleting record');
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

  const handleEdit = (record: TLpm) => {
    seteditingData(record);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    seteditingData(null);
    setIsDialogOpen(true);
  };
  return (
    <div className="mx-auto flex max-w-screen-xl flex-col gap-y-8 px-4 md:px-8">
      {/* <Toaster richColors position="bottom-center" className="mb-16" /> */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-8">
        <div className="flex w-fit flex-row items-center">
          {team && (
            <Avatar className="dark:border-border mr-3 h-12 w-12 border-2 border-solid border-white">
              {team.avatarImageId && <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />}
              <AvatarFallback className="text-muted-foreground text-xs">
                {team.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
          )}

          <h2 className="text-4xl font-semibold">
            <Trans>Virgin</Trans>
          </h2>
        </div>
        <div className="-m-1 flex w-full flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
          <CsvUploadInput
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleCsvUpload}
            multiple={false}
          />

          <TableArtistFilter artistData={artistData?.artists} isLoading={artistDataloading} />

          <AdvancedFilterDialog tableToConsult="Virgin" />
          <ArtistCreateDialog />

          <VirginSheet
            onSubmit={editingData ? handleUpdate : handleCreate}
            initialData={editingData}
            artistData={artistData?.artists}
            setInitialData={seteditingData}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <LpmTable
        onMultipleDelete={handleMultipleDelete}
        isMultipleDelete={isMultipleDelete}
        setIsMultipleDelete={setIsMultipleDelete}
        data={data?.records}
        findAll={findAll}
        isLoading={isLoading}
        isLoadingError={isLoadingError}
        onAdd={openCreateDialog}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
