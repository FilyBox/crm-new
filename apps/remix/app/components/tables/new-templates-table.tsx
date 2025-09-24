import { useMemo } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Globe2Icon, InfoIcon, Link2Icon, LockIcon } from 'lucide-react';
import { Link } from 'react-router';

import { formatTemplatesPath } from '@documenso/lib/utils/teams';
import type { TFindTemplatesResponse } from '@documenso/trpc/server/template-router/schema';
import { useDataTable } from '@documenso/ui/lib/use-data-table';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { DataTable, type DataTableColumnDef } from '@documenso/ui/primitives/data-table-table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@documenso/ui/primitives/tooltip';

import { TemplateType } from '~/components/general/template/template-type';
import { useCurrentTeam } from '~/providers/team';

import { TemplateUseDialog } from '../dialogs/template-use-dialog';
import { TemplateDirectLinkBadge } from '../general/template/template-direct-link-badge';
import { DataTableAdvancedToolbar } from './data-table-advanced-toolbar';
import { DataTableFilterList } from './data-table-filter-list';
import { DataTableSkeleton } from './data-table-skeleton';
import { DataTableSortList } from './data-table-sort-list';
import { TableActionBar } from './table-action-bar';
import { TemplatesTableActionDropdown } from './templates-table-action-dropdown';

export type DocumentsTableProps = {
  data?: TFindTemplatesResponse;
  isLoading?: boolean;
  isLoadingError?: boolean;
  onMultipleDownload?: (ids: number[]) => Promise<void>;
  onMoveDocument?: (data: TemplatesTableRow) => void;
  onHandleRetry?: (documenDataId: string, documentId: number) => void;
  onNavegate?: (data: TemplatesTableRow) => void;
  documentRootPath: string;
  templateRootPath: string;
};

type TemplatesTableRow = TFindTemplatesResponse['data'][number];

export const TemplatesTable = ({
  data,
  isLoading,
  isLoadingError,
  onMoveDocument,
  onMultipleDownload,
  onNavegate,
  documentRootPath,
  templateRootPath,
}: DocumentsTableProps) => {
  const { _, i18n } = useLingui();

  const formatTemplateLink = (row: TemplatesTableRow) => {
    const path = formatTemplatesPath(team.url);
    return `${path}/${row.id}`;
  };
  const team = useCurrentTeam();

  const columns = useMemo(() => {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-0.5"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-0.5"
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      },

      {
        header: _(msg`Created`),
        accessorKey: 'createdAt',
        cell: ({ row }) => i18n.date(row.original.createdAt),
      },
      {
        header: _(msg`Title`),
        cell: ({ row }) => (
          <Link
            to={formatTemplateLink(row.original)}
            className="block max-w-[10rem] cursor-pointer truncate font-medium hover:underline md:max-w-[20rem]"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        header: () => (
          <div className="flex flex-row items-center">
            <Trans>Type</Trans>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="mx-2 h-4 w-4" />
              </TooltipTrigger>

              <TooltipContent className="text-foreground max-w-md space-y-2 !p-0">
                <ul className="text-muted-foreground space-y-0.5 divide-y [&>li]:p-4">
                  <li>
                    <h2 className="mb-2 flex flex-row items-center font-semibold">
                      <Globe2Icon className="mr-2 h-5 w-5 text-green-500 dark:text-green-300" />
                      <Trans>Public</Trans>
                    </h2>

                    <p>
                      <Trans>
                        Public templates are connected to your public profile. Any modifications to
                        public templates will also appear in your public profile.
                      </Trans>
                    </p>
                  </li>
                  <li>
                    <div className="mb-2 flex w-fit flex-row items-center rounded border border-neutral-300 bg-neutral-200 px-1.5 py-0.5 text-xs dark:border-neutral-500 dark:bg-neutral-600">
                      <Link2Icon className="mr-1 h-3 w-3" />
                      <Trans>direct link</Trans>
                    </div>

                    <p>
                      <Trans>
                        Direct link templates contain one dynamic recipient placeholder. Anyone with
                        access to this link can sign the document, and it will then appear on your
                        documents page.
                      </Trans>
                    </p>
                  </li>
                  <li>
                    <h2 className="mb-2 flex flex-row items-center font-semibold">
                      <LockIcon className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-300" />
                      {team?.id ? <Trans>Team Only</Trans> : <Trans>Private</Trans>}
                    </h2>

                    <p>
                      {team?.id ? (
                        <Trans>
                          Team only templates are not linked anywhere and are visible only to your
                          team.
                        </Trans>
                      ) : (
                        <Trans>Private templates can only be modified and viewed by you.</Trans>
                      )}
                    </p>
                  </li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        accessorKey: 'type',
        cell: ({ row }) => (
          <div className="flex flex-row items-center">
            <TemplateType type={row.original.type} />

            {row.original.directLink?.token && (
              <TemplateDirectLinkBadge
                className="ml-2"
                token={row.original.directLink.token}
                enabled={row.original.directLink.enabled}
              />
            )}
          </div>
        ),
      },
      {
        header: _(msg`Actions`),
        accessorKey: 'actions',
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-x-4">
              <TemplateUseDialog
                templateId={row.original.id}
                templateSigningOrder={row.original.templateMeta?.signingOrder}
                documentDistributionMethod={row.original.templateMeta?.distributionMethod}
                recipients={row.original.recipients}
                documentRootPath={documentRootPath}
              />

              <TemplatesTableActionDropdown
                row={row.original}
                teamId={team?.id}
                templateRootPath={templateRootPath}
              />
            </div>
          );
        },
      },
    ] satisfies DataTableColumnDef<TemplatesTableRow>[];
  }, [documentRootPath, team?.id, templateRootPath]);

  // const columns = createColumns();

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data: data?.data || [],
    columns,
    pageCount: data?.totalPages || 1,
    enableAdvancedFilter: true,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    defaultColumn: {
      columns,
      enableColumnFilter: false,
    },
    getRowId: (originalRow) => originalRow.id.toString(),
    shallow: false,
    clearOnDefault: true,
  });

  const results = data ?? {
    data: [],
    perPage: 10,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <>
      <DataTable<TemplatesTableRow>
        currentTeamMemberRole={team.currentTeamRole}
        // onRetry={onRetry}
        onNavegate={onNavegate}
        data={results.data}
        onMoveDocument={onMoveDocument}
        error={{
          enable: isLoadingError || false,
        }}
        skeleton={{
          enable: isLoading || false,
          rows: 5,
          component: (
            <DataTableSkeleton columnCount={columns.length} cellWidths={['0.5rem']} shrinkZero />
          ),
        }}
        table={table}
        actionBar={
          <TableActionBar
            table={table}
            onMultipleDownload={onMultipleDownload}
            loading={isLoading || false}
            currentTeamMemberRole={team?.currentTeamRole}
          />
        }
      >
        <DataTableAdvancedToolbar loading={false} table={table}>
          <DataTableSortList table={table} align="start" loading={false} />
          <DataTableFilterList
            loading={isLoading || false}
            table={table}
            shallow={shallow}
            debounceMs={debounceMs}
            throttleMs={throttleMs}
            align="start"
          />
        </DataTableAdvancedToolbar>
      </DataTable>
    </>
  );
};
