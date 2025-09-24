import { useEffect, useMemo, useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { queryOptions } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { FolderType } from '@documenso/lib/types/folder-type';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { formatContractsPath } from '@documenso/lib/utils/teams';
import { type Contract } from '@documenso/prisma/client';
import { ExtendedContractStatus } from '@documenso/prisma/types/extended-contracts';
import { trpc } from '@documenso/trpc/react';
import { queryClient } from '@documenso/trpc/react';
import {
  type TFindContractsInternalResponse,
  ZFindContractsInternalRequestSchema,
} from '@documenso/trpc/server/contracts-router/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';
import { Tabs, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';

import { AdvancedFilterDialog } from '~/components/general/advanced-filter-drawer';
import { FolderGrid } from '~/components/general/folder/folder-grid';
import { ContractsStatus } from '~/components/general/task/contracts-status';
import { ContractsTable } from '~/components/tables/contracts-table';
import { useCurrentTeam } from '~/providers/team';
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
  const [editingUser, setEditingUser] = useState<Contract | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const [searchParams] = useSearchParams();
  const { folderId } = useParams();
  const { t } = useLingui();

  const {
    filters,
    perPage,
    query,
    page,
    statusParams,
    joinOperator,
    columnOrder,
    columnDirection,
  } = useSortParams({ sortColumns, status: ['VIGENTE', 'NO_ESPECIFICADO', 'FINALIZADO'] });

  const team = useCurrentTeam();

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

  const { data, isLoading, isLoadingError } = trpc.contracts.findContracts.useQuery(
    {
      query: findDocumentSearchParams.query || query,
      period: findDocumentSearchParams.period,
      page: page,
      perPage: perPage,
      status: statusParams,
      orderByColumn: columnOrder,
      orderByDirection: columnDirection as 'asc' | 'desc',
      filterStructure: filters,
      joinOperator: joinOperator,
    },
    queryOptions({
      queryKey: ['contracts', findDocumentSearchParams, folderId, team?.url],
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }),
  );

  const retryDocument = trpc.document.retryChatDocument.useMutation();

  const createManyContractsMutation = trpc.contracts.createManyContracts.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
  const deleteContractsMutation = trpc.contracts.deleteSoftContractsById.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
  const deleteMultipleContractsMutation =
    trpc.contracts.deleteSoftMultipleContractsByIds.useMutation({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      },
    });

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

      toast.success(t`Se han creado ${result.count} registros exitosament`, {
        position: 'bottom-center',
        className: 'mb-16',
      });

      // Refrescar los datos
      setCsvFile(null);
    } catch (error) {
      console.error('Error al procesar el CSV:', error);

      toast.error(t`Error while processing CSV`, {
        position: 'bottom-center',
        className: 'mb-16',
      });
    }
  };

  const handleRetry = async (row: Contract) => {
    try {
      const { documentId } = row;
      if (!documentId || documentId === 0) {
        toast.error(t`The record does not have an associated document.`, {
          position: 'bottom-center',
          className: 'mb-16',
        });
        return;
      }
      await retryDocument.mutateAsync({
        documentId: documentId,
      });
      toast.info(t`Attempting to retry`, {
        position: 'bottom-center',
        className: 'mb-16',
      });
    } catch (error) {
      toast.error(t`Error al reintentar`, {
        position: 'bottom-center',
        className: 'mb-16',
      });
      console.error('Error:', error);
    }
  };

  const hanleOnNavegate = (row: Contract) => {
    const { id } = row;
    const documentPath = `${documentRootPath}/${id}`;
    window.location.href = documentPath;
  };

  const handleDelete = (deleteData: Contract) => {
    toast.promise(deleteContractsMutation.mutateAsync({ id: deleteData.id }), {
      loading: t`Deleting record...`,
      success: () => {
        return t`Record deleted successfully`;
      },
      error: () => {
        return t`Error deleting record`;
      },
      position: 'bottom-center',
      className: 'mb-16',
    });
  };

  const handleMultipleDelete = async (ids: number[]) => {
    try {
      await deleteMultipleContractsMutation.mutateAsync({ ids: ids });
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  const handleEdit = (record: Contract) => {
    setEditingUser(record);
    setIsSheetOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
  };

  return (
    <div className="mx-auto flex max-w-screen-xl flex-col gap-y-8 px-4 md:px-8">
      <FolderGrid
        initialData={editingUser}
        setInitialData={setEditingUser}
        type={FolderType.CONTRACT}
        parentId={folderId ?? null}
        setIsSheetOpen={setIsSheetOpen}
        isSheetOpen={isSheetOpen}
      />

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
          </div>
        </div>
      </div>

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
