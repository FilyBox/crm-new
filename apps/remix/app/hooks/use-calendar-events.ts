import { useMemo } from 'react';

import { trpc } from '@documenso/trpc/react';
import { type CalendarEvent, type EventColor } from '@documenso/ui/primitives/event-calendar';

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

// Helper function to map database event to CalendarEvent
export const mapDatabaseEventToCalendarEvent = (dbEvent: DatabaseEvent): CalendarEvent => {
  return {
    id: dbEvent.id.toString(),
    title: dbEvent.name,
    description: dbEvent.description || undefined,
    start: new Date(dbEvent.beginning),
    end: new Date(dbEvent.end),
    allDay: dbEvent.allDay || false,
    color: dbEvent.color || 'blue',
    location: dbEvent.venue || undefined,
  };
};

// Helper function to map CalendarEvent to database event format
export const mapCalendarEventToDatabaseEvent = (calendarEvent: CalendarEvent) => {
  return {
    id: calendarEvent.id ? parseInt(calendarEvent.id) : undefined,
    name: calendarEvent.title,
    description: calendarEvent.description || null,
    beginning: calendarEvent.start,
    end: calendarEvent.end,
    venue: calendarEvent.location || null,
    color: calendarEvent.color || 'blue',
    allDay: calendarEvent.allDay || false,
  };
};

export const useCalendarEvents = () => {
  const utils = trpc.useUtils();

  // Fetch events from the database
  const {
    data: eventsData,
    isLoading,
    error,
  } = trpc.events.getAllEventsWithPagination.useQuery({
    page: 1,
    limit: 500, // Get more events for calendar view
  });

  // Create event mutation
  const createEventMutation = trpc.events.createEvent.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsWithPagination.invalidate();
    },
  });

  // Update event mutation
  const updateEventMutation = trpc.events.updateEventById.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsWithPagination.invalidate();
    },
  });

  // Delete event mutation
  const deleteEventMutation = trpc.events.deleteEventById.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsWithPagination.invalidate();
    },
  });

  // Convert database events to calendar events
  const calendarEvents = useMemo(() => {
    if (!eventsData?.events) return [];

    return eventsData.events.map((event) =>
      mapDatabaseEventToCalendarEvent({
        id: event.id,
        name: event.name,
        description: event.description,
        beginning: event.beginning,
        end: event.end,
        venue: event.venue,
        color: event.color,
        allDay: event.allDay,
        image: event.image,
        published: event.published,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        deletedAt: event.deletedAt,
        artists: event.artists,
      }),
    );
  }, [eventsData?.events]);

  const handleEventAdd = async (event: CalendarEvent) => {
    const dbEvent = mapCalendarEventToDatabaseEvent(event);
    await createEventMutation.mutateAsync({
      name: dbEvent.name,
      description: dbEvent.description ?? undefined,
      beginning: dbEvent.beginning,
      end: dbEvent.end,
      venue: dbEvent.venue ?? undefined,
      allDay: dbEvent.allDay,
      color: dbEvent.color,
    });
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    const dbEvent = mapCalendarEventToDatabaseEvent(event);
    if (!dbEvent.id) return;

    await updateEventMutation.mutateAsync({
      id: dbEvent.id,
      name: dbEvent.name,
      description: dbEvent.description ?? undefined,
      beginning: dbEvent.beginning,
      end: dbEvent.end,
      venue: dbEvent.venue ?? undefined,
      allDay: dbEvent.allDay,
      color: dbEvent.color,
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
