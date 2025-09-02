import { useMemo } from 'react';

import { type CalendarEvent, EventCalendar } from './event-calendar';
import { useCalendarContext } from './event-calendar/calendar-context';

interface CalendarEventsHook {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  handleEventAdd: (event: CalendarEvent) => Promise<void>;
  handleEventUpdate: (event: CalendarEvent) => Promise<void>;
  handleEventDelete: (eventId: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

interface DatabaseCalendarProps {
  useCalendarEvents: () => CalendarEventsHook;
}

// Etiquettes data for calendar filtering - matching database colors
export const etiquettes = [
  {
    id: 'my-events',
    name: 'My Events',
    color: 'emerald' as const,
    isActive: true,
  },
  {
    id: 'marketing-team',
    name: 'Marketing Team',
    color: 'orange' as const,
    isActive: true,
  },
  {
    id: 'interviews',
    name: 'Interviews',
    color: 'violet' as const,
    isActive: true,
  },
  {
    id: 'events-planning',
    name: 'Events Planning',
    color: 'blue' as const,
    isActive: true,
  },
  {
    id: 'holidays',
    name: 'Holidays',
    color: 'rose' as const,
    isActive: true,
  },
];

export default function DatabaseCalendar({ useCalendarEvents }: DatabaseCalendarProps) {
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
  } = useCalendarEvents();

  const { isColorVisible } = useCalendarContext();

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

  const onEventDelete = async (eventId: string) => {
    try {
      await handleEventDelete(eventId);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  if (error) {
    return (
      <div className="text-destructive flex min-h-[400px] items-center justify-center">
        Error loading events: {error.message}
      </div>
    );
  }

  return (
    <div className="relative">
      {(isLoading || isCreating || isUpdating || isDeleting) && (
        <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <span className="text-muted-foreground text-sm">
              {isLoading && 'Loading events...'}
              {isCreating && 'Creating event...'}
              {isUpdating && 'Updating event...'}
              {isDeleting && 'Deleting event...'}
            </span>
          </div>
        </div>
      )}

      <EventCalendar
        events={visibleEvents}
        onEventAdd={onEventAdd}
        onEventUpdate={onEventUpdate}
        onEventDelete={onEventDelete}
        initialView="week"
      />
    </div>
  );
}
