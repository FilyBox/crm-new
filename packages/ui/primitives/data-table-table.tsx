import * as React from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { TeamMemberRole } from '@prisma/client';
import { type Table as TanstackTable, flexRender } from '@tanstack/react-table';
import { Bird } from 'lucide-react';
import { Toaster } from 'sonner';
import { match } from 'ts-pattern';

import { useMediaQuery } from '../lib/use-media-query';
import { cn } from '../lib/utils';
import type { LpmData } from '../types/tables-types';
import { DataTableBodyComponent, MemoizedDataTableBody } from './data-table-body';
import { ExpandibleCard } from './expandable-card';
import { Skeleton } from './skeleton';
import { Table, TableHead, TableHeader, TableRow } from './table';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
  table: TanstackTable<TData>;
  actionBar?: React.ReactNode;
  data?: TData[];
  onEdit?: (data: TData) => void;
  onNavegate?: (data: TData) => void;
  onDelete?: (data: TData) => void;
  from?: string;
  onMoveDocument?: (data: TData) => void;
  onRetry?: (data: TData) => void;
  onClearFilters?: () => void;
  hasFilters?: boolean;
  isLoading: boolean;
  skeleton?: {
    enable: boolean;
    rows: number;
    component?: React.ReactNode;
  };
  error?: {
    enable: boolean;
    component?: React.ReactNode;
  };
  currentTeamMemberRole?: TeamMemberRole;
  expandibleCardHeightExpanded?: number;
  expandibleCardHeightCollapsed?: number;
  columnSizeVars?: { [key: string]: number };
}

export type DataTableChildren<TData> = (_table: TanstackTable<TData>) => React.ReactNode;

export type { ColumnDef as DataTableColumnDef } from '@tanstack/react-table';
type enhancedAssignees = {
  artistName: string | null;
  id: number;
};

export function DataTable<TData>({
  table,
  isLoading,
  actionBar,
  className,
  data,
  error,
  currentTeamMemberRole,
  from,
  onEdit,
  onRetry,
  onDelete,
  onNavegate,
  skeleton,
  onMoveDocument,
  expandibleCardHeightExpanded,
  expandibleCardHeightCollapsed,
  columnSizeVars,
  children,
  ...props
}: DataTableProps<TData>) {
  const dateColumnIds = [
    'releaseDate',
    'originalReleaseDate',
    'createdAt',
    'date',
    'preOrderDate',
    'lastProcessDate',
    'timedReleaseDate',
    'timedReleaseMusicServices',
    'importDate',
    'instantGratificationDate',
    'submittedAt',
    'lastModified',
    // 'startDate',
    // 'endDate',
  ];

  type enhancedArtists = {
    artistName: string | null;
    id: number;
  };

  type artists = {
    name: string;
    id: number;
  };

  type HasId = { id: number | string };
  type HasOptionalFields = {
    status?: string;
    title?: string;
    fileName?: string;
    productTitle?: string;
    total?: number;
    startDate?: Date;
    endDate?: Date;
    artists?: artists[];
    isPossibleToExpand?: string;
    possibleExtensionTime?: string;
    summary?: string;
    date?: Date;

    releasesArtists?: enhancedArtists[];
    isrcArtists?: enhancedArtists[];
    productDisplayArtist?: artists[];
    tuStreamsArtists?: enhancedAssignees[];
    lanzamiento?: string;
    typeOfRelease?: string;
    release?: string;
    uploaded?: string;
    streamingLink?: string;
    trackPlayLink?: string;
    type?: string;
    assets?: boolean;
    canvas?: boolean;
    cover?: boolean;
    audioWAV?: boolean;
    video?: boolean;
    banners?: boolean;
    pitch?: boolean;
    EPKUpdates?: boolean;
    trackName?: string;
    WebSiteUpdates?: boolean;
    Biography?: boolean;
    label?: string;
    userId?: number;
    teamId?: number;
    license?: string;
    duration?: string;
    isrc?: string;
    UPC?: string;
    isrcSong?: string;
    createdAt?: Date;
    updatedAt?: Date;
    publishedAt?: Date;
    submissionStatus?: string;
    agregadora?: { name: string } | null;
    recordLabel?: { name: string } | null;
    videoLinks?: Array<{
      name: string;
      id: number;
      url: string;
      publishedAt?: Date | null;
      lyrics?: string | null;
    }>;
    generalLinks?: Array<{
      name: string;
      id: number;
      url: string;
      publishedAt?: Date | null;
      lyrics?: string | null;
    }>;
  };
  const { i18n } = useLingui();
  const currentLanguage = i18n.locale;
  const isDesktop = useMediaQuery('(min-width: 640px)');
  const prepareCardData = (row: TData, index: number) => {
    const typedRow = row as HasId & HasOptionalFields;
    const tableRow = table.getRowModel().rows[index];

    const lpmData = row as LpmData;
    const statusElements = [
      typedRow.status || typedRow.type || typedRow.duration,
      typedRow.license || typedRow.typeOfRelease,
      typedRow.release,
      typedRow.label,

      typedRow.submissionStatus,
    ].filter((item): item is string => item !== undefined);

    const title: string | undefined =
      typedRow.title || typedRow.lanzamiento || typedRow.productTitle || typedRow.trackName;
    // Prepare contributors/artists data
    let contributors: { name: string }[] = [];
    if (typedRow.artists) {
      if (Array.isArray(typedRow.artists)) {
        contributors = typedRow.artists.map((artist) => ({
          name: artist.name || 'Unknown',
        }));
      } else {
        //separar por comas y mapear
        const artistsArray = (typedRow.artists as unknown as string)
          .split(',')
          .map((name) => name.trim());
        contributors = artistsArray.map((name) => ({
          name: name || 'Unknown',
        }));
      }
    } else if (typedRow.releasesArtists) {
      contributors = typedRow.releasesArtists.map((artist: enhancedArtists) => ({
        name: artist.artistName || 'Unknown',
      }));
    } else if (typedRow.isrcArtists) {
      contributors = typedRow.isrcArtists.map((artist: enhancedArtists) => ({
        name: artist.artistName || 'Unknown',
      }));
    } else if (typedRow.tuStreamsArtists) {
      contributors = typedRow.tuStreamsArtists.map((artist: enhancedArtists) => ({
        name: artist.artistName || 'Unknown',
      }));
    }

    return {
      status: statusElements,
      title: title || 'Untitled',
      fileName: typedRow.fileName,
      startDate: typedRow.publishedAt || typedRow.startDate || typedRow.date || null,
      endDate: typedRow.endDate,
      contributors,
      expandible: typedRow.isPossibleToExpand || '',
      extensionTime: typedRow.possibleExtensionTime || '',
      summary: typedRow.summary || '',
      link: typedRow.streamingLink || '' || typedRow.trackPlayLink || '',
      githubStars: 128,
      openIssues: 5,
      LpmData: lpmData,
      isrc: typedRow.isrc || typedRow.isrcSong || '',
      UPC: typedRow.UPC || '',
      assets: Boolean(typedRow.assets),
      canvas: Boolean(typedRow.canvas),
      cover: Boolean(typedRow.cover),
      audioWAV: Boolean(typedRow.audioWAV),
      video: Boolean(typedRow.video),
      banners: Boolean(typedRow.banners),
      pitch: Boolean(typedRow.pitch),
      EPKUpdates: Boolean(typedRow.EPKUpdates),
      WebSiteUpdates: Boolean(typedRow.WebSiteUpdates),
      Biography: Boolean(typedRow.Biography),
      total: typedRow.total || 0,
      from: from || '',
      isSelected: tableRow?.getIsSelected() || false,
      agregadora: typedRow.agregadora || null,
      recordLabel: typedRow.recordLabel || null,
      videoLinks: typedRow.videoLinks,
      generalLinks: typedRow.generalLinks,
      onSelectChange: (selected: boolean) => tableRow?.toggleSelected(selected),
    };
  };

  const canEditDelete = match(currentTeamMemberRole)
    .with(TeamMemberRole.ADMIN, () => true)
    .with(TeamMemberRole.MANAGER, () => true)
    .with(TeamMemberRole.MEMBER, () => false)
    .otherwise(() => true);

  const isResizing = table.getState().columnSizingInfo.isResizingColumn;

  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div
      className={cn(
        'mb-32 flex w-full flex-col gap-2.5 overflow-auto rounded-lg p-2 sm:border-2',
        className,
      )}
      {...props}
    >
      {children}
      <div className="overflow-hidden rounded-md">
        <Toaster theme="system" richColors className="mb-16" />
        <Table
          overflowHidden={skeleton?.enable || !isDesktop}
          className="scrollbar-hide min-w-full"
          style={{
            ...columnSizeVars,
            width: table.getTotalSize(),
            tableLayout: 'fixed',
          }}
        >
          {/* <ScrollArea className="w-full max-w-screen-xl whitespace-nowrap rounded-md border"> */}
          <TableHeader
            className={`scrollbar-hide ${isDesktop === false ? 'max-w-full overflow-hidden' : ''}`}
          >
            {isDesktop
              ? table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          style={{
                            width: `calc(var(--header-${header.id}-size) * 1px)`,
                            position: 'relative',
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanResize() && (
                            <div
                              onDoubleClick={() => header.column.resetSize()}
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={cn(
                                'resize-handle',
                                header.column.getIsResizing() && 'is-resizing',
                              )}
                            />
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))
              : table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.slice(0, 1).map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
          </TableHeader>
          {isDesktop ? (
            isResizing ? (
              <MemoizedDataTableBody
                isLoading={isLoading}
                table={table}
                data={data}
                skeleton={skeleton}
                canEditDelete={canEditDelete}
                onEdit={onEdit}
                onDelete={onDelete}
                onNavegate={onNavegate}
                onRetry={onRetry}
                onMoveDocument={onMoveDocument}
              />
            ) : (
              <DataTableBodyComponent
                table={table}
                data={data}
                isLoading={isLoading}
                skeleton={skeleton}
                onEdit={onEdit}
                canEditDelete={canEditDelete}
                onDelete={onDelete}
                onNavegate={onNavegate}
                onRetry={onRetry}
                onMoveDocument={onMoveDocument}
              />
            )
          ) : (
            <></>
          )}
          {/* <ScrollBar orientation="horizontal" />
            </ScrollArea> */}
        </Table>

        {!isDesktop && (
          <div className="mb-10 flex w-full flex-col gap-5">
            {skeleton?.enable ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-64 w-full" />
                {/* <Skeleton className="h-56 w-full" />
                <Skeleton className="h-56 w-full" /> */}
              </div>
            ) : (data && data.length) > 0 ? (
              data.map((row, index) => {
                return (
                  <ExpandibleCard
                    key={index}
                    expandibleCardHeightExpanded={expandibleCardHeightExpanded}
                    expandibleCardHeightCollapsed={expandibleCardHeightCollapsed}
                    {...prepareCardData(row, index)}
                    {...(onNavegate && { onNavegate: () => onNavegate(row) })}
                    {...(onEdit && { onEdit: () => onEdit(row) })}
                    {...(onDelete && { onDelete: () => onDelete(row) })}
                  />
                );
              })
            ) : (
              <></>
            )}
          </div>
        )}
      </div>

      {table.getRowModel().rows?.length < 1 && skeleton?.enable === false ? (
        <div
          className="text-muted-foreground/60 flex h-60 flex-col items-center justify-center gap-y-4"
          data-testid="empty-document-state"
        >
          <Bird className="h-12 w-12" strokeWidth={1.5} />

          <div className="text-center">
            <Trans>No data found</Trans>
          </div>
        </div>
      ) : (
        error?.enable && (
          <div
            className="text-muted-foreground/60 flex h-60 flex-col items-center justify-center gap-y-4"
            data-testid="empty-document-state"
          >
            <Bird className="h-12 w-12" strokeWidth={1.5} />

            <div className="text-center">
              <p className="mt-2 max-w-[60ch]">
                <Trans>Something went wrong</Trans>
              </p>
            </div>
          </div>
        )
      )}

      {actionBar && actionBar}

      {/* <div className="flex flex-col gap-2.5">
        <DataTablePagination loading={skeleton?.enable || false} table={table} />
      </div> */}
    </div>
  );
}
