import { useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { type TIsrcSongs } from '@documenso/lib/types/isrc';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { type IsrcSongs } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
import { ZFindIsrcSongsInternalRequestSchema } from '@documenso/trpc/server/isrcsong-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';

import { AdvancedFilterDialog } from '~/components/general/advanced-filter-drawer';
import CsvUploadInput from '~/components/general/csv-input';
import IsrcSheet from '~/components/sheets/isrc-sheet';
import { IsrcTable } from '~/components/tables/isrc-table';
import { TableArtistFilter } from '~/components/tables/lpm-table-artist-filter';
import { useOptionalCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export function meta() {
  return appMetaTags('Isrc');
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

export default function IsrcPage() {
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

  const team = useOptionalCurrentTeam();

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );
  const { _ } = useLingui();

  const { data, isLoading, isLoadingError, refetch } = trpc.isrcSongs.findIsrcSongs.useQuery({
    query: query,
    page: page,
    artistIds: findDocumentSearchParams.artistIds,
    orderByColumn: columnOrder,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: applyFilters ? filters : [],
    joinOperator: joinOperator,
    perPage: perPage,
  });

  const { data: artistData, isLoading: artistDataloading } =
    trpc.isrcSongs.findIsrcUniqueArtists.useQuery();
  const findData = trpc.isrcSongs.findAllIsrc.useMutation();

  const createIsrcSongsMutation = trpc.isrcSongs.createIsrcSongs.useMutation();
  const createManyIsrcSongsMutation = trpc.isrcSongs.createManyIsrcSongs.useMutation();
  const updateIsrcSongsMutation = trpc.isrcSongs.updateIsrcSongsById.useMutation();
  const deleteIsrcSongsMutation = trpc.isrcSongs.deleteIsrcSongsById.useMutation();
  const deleteMultipleMutation = trpc.isrcSongs.deleteMultipleByIds.useMutation();

  const [editingData, seteditingData] = useState<IsrcSongs | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  const findAll = async () => {
    try {
      const result = await findData.mutateAsync({
        query: query,
        artistIds: findDocumentSearchParams.artistIds,
        orderByColumn: columnOrder,
        orderByDirection: columnDirection as 'asc' | 'desc',
        filterStructure: applyFilters ? filters : [],
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

  const handleCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);
      const convertDateFormat = (dateString: string): Date | undefined => {
        if (!dateString || dateString.trim() === '') return undefined;

        try {
          // Asume formato MM/dd/yyyy
          let [month, day, year] = dateString.split('/');
          if (!month || !day || !year) return undefined;

          //si formato dd/mm/yyyy
          if (Number(month) > 12 && Number(day) < 12) {
            const [dayAfterCheck, monthAfterCheck, yearAfterCheck] = dateString.split('/');
            month = dayAfterCheck;
            day = monthAfterCheck;
            year = yearAfterCheck;
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

      const validatedData = csvData.map((item) => ({
        trackName: item.Track || item['trackName'] || '', // Mapear "Track" a trackName
        artist: item.Artista || item['isrcArtists'] || '', // Mapear "Artista" a artist
        duration: item['Duración / Tipo'] || item['duration'] || item['Duration'] || '', // Mapear "Duración / Tipo" a duration
        title: item['Titulo (Álbum/Single/LP/EP)'] || item['title'] || item['Title'] || '', // Mapear "Titulo..." a title
        license: item.Licencia || item['license'] || '', // Mapear "Licencia" a license
        date:
          convertDateFormat(item['Fecha (año)']) ||
          convertDateFormat(item['date']) ||
          convertDateFormat(item['Date']) ||
          new Date(), // Mapear "Fecha (año)" a date
        isrc: item['ISRC'] || item['isrc'] || '', // Mapear "ISRC" a isrc
      }));
      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      toast.promise(
        createManyIsrcSongsMutation.mutateAsync({
          isrcSongs: filteredData,
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
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async (newRecord: Omit<TIsrcSongs, 'id'>) => {
    setIsSubmitting(true);
    try {
      toast.promise(
        createIsrcSongsMutation.mutateAsync({
          trackName: newRecord.trackName ?? '',
          isrc: newRecord.isrc ?? '',
          artistsToUpdate: newRecord.artistsToUpdate ?? [],
          duration: newRecord.duration ?? '',
          title: newRecord.title ?? '',
          license: newRecord.license ?? '',
          date: newRecord.date ?? new Date(),
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
      seteditingData(null);
    } catch (error) {
      throw new Error('Error creating record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (updatedIsrcSongs: TIsrcSongs) => {
    setIsSubmitting(true);
    try {
      toast.promise(
        updateIsrcSongsMutation.mutateAsync({
          id: updatedIsrcSongs.id,
          artists: updatedIsrcSongs.artists ?? [],

          trackName: updatedIsrcSongs.trackName ?? undefined,
          artist: updatedIsrcSongs.artist ?? undefined,
          duration: updatedIsrcSongs.duration ?? undefined,
          title: updatedIsrcSongs.title ?? undefined,
          license: updatedIsrcSongs.license ?? undefined,
          date: updatedIsrcSongs.date ?? undefined,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deleteData: IsrcSongs) => {
    try {
      toast.promise(deleteIsrcSongsMutation.mutateAsync({ id: deleteData.id }), {
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
      // await deleteIsrcSongsMutation.mutateAsync({ id: deleteData.id });
    } catch (error) {
      console.error('Error deleting record:', error);
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
  const handleEdit = (record: IsrcSongs) => {
    seteditingData(record);
    setIsDialogOpen(true);
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
            <Trans>Isrc</Trans>
          </h2>
        </div>

        <div className="-m-1 flex w-full flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
          {/* <div className="flex w-full items-center justify-between gap-x-2 sm:w-80">
            <Input type="file" accept=".csv" onChange={handleFileChange} className="max-w-sm" />
            <Button onClick={handleCsvUpload} disabled={!csvFile || isSubmitting}>
              {isSubmitting ? 'Procesando...' : 'Cargar CSV'}
            </Button>
          </div> */}

          <CsvUploadInput
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleCsvUpload}
            multiple={false}
          />

          <TableArtistFilter artistData={artistData} isLoading={artistDataloading} />
          {/* 
          <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-4 sm:w-48">
            <DocumentSearch initialValue={findDocumentSearchParams.query} />
          </div> */}
          <AdvancedFilterDialog tableToConsult="Isrc" />

          <IsrcSheet
            onSubmit={editingData ? handleUpdate : handleCreate}
            initialData={editingData}
            artistData={artistData}
            setInitialData={seteditingData}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <IsrcTable
        data={data}
        onMultipleDelete={handleMultipleDelete}
        setIsMultipleDelete={setIsMultipleDelete}
        isMultipleDelete={isMultipleDelete}
        isLoading={isLoading}
        findAll={findAll}
        isLoadingError={isLoadingError}
        onAdd={openCreateDialog}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
