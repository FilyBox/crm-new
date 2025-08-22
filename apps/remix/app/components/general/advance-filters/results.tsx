import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

import { StackAvatarsArtistWithTooltip } from '@documenso/ui/components/lpm/stack-avatars-artist-with-tooltip';
import type { Config, Result, ResultsObject, Unicorn } from '@documenso/ui/lib/types';
import { useMediaQuery } from '@documenso/ui/lib/use-media-query';
import { ExpandibleCard } from '@documenso/ui/primitives/expandable-card';
import { Skeleton } from '@documenso/ui/primitives/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@documenso/ui/primitives/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@documenso/ui/primitives/tabs';
import type { LpmData } from '@documenso/ui/types/tables-types';

import { DynamicChart } from './dynamic-chart';
import { SkeletonCard } from './skeleton-card';

type enhancedArtists = {
  artistName: string | null;
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
  artists?: string;
  isPossibleToExpand?: string;
  possibleExtensionTime?: string;
  summary?: string;
  date?: Date;

  releasesArtists?: enhancedArtists[];
  isrcArtists?: enhancedArtists[];
  productDisplayArtist?: enhancedArtists[];
  tuStreamsArtists?: enhancedArtists[];
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
  UPC?: string;
  userId?: number;
  teamId?: number;
  license?: string;
  duration?: string;
  isrc?: string;
  createdAt?: Date;
  updatedAt?: Date;
  submissionStatus?: string;
};

export const Results = ({
  results,
  columns,
  chartConfig,
  isLoading = false,
  data,
  from,
}: {
  results: Result[] | ResultsObject[];
  columns: string[];
  isLoading?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  from?: string;
  chartConfig: Config | null;
}) => {
  const isDesktop = useMediaQuery('(min-width: 640px)');

  const formatColumnTitle = (title: string) => {
    return title
      .split('_')
      .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
      .join(' ');
  };

  const formatCellValue = (column: string, value: unknown) => {
    if (column.toLowerCase().includes('valuation')) {
      const parsedValue = parseFloat(value as string);
      if (isNaN(parsedValue)) {
        return '';
      }
      const formattedValue = parsedValue.toFixed(2);
      const trimmedValue = formattedValue.replace(/\.?0+$/, '');
      return `$${trimmedValue}B`;
    }
    if (column.toLowerCase().includes('rate')) {
      const parsedValue = parseFloat(value as string);
      if (isNaN(parsedValue)) {
        return '';
      }
      const percentage = (parsedValue * 100).toFixed(2);
      return `${percentage}%`;
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    return String(value);
  };

  const prepareCardData = (row: HasId & HasOptionalFields) => {
    const typedRow = row;

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
      contributors = typedRow.artists.split(',').map((name) => ({ name: name.trim() }));
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
      startDate: typedRow.startDate || typedRow.date || null,
      endDate: typedRow.endDate,
      contributors,
      expandible: typedRow.isPossibleToExpand || '',
      extensionTime: typedRow.possibleExtensionTime || '',
      summary: typedRow.summary || '',
      link: typedRow.streamingLink || '' || typedRow.trackPlayLink || '',
      githubStars: 128,
      openIssues: 5,
      LpmData: lpmData,
      isrc: typedRow.isrc || typedRow.UPC || '',
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
    };
  };

  return (
    <div className="flex flex-grow flex-col">
      <Tabs defaultValue="table" className="flex w-full flex-grow flex-col">
        <TabsList className="flex h-fit flex-col">
          <TabsTrigger className="w-full" value="table">
            Table
          </TabsTrigger>
          <TabsTrigger
            className="w-full"
            value="charts"
            disabled={Object.keys(results[0] || {}).length <= 1 || results.length < 2}
          >
            Chart
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="flex flex-grow">
          <div className="relative w-full sm:min-h-[10px]">
            {isDesktop ? (
              <Table className="divide-border min-w-full divide-y">
                <TableHeader className="bg-secondary sticky top-0 shadow-sm">
                  <TableRow>
                    {columns.map((column, index) => (
                      <TableHead
                        key={index}
                        className="text-muted-foreground px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      >
                        {column === 'tuStreamsArtists' ? (
                          <span className="flex items-center">{formatColumnTitle('Artistas')}</span>
                        ) : (
                          formatColumnTitle(column)
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-card divide-border divide-y">
                  {results.map((company, index) => (
                    <TableRow key={index} className="hover:bg-muted">
                      {columns.map((column, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          className="text-foreground whitespace-nowrap px-6 py-4 text-sm"
                        >
                          {column === 'tuStreamsArtists' ? (
                            <StackAvatarsArtistWithTooltip
                              enhancedAssignees={
                                company[column as keyof Unicorn] as enhancedArtists[]
                              }
                            />
                          ) : column === 'createdAt' ? (
                            `${format(company[column as keyof Unicorn] as Date, 'd MMM yyyy', { locale: es })}`
                          ) : (
                            formatCellValue(column, company[column as keyof Unicorn])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col gap-5">
                {isLoading ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-64 w-full" />
                    {/* <Skeleton className="h-56 w-full" />
                                         <Skeleton className="h-56 w-full" /> */}
                  </div>
                ) : (data && data.length) > 0 ? (
                  data.map((row: HasId & HasOptionalFields, index: number) => {
                    return (
                      <ExpandibleCard
                        key={index}
                        {...prepareCardData(row)}
                        // {...(onNavegate && { onNavegate: () => onNavegate(row) })}
                        // {...(onEdit && { onEdit: () => onEdit(row) })}
                        // {...(onDelete && { onDelete: () => onDelete(row) })}
                      />
                    );
                  })
                ) : (
                  <></>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="charts" className="flex-grow overflow-auto">
          <div className="mt-4">
            {chartConfig && results.length > 0 ? (
              <DynamicChart chartData={results} chartConfig={chartConfig} />
            ) : (
              <SkeletonCard />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
