import { useMemo } from 'react';

import { useSearchParams } from 'react-router';
import { z } from 'zod';

import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { ZFindEventInternalRequestSchema } from '@documenso/trpc/server/events-router/schema';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import ErrorPage from '@documenso/ui/primitives/errorPage';

import { useCalendarContext } from '~/components/general/event-calendar/calendar-context';
import { EventCalendar } from '~/components/general/event-calendar/event-calendar';
import type { CalendarEvent, EventColor } from '~/components/general/event-calendar/types';
// import { EventsFilters } from '~/components/tables/events-filters';
import { useCalendarEvents } from '~/hooks/use-calendar-events';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export function meta() {
  return appMetaTags('Events');
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

const ZSearchParamsSchema = ZFindEventInternalRequestSchema.pick({
  period: true,
  page: true,
  perPage: true,
  query: true,
}).extend({
  artistIds: z.string().transform(parseToIntegerArray).optional().catch([]),
});

const colorOptions: Array<{
  id: string;
  value: EventColor;
  label: string;
  isActive: boolean;
  bgClass: string;
  borderClass: string;
}> = [
  {
    id: 'blue',
    value: 'blue',
    label: 'Blue',
    isActive: true,
    bgClass: 'bg-blue-400 data-[state=checked]:bg-blue-400',
    borderClass: 'border-blue-400 data-[state=checked]:border-blue-400',
  },
  {
    id: 'violet',
    value: 'violet',
    label: 'Violet',
    isActive: true,
    bgClass: 'bg-violet-400 data-[state=checked]:bg-violet-400',
    borderClass: 'border-violet-400 data-[state=checked]:border-violet-400',
  },
  {
    id: 'rose',
    value: 'rose',
    label: 'Rose',
    isActive: true,
    bgClass: 'bg-rose-400 data-[state=checked]:bg-rose-400',
    borderClass: 'border-rose-400 data-[state=checked]:border-rose-400',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    value: 'emerald',
    isActive: true,
    bgClass: 'bg-emerald-400 data-[state=checked]:bg-emerald-400',
    borderClass: 'border-emerald-400 data-[state=checked]:border-emerald-400',
  },
  {
    id: 'orange',
    label: 'Orange',
    value: 'orange',
    isActive: true,
    bgClass: 'bg-orange-400 data-[state=checked]:bg-orange-400',
    borderClass: 'border-orange-400 data-[state=checked]:border-orange-400',
  },
  {
    id: 'sky',
    label: 'Sky',
    value: 'sky',
    isActive: true,
    bgClass: 'bg-sky-400 data-[state=checked]:bg-sky-400',
    borderClass: 'border-sky-400 data-[state=checked]:border-sky-400',
  },
];

export default function EventsPage() {
  const { isColorVisible, toggleColorVisibility } = useCalendarContext();
  const [searchParams] = useSearchParams();

  const { filters, query, joinOperator, columnOrder, columnDirection } = useSortParams({
    sortColumns,
  });

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );

  const { events, isLoading, error, isCreating, isUpdating, isDeleting } = useCalendarEvents({
    query: query,
    artistIds: findDocumentSearchParams.artistIds,
    orderByColumn: columnOrder,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: filters,
    joinOperator: joinOperator,
  });

  const visibleEvents = useMemo(() => {
    return events.filter((event: CalendarEvent) => isColorVisible(event.color || 'blue'));
  }, [events, isColorVisible]);
  if (error) {
    return <ErrorPage error={error.message} />;
  }

  return (
    <div className="mx-auto max-w-screen-xl gap-y-8 px-4 md:px-8">
      <div className="relative">
        {(isLoading || isCreating || isUpdating || isDeleting) && (
          <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center">
            {/* <div className="flex items-center gap-2">
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-muted-foreground z-20 text-sm">
                {isLoading && t`Loading events...`}
                {isCreating && t`Creating event...`}
                {isUpdating && t`Updating event...`}
                {isDeleting && t`Deleting event...`}
              </span>
            </div> */}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          {colorOptions.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <Checkbox
                id={item.id}
                checked={isColorVisible(item.value)}
                onCheckedChange={() => toggleColorVisibility(item.value)}
              />
              <label
                htmlFor={item.id}
                className={`flex cursor-pointer items-center gap-2 text-sm font-medium ${
                  !isColorVisible(item.value) ? 'text-muted-foreground line-through' : ''
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 rounded-full ${item.bgClass} ${item.borderClass}`}
                />
                {item.label}
              </label>
            </div>
          ))}
        </div>
        {/* <EventsFilters isLoading={isLoading} /> */}

        <EventCalendar isLoading={isLoading} events={visibleEvents} initialView="list" />
      </div>
    </div>
  );
}
