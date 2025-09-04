import { useMemo } from 'react';

import { queryOptions } from '@tanstack/react-query';

import { trpc } from '@documenso/trpc/react';
import type { FilterStructure } from '@documenso/ui/lib/filter-columns';

import type { CalendarEvent, EventColor } from '~/components/general/event-calendar/types';
import { useCurrentTeam } from '~/providers/team';

export interface DatabaseEvent {
  id: number;
  name: string;
  description?: string | null;
  beginning: Date;
  end: Date;
  venue?: string | null;
  color?: EventColor | null;
  allDay?: boolean;
  image?: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  artists: Array<{
    id: number;
    name: string;
  }>;
}

export const useCalendarEvents = ({
  query,
  orderByColumn,
  orderByDirection,
  filterStructure,
  joinOperator,
  artistIds,
}: {
  query?: string | undefined;
  orderByColumn?: 'id' | undefined;
  orderByDirection?: 'asc' | 'desc' | undefined;
  period?: '7d' | '14d' | '30d' | undefined;
  filterStructure?: (FilterStructure | null | undefined)[] | undefined;
  joinOperator?: 'and' | 'or' | undefined;
  artistIds?: number[] | undefined;
}) => {
  const utils = trpc.useUtils();

  const team = useCurrentTeam();
  const {
    data: eventsData,
    isLoading,
    error,
  } = trpc.events.getAllEventsNoPagination.useQuery(
    {
      orderByColumn,
      orderByDirection,
      filterStructure,
      joinOperator,
      artistIds,
    },
    queryOptions({
      queryKey: ['events', team.id, query, artistIds, filterStructure, joinOperator],
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }),
  );

  // Create event mutation
  const createEventMutation = trpc.events.createEvent.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsNoPagination.invalidate();
    },
  });

  // Update event mutation
  const updateEventMutation = trpc.events.updateEventById.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsNoPagination.invalidate();
    },
  });

  // Delete event mutation
  const deleteEventMutation = trpc.events.deleteEventById.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsNoPagination.invalidate();
    },
  });

  // Convert database events to calendar events
  const calendarEvents = useMemo(() => {
    if (!eventsData?.events) return [];

    return eventsData.events.map(
      (event): CalendarEvent => ({
        id: event.id.toString(),
        name: event.name,
        description: event.description,
        beginning: event.beginning,
        end: event.end,
        venue: event.venue,
        color: event.color,
        allDay: event.allDay,
        published: event.published,
      }),
    );
  }, [eventsData?.events]);

  const handleEventAdd = async (event: CalendarEvent) => {
    await createEventMutation.mutateAsync({
      name: event.name,
      description: event.description ?? undefined,
      beginning: event.beginning,
      end: event.end,
      venue: event.venue ?? undefined,
      allDay: event.allDay,
      color: event.color ?? undefined,
      published: event.published,
    });
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    const id = parseInt(event.id);
    if (isNaN(id)) return;

    await updateEventMutation.mutateAsync({
      id,
      name: event.name,
      description: event.description ?? undefined,
      beginning: event.beginning,
      end: event.end,
      venue: event.venue ?? undefined,
      allDay: event.allDay,
      color: event.color ?? undefined,
      published: event.published,
      image: typeof event.image === 'string' ? event.image : undefined,
    });
  };

  const handleEventDelete = async (eventId: string) => {
    const id = parseInt(eventId);
    if (isNaN(id)) return;

    await deleteEventMutation.mutateAsync({ id });
  };

  return {
    events: calendarEvents,
    isLoading,
    error,
    handleEventAdd,
    handleEventUpdate,
    handleEventDelete,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
};
