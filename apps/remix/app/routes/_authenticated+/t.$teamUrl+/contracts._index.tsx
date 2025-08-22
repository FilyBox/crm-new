import { useEffect, useMemo, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Link } from 'react-router';
import { z } from 'zod';

import { FolderType } from '@documenso/lib/types/folder-type';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { formatContractsPath } from '@documenso/lib/utils/teams';
import { type Contract } from '@documenso/prisma/client';
import { ExtendedContractStatus } from '@documenso/prisma/types/extended-contracts';
import { trpc } from '@documenso/trpc/react';
import {
  type TFindContractsInternalResponse,
  ZFindContractsInternalRequestSchema,
} from '@documenso/trpc/server/contracts-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';
import { Dialog, DialogContent } from '@documenso/ui/primitives/dialog';
import ContractForm from '@documenso/ui/primitives/form-contracts';
import { Tabs, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { AdvancedFilterDialog } from '~/components/general/advanced-filter-drawer';
import { FolderGrid } from '~/components/general/folder/folder-grid';
import { ContractsStatus } from '~/components/general/task/contracts-status';
import { ContractsTable } from '~/components/tables/contracts-table';
import { useOptionalCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export function meta() {
  return appMetaTags('Contracts');
}

const ZSearchParamsSchema = ZFindContractsInternalRequestSchema.pick({
  period: true,
  page: true,
  perPage: true,
  status: true,
  query: true,
  filters: true,
  joinOperator: true,
});

const sortColumns = z.enum([
  'id',
  'createdAt',
  'updatedAt',
  'status',
  'title',
  'fileName',
  'startDate',
  'endDate',
  'isPossibleToExpand',
  'possibleExtensionTime',
  'documentId',
]);

export const TypeSearchParams = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.undefined()]),
);

export default function ContractsPage() {
  const [searchParams] = useSearchParams();
  const { folderId } = useParams();

  const {
    filters,
    applyFilters,
    applySorting,
    perPage,
    query,
    page,
    statusParams,
    joinOperator,
    columnOrder,
    columnDirection,
  } = useSortParams({ sortColumns, status: ['VIGENTE', 'NO_ESPECIFICADO', 'FINALIZADO'] });

  const team = useOptionalCurrentTeam();
  const navigate = useNavigate();

  const documentRootPath = formatContractsPath(team?.url);
  const [status, setStatus] = useState<TFindContractsInternalResponse['status']>({
    [ExtendedContractStatus.VIGENTE]: 0,
    [ExtendedContractStatus.NO_ESPECIFICADO]: 0,
    [ExtendedContractStatus.FINALIZADO]: 0,
    [ExtendedContractStatus.ALL]: 0,
  });

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );

  const { data, isLoading, isLoadingError, refetch } = trpc.contracts.findContracts.useQuery({
    query: findDocumentSearchParams.query || query,
    period: findDocumentSearchParams.period,
    page: page,
    perPage: perPage,
    status: statusParams,
    orderByColumn: columnOrder,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: applyFilters ? filters : [],
    joinOperator: joinOperator,
  });

  const retryDocument = trpc.document.retryChatDocument.useMutation();

  const {
    data: documentsData,
    // isLoading: isDocumentsLoading,
    // isLoadingError: isDocumentsLoadingError,
    // refetch: refetchDocuments,
  } = trpc.document.findAllDocumentsInternalUseToChat.useQuery({
    query: findDocumentSearchParams.query,
    period: findDocumentSearchParams.period,
    page: findDocumentSearchParams.page,
    perPage: findDocumentSearchParams.perPage,
  });

  const createContractsMutation = trpc.contracts.createContracts.useMutation();
  const createManyContractsMutation = trpc.contracts.createManyContracts.useMutation();
  const updateContractsMutation = trpc.contracts.updateContractsById.useMutation();
  const deleteContractsMutation = trpc.contracts.deleteContractsById.useMutation();
  const deleteMultipleContractsMutation = trpc.contracts.deleteMultipleContractsByIds.useMutation();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<Contract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isMultipleDelete, setIsMultipleDelete] = useState(false);

  const getTabHref = (value: keyof typeof ExtendedContractStatus) => {
    const params = new URLSearchParams(searchParams);

    params.set('status', value);

    if (value === ExtendedContractStatus.ALL) {
      params.delete('status');
    }

    if (params.has('page')) {
      params.delete('page');
    }

    return `${formatContractsPath(team?.url)}?${params.toString()}`;
  };

  const mapExpansionPossibility = (value: string): string => {
    const normalized = value.trim().toUpperCase();

    if (normalized === 'SI') {
      return 'SI';
    } else if (normalized === 'NO') {
      return 'NO';
    } else {
      return 'NO_ESPECIFICADO';
    }
  };

  // Helper function to map contract status values from CSV to enum values
  const mapContractStatus = (value: string): string => {
    const normalized = value.trim().toUpperCase();

    if (normalized === 'VIGENTE') {
      return 'VIGENTE';
    } else if (normalized === 'FINALIZADO') {
      return 'FINALIZADO';
    } else {
      return 'NO_ESPECIFICADO';
    }
  };

  useEffect(() => {
    if (data?.status) {
      setStatus(data.status);
    }
  }, [data?.status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    const convertDateFormat = (dateString: string): Date | undefined => {
      if (!dateString || dateString.trim() === '') return undefined;

      try {
        // Asume formato MM/dd/yyyy
        let [month, day] = dateString.split('/');
        const year = dateString.split('/')[2];
        if (!month || !day || !year) return undefined;

        // if ( day > '31' || year.length !== 4) {
        //   console.warn(`Invalid date format: ${dateString}`);
        //   return undefined;
        // }

        if (month > day) {
          [month, day] = [day, month];
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

    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(csvFile);

      // Mapear los campos del CSV a la estructura de la base de datos
      const validatedData = csvData.map((item) => {
        // Use type assertion to ensure correct string literal types
        const status = mapContractStatus(item.status || '') as
          | 'NO_ESPECIFICADO'
          | 'VIGENTE'
          | 'FINALIZADO';
        const isPossibleToExpand = mapExpansionPossibility(item.isPossibleToExpand || '') as
          | 'SI'
          | 'NO'
          | 'NO_ESPECIFICADO';

        return {
          title: item.title || '',
          fileName: item.fileName || undefined,
          artists: item.artists || '',
          startDate: convertDateFormat(item.startDate) || new Date(),
          endDate: convertDateFormat(item.endDate) || new Date(),
          isPossibleToExpand,
          possibleExtensionTime: item.possibleExtensionTime || undefined,
          status,
          documentId: parseInt(item.documentId || '0'),
          summary: item.summary || undefined,
        };
      });

      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      // Usar la mutación para crear múltiples registros
      const result = await createManyContractsMutation.mutateAsync({
        Contracts: filteredData,
      });

      toast({
        description: `Se han creado ${result.count} registros exitosamente`,
      });

      // Refrescar los datos
      await refetch();
      setCsvFile(null);
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
      toast({
        variant: 'destructive',
        description:
          'Error al procesar el archivo CSV: ' +
          (error instanceof Error ? error.message : 'Error desconocido'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async (row: Contract) => {
    try {
      const { documentId, id } = row;
      if (!documentId || documentId === 0) {
        toast({
          variant: 'destructive',
          description: 'El registro no tiene un documento asociado.',
        });
        return;
      }
      const result = await retryDocument.mutateAsync({
        documentId: documentId,
      });

      toast({
        description: 'Attempting to retry',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Error',
      });
      console.error('Error:', error);
    }
  };

  const handleCreate = async (newRecord: Omit<Contract, 'id'>) => {
    setIsSubmitting(true);
    try {
      await createContractsMutation.mutateAsync({
        title: newRecord.title ?? '',
        fileName: newRecord.fileName ?? '',
        artists: newRecord.artists ?? '',
        startDate: newRecord.startDate ?? new Date(),
        endDate: newRecord.endDate ?? new Date(),
        isPossibleToExpand: newRecord.isPossibleToExpand ?? '',
        possibleExtensionTime: newRecord.possibleExtensionTime ?? '',
        status: newRecord.status ?? 'NO_ESPECIFICADO',
        documentId: newRecord.documentId ?? 0,
        summary: newRecord.summary ?? '',
      });
      await refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const hanleOnNavegate = (row: Contract) => {
    const { documentId } = row;
    const documentPath = `${documentRootPath}/${documentId}`;
    window.location.href = documentPath;
  };
  const handleUpdate = async (updatedContracts: Contract) => {
    setIsSubmitting(true);
    try {
      await updateContractsMutation.mutateAsync({
        id: updatedContracts.id,
        title: updatedContracts.title ?? '',
        artists: updatedContracts.artists ?? '',
        fileName: updatedContracts.fileName ?? undefined,
        startDate: updatedContracts.startDate ?? new Date(),
        endDate: updatedContracts.endDate ?? new Date(),
        isPossibleToExpand: updatedContracts.isPossibleToExpand ?? undefined,
        possibleExtensionTime: updatedContracts.possibleExtensionTime ?? undefined,
        status: updatedContracts.status ?? undefined,
        documentId: updatedContracts.documentId ?? undefined,
        summary: updatedContracts.summary ?? undefined,
      });
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (deleteData: Contract) => {
    try {
      await deleteContractsMutation.mutateAsync({ id: deleteData.id });

      toast({
        description: 'Data deleted successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Error deleting data',
      });
      console.error('Error deleting record:', error);
    }
  };

  const handleMultipleDelete = async (ids: number[]) => {
    try {
      await deleteMultipleContractsMutation.mutateAsync({ ids: ids });

      toast({
        description: `${ids.length} deleted successfully`,
      });
      await refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Error deleting data',
      });
      console.error('Error deleting record:', error);
    } finally {
      setIsMultipleDelete(false);
    }
  };

  const handleEdit = (record: Contract) => {
    setEditingUser(record);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="mx-auto flex max-w-screen-xl flex-col gap-y-8 px-4 md:px-8">
      <FolderGrid type={FolderType.CONTRACT} parentId={folderId ?? null} />

      <div className="mt-12 flex flex-wrap items-center justify-between gap-x-4 gap-y-8">
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
            <Trans>Contracts</Trans>
          </h2>
        </div>

        <div className="-m-1 flex flex-wrap gap-x-4 gap-y-6 overflow-hidden p-1">
          <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-4">
            <Tabs value={statusParams || 'ALL'} className="overflow-x-auto">
              <TabsList className="flex h-fit flex-wrap sm:flex">
                {['VIGENTE', 'NO_ESPECIFICADO', 'FINALIZADO', 'ALL'].map((value) => {
                  return (
                    <TabsTrigger
                      key={value}
                      className="hover:text-foreground min-w-[60px]"
                      value={value}
                      asChild
                    >
                      <Link
                        to={getTabHref(value as keyof typeof ExtendedContractStatus)}
                        preventScrollReset
                      >
                        <ContractsStatus status={value as ExtendedContractStatus} />

                        {value !== 'ALL' && (
                          <span className="ml-1 inline-block opacity-50">
                            {status[value as ExtendedContractStatus]}
                          </span>
                        )}
                      </Link>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <AdvancedFilterDialog tableToConsult="Contracts" />
            {/* <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-4 sm:w-48">
              <DocumentSearch initialValue={findDocumentSearchParams.query} />
            </div> */}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <div>
            <ContractForm
              documents={documentsData || []}
              isSubmitting={isSubmitting}
              onSubmit={editingUser ? handleUpdate : handleCreate}
              initialData={editingUser}
            />
          </div>
        </DialogContent>
        {/* <div className="mb-4 flex items-center gap-2">
          <Input type="file" accept=".csv" onChange={handleFileChange} className="max-w-sm" />
          <Button onClick={handleCsvUpload} disabled={!csvFile || isSubmitting}>
            {isSubmitting ? 'Procesando...' : 'Cargar CSV'}
          </Button>
        </div> */}
      </Dialog>
      {/* {data && (!data?.documents.data.length || data?.documents.data.length === 0) ? (
        <GeneralTableEmptyState status={'ALL'} />
      ) : ( */}
      <ContractsTable
        data={
          data?.documents ?? {
            data: [],
            count: 0,
            currentPage: 1,
            perPage: 10,
            totalPages: 1,
          }
        }
        onMultipleDelete={handleMultipleDelete}
        onRetry={handleRetry}
        isLoading={isLoading}
        isMultipleDelete={isMultipleDelete}
        isLoadingError={isLoadingError}
        // onMoveDocument={(row: Contract) => {
        //   setDocumentToMove(row.id);
        //   setIsMovingDocument(true);
        // }}
        onAdd={openCreateDialog}
        onEdit={handleEdit}
        onNavegate={hanleOnNavegate}
        onDelete={handleDelete}
      />
    </div>
  );
}
