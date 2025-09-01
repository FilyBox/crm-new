import { useEffect, useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { toast as sonnertoast } from 'sonner';
import { z } from 'zod';

import { type TDistribution } from '@documenso/lib/types/distribution';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { type DistributionStatement } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
import { ZFindDistributionInternalRequestSchema } from '@documenso/trpc/server/distributionStatement-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { AdvancedFilterDialog } from '~/components/general/advanced-filter-drawer';
import CsvUploadInput from '~/components/general/csv-input';
import DistributionSheet from '~/components/sheets/distribution-sheet';
import { DistributionTable } from '~/components/tables/distribution-table';
import { TablePlatformFilter } from '~/components/tables/distribution-table-musicplatform-filter';
import { TableTerritoryFilter } from '~/components/tables/distribution-table-territoriesName-filter';
import { useOptionalCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export function meta() {
  return appMetaTags('distribution');
}

const sortColumns = z.enum([
  'id',
  'codigoDelTerritorio',
  'copyright',
  'costoCarga',
  'costoDistribucion',
  'cuotaAdministracion',
  'ingresosRecibidos',
  'isrc',
  'localProductNumber',
  'marketingOwner',
  'nombreDelTerritorio',
  'mesReportado',
  'nombreDistribucion',
  'teamId',
  'userId',
  'numeroDeCatalogo',
  'otrosCostos',
  'ppd',
  'proyecto',
  'rbp',
  'regaliasArtisticas',
  'rtl',
  'territorio',
  'tipoDeCambio',
  'tipoDeIngreso',
  'tipoDePrecio',
  'tituloCatalogo',
  'upc',
  'updatedAt',
  'valorRecibido',
  'venta',
  'createdAt',
]);

export const TypeSearchParams = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.undefined()]),
);

const ZSearchParamsSchema = ZFindDistributionInternalRequestSchema.pick({
  period: true,
  page: true,
  perPage: true,
  query: true,
}).extend({
  platformIds: z.string().transform(parseToIntegerArray).optional().catch([]),
  territoryIds: z.string().transform(parseToIntegerArray).optional().catch([]),
});

export default function DistributionPage() {
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

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );
  const { toast } = useToast();
  const { _ } = useLingui();

  const team = useOptionalCurrentTeam();
  const { data, isLoading, isLoadingError, refetch } = trpc.distribution.findDistribution.useQuery({
    query: query,
    page: page,
    perPage: perPage,
    platformIds: findDocumentSearchParams.platformIds,
    territoryIds: findDocumentSearchParams.territoryIds,
    orderByColumn: columnOrder,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: applyFilters ? filters : [],
    joinOperator: joinOperator,
  });

  const { data: territoryData, isLoading: territoryLoading } =
    trpc.distribution.findDistributionUniqueTerritories.useQuery();

  const { data: platformData, isLoading: platformLoading } =
    trpc.distribution.findDistributionUniquePlatform.useQuery();

  const createManyDistributionMutation = trpc.distribution.createManyDistribution.useMutation();
  const createDistributionMutation = trpc.distribution.createDistribution.useMutation();
  const updateDistributionByIdMutation = trpc.distribution.updateDistributionById.useMutation();
  const deleteDistributionByIdMutation = trpc.distribution.deleteDistributionById.useMutation();
  const deleteMultipleMutation = trpc.distribution.deleteMultipleByIds.useMutation();

  const findData = trpc.distribution.findAllDistribution.useMutation();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [dataIntial, setData] = useState<DistributionStatement[]>([]);
  const [editingUser, setEditingUser] = useState<TDistribution | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  useEffect(() => {
    void refetch();
  }, [team?.url]);

  const handleCreate = async (newRecord: Omit<TDistribution, 'id'>) => {
    setIsSubmitting(true);
    try {
      const { id } = await createDistributionMutation.mutateAsync({
        // Territory and platform arrays
        territories: newRecord.distributionStatementTerritories ?? undefined,
        musicPlatform: newRecord.distributionStatementMusicPlatforms ?? undefined,

        // String fields
        marketingOwner: newRecord.marketingOwner ?? undefined,
        nombreDistribucion: newRecord.nombreDistribucion ?? undefined,
        proyecto: newRecord.proyecto ?? undefined,
        numeroDeCatalogo: newRecord.numeroDeCatalogo ?? undefined,
        upc: newRecord.upc ?? undefined,
        localProductNumber: newRecord.localProductNumber ?? undefined,
        isrc: newRecord.isrc ?? undefined,
        tituloCatalogo: newRecord.tituloCatalogo ?? undefined,
        territorio: newRecord.territorio ?? undefined,
        codigoDelTerritorio: newRecord.codigoDelTerritorio ?? undefined,
        nombreDelTerritorio: newRecord.nombreDelTerritorio ?? undefined,
        tipoDePrecio: newRecord.tipoDePrecio ?? undefined,
        tipoDeIngreso: newRecord.tipoDeIngreso ?? undefined,

        // Numeric fields
        mesReportado: newRecord.mesReportado ?? undefined,
        venta: newRecord.venta ?? undefined,
        rtl: newRecord.rtl ?? undefined,
        ppd: newRecord.ppd ?? undefined,
        rbp: newRecord.rbp ?? undefined,
        tipoDeCambio: newRecord.tipoDeCambio ?? undefined,
        valorRecibido: newRecord.valorRecibido ?? undefined,
        regaliasArtisticas: newRecord.regaliasArtisticas ?? undefined,
        costoDistribucion: newRecord.costoDistribucion ?? undefined,
        copyright: newRecord.copyright ?? undefined,
        cuotaAdministracion: newRecord.cuotaAdministracion ?? undefined,
        costoCarga: newRecord.costoCarga ?? undefined,
        otrosCostos: newRecord.otrosCostos ?? undefined,
        ingresosRecibidos: newRecord.ingresosRecibidos ?? undefined,
      });

      console.log('Created Record ID:', id);
      await refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: TDistribution) => {
    setEditingUser(record);
    setIsDialogOpen(true);
  };

  const handleDelete = (deleteData: DistributionStatement) => {
    try {
      setData(dataIntial.filter((record) => record.id !== deleteData.id));
      sonnertoast.promise(deleteDistributionByIdMutation.mutateAsync({ id: deleteData.id }), {
        loading: _(msg`Deleting record...`),
        success: _(msg`Record deleted successfully`),
        error: _(msg`Error deleting record`),
        position: 'bottom-center',
        className: 'mb-16',
      });
    } catch (error) {
      setData((prevData) => [...prevData, deleteData]);
      sonnertoast.error(_(msg`Error deleting record`));
      console.error('Error deleting record:', error);
    }
  };

  const handleMultipleDelete = async (ids: number[]) => {
    try {
      await deleteMultipleMutation.mutateAsync({ ids: ids });

      await refetch();
    } catch (error) {
      sonnertoast.error(_(msg`Error deleting record`));
    } finally {
      setIsMultipleDelete(false);
    }
  };

  const handleUpdate = async (updatedDistribution: TDistribution) => {
    console.log('Updated Distribution:', updatedDistribution);
    console.log('id', updatedDistribution.id);
    try {
      const { id } = await updateDistributionByIdMutation.mutateAsync({
        id: updatedDistribution.id,

        // Territory and platform arrays
        territories: updatedDistribution.distributionStatementTerritories ?? undefined,
        musicPlatform: updatedDistribution.distributionStatementMusicPlatforms ?? undefined,

        // String fields
        marketingOwner: updatedDistribution.marketingOwner ?? undefined,
        nombreDistribucion: updatedDistribution.nombreDistribucion ?? undefined,
        proyecto: updatedDistribution.proyecto ?? undefined,
        numeroDeCatalogo: updatedDistribution.numeroDeCatalogo ?? undefined,
        upc: updatedDistribution.upc ?? undefined,
        localProductNumber: updatedDistribution.localProductNumber ?? undefined,
        isrc: updatedDistribution.isrc ?? undefined,
        tituloCatalogo: updatedDistribution.tituloCatalogo ?? undefined,
        territorio: updatedDistribution.territorio ?? undefined,
        codigoDelTerritorio: updatedDistribution.codigoDelTerritorio ?? undefined,
        nombreDelTerritorio: updatedDistribution.nombreDelTerritorio ?? undefined,
        tipoDePrecio: updatedDistribution.tipoDePrecio ?? undefined,
        tipoDeIngreso: updatedDistribution.tipoDeIngreso ?? undefined,

        // Numeric fields
        mesReportado: updatedDistribution.mesReportado ?? undefined,
        venta: updatedDistribution.venta ?? undefined,
        rtl: updatedDistribution.rtl ?? undefined,
        ppd: updatedDistribution.ppd ?? undefined,
        rbp: updatedDistribution.rbp ?? undefined,
        tipoDeCambio: updatedDistribution.tipoDeCambio ?? undefined,
        valorRecibido: updatedDistribution.valorRecibido ?? undefined,
        regaliasArtisticas: updatedDistribution.regaliasArtisticas ?? undefined,
        costoDistribucion: updatedDistribution.costoDistribucion ?? undefined,
        copyright: updatedDistribution.copyright ?? undefined,
        cuotaAdministracion: updatedDistribution.cuotaAdministracion ?? undefined,
        costoCarga: updatedDistribution.costoCarga ?? undefined,
        otrosCostos: updatedDistribution.otrosCostos ?? undefined,
        ingresosRecibidos: updatedDistribution.ingresosRecibidos ?? undefined,
      });

      console.log('Updated Record ID:', id);

      setData(
        dataIntial.map((record) =>
          record.id === updatedDistribution.id ? updatedDistribution : record,
        ),
      );
      // setIsDialogOpen(false);
      // setEditingUser(null);
      await refetch();
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const findAll = async () => {
    try {
      const { data } = await findData.mutateAsync({});
      console.log('data aa', data);

      return data;
    } catch (error) {
      console.error('Error fetching all distributions:', error);
      return [];
    }
  };

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

  // Format date to ISO string or in a custom format
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
        console.log('CSV Item:', item);
        console.log('item nombre del territorio:', item['Nombre del Territorio']);
        // Convert string values to number for numeric fields
        const convertToNumber = (value: string | undefined): number | undefined => {
          if (value === undefined || value === '') return undefined;
          const num = parseFloat(value.replace(',', '.'));
          return isNaN(num) ? undefined : num;
        };

        return {
          // id: item['id'] || undefined,
          marketingOwner: item['Marketing Owner'] || undefined,
          nombreDistribucion: item['Nombre Distribucion'] || undefined,
          proyecto: item['Projecto'] || undefined,
          numeroDeCatalogo: item['Numero de Catalogo'],
          upc: item['UPC'] || undefined,
          localProductNumber: item['Local Product Number'] || undefined,
          isrc: item['ISRC'] || undefined,
          tituloCatalogo: item['Titulo catalogo'] || undefined,
          mesReportado: convertToNumber(item['Mes Reportado']),
          territorio: item['Territorio'] || undefined,
          codigoDelTerritorio: item['Codigo del Territorio'],
          nombreDelTerritorio: item['Nombre del Territorio'],
          tipoDePrecio: item['Tipo de Precio'],
          tipoDeIngreso: item['Tipo de Ingreso'],
          venta: convertToNumber(item['Venta']),
          rtl: convertToNumber(item['RTL']),
          ppd: convertToNumber(item['PPD']),
          rbp: convertToNumber(item['RBP']),
          tipoDeCambio: convertToNumber(item['Tipo de Cambio:']),
          valorRecibido: convertToNumber(item['Valor Recibido']),
          regaliasArtisticas: convertToNumber(item['Regalias Artisticas']),
          costoDistribucion: convertToNumber(item['Costo Distribucion']),
          copyright: convertToNumber(item['Copyright']),
          cuotaAdministracion: convertToNumber(item['Cuota Administracion']),
          costoCarga: convertToNumber(item['Costo Carga']),
          otrosCostos: convertToNumber(item['Otros Costos']),
          ingresosRecibidos: convertToNumber(item['Ingresos Recibidos']),
        };
      });
      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      // Usar la mutación para crear múltiples registros
      // const result = await createManyDistributionMutation.mutateAsync({
      //   distributions: filteredData,
      // });

      sonnertoast.promise(
        createManyDistributionMutation.mutateAsync({
          distributions: filteredData,
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
          // className: 'mb-16',
        },
      );

      // Refrescar los datos
      await refetch();
      setCsvFile(null);
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
      toast({
        variant: 'destructive',
        description: 'Error al procesar el archivo CSV: ',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl gap-y-8 px-4 md:px-8">
      {/* <CardsChat /> */}

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
            <Trans>Ada</Trans>
          </h1>
        </div>

        <div className="-m-1 flex w-full flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
          <CsvUploadInput
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleCsvUpload}
            onUpload={setCsvFile}
            multiple={false}
          />
          <TableTerritoryFilter territoryData={territoryData} isLoading={territoryLoading} />

          <TablePlatformFilter platformData={platformData} isLoading={platformLoading} />

          <AdvancedFilterDialog tableToConsult="Distribution" />
          <DistributionSheet
            territoryData={territoryData}
            platformData={platformData}
            setInitialData={setEditingUser}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            isSubmitting={isSubmitting}
            onSubmit={editingUser ? handleUpdate : handleCreate}
            initialData={editingUser}
          />
        </div>

        <div className="mt w-full">
          <DistributionTable
            onMultipleDelete={handleMultipleDelete}
            setIsMultipleDelete={setIsMultipleDelete}
            isMultipleDelete={isMultipleDelete}
            onEdit={handleEdit}
            findAll={findAll}
            onDelete={handleDelete}
            data={data}
            isLoading={isLoading}
            isLoadingError={isLoadingError}
          />
        </div>
      </div>
    </div>
  );
}
