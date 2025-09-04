import { useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { ZFindEventInternalRequestSchema } from '@documenso/trpc/server/events-router/schema';
import ErrorPage from '@documenso/ui/primitives/errorPage';

import { useCalendarContext } from '~/components/general/event-calendar/calendar-context';
import { EventCalendar } from '~/components/general/event-calendar/event-calendar';
import type { CalendarEvent } from '~/components/general/event-calendar/types';
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

export default function EventsPage() {
  const { isColorVisible, toggleColorVisibility } = useCalendarContext();
  const [searchParams] = useSearchParams();
  const { t } = useLingui();

  const { filters, applyFilters, query, joinOperator, columnOrder, columnDirection } =
    useSortParams({ sortColumns });

  const findDocumentSearchParams = useMemo(
    () => ZSearchParamsSchema.safeParse(Object.fromEntries(searchParams.entries())).data || {},
    [searchParams],
  );

  const {
    events,
    isLoading,
    error,
    handleEventAdd,
    handleEventUpdate,
    handleEventDelete,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCalendarEvents({
    query: query,
    artistIds: findDocumentSearchParams.artistIds,
    orderByColumn: columnOrder,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: applyFilters ? filters : [],
    joinOperator: joinOperator,
  });

  const visibleEvents = useMemo(() => {
    return events.filter((event: CalendarEvent) => isColorVisible(event.color || 'blue'));
  }, [events, isColorVisible]);

  const onEventAdd = async (event: CalendarEvent) => {
    try {
      await handleEventAdd(event);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const onEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      await handleEventUpdate(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const onEventDelete = (eventId: string) => {
    try {
      toast.promise(handleEventDelete(eventId), {
        loading: t`Deleting event...`,
        success: t`Event deleted successfully`,
        error: t`Error deleting event`,
        position: 'bottom-center',
        className: 'z-9999 pointer-events-auto',
      });
      // await handleEventDelete(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

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

        <EventCalendar
          isLoading={isLoading}
          events={visibleEvents}
          onEventAdd={onEventAdd}
          onEventUpdate={onEventUpdate}
          onEventDelete={onEventDelete}
          initialView="list"
        />
      </div>
    </div>
  );
}
