import { useMemo } from 'react';

import { CheckCircle, X } from 'lucide-react';

import { Checkbox } from '@documenso/ui/primitives/checkbox';
import ErrorPage from '@documenso/ui/primitives/errorPage';
import { type CalendarEvent, EventCalendar } from '@documenso/ui/primitives/event-calendar';
import { useCalendarContext } from '@documenso/ui/primitives/event-calendar/calendar-context';

import { useCalendarEvents } from '~/hooks/use-calendar-events';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Task');
}

// Etiquettes data for calendar filtering
const etiquettes = [
  {
    id: 'my-events',
    name: 'Emerald',
    color: 'emerald' as const,
    isActive: true,
  },
  {
    id: 'marketing-team',
    name: 'Orange',
    color: 'orange' as const,
    isActive: true,
  },
  {
    id: 'interviews',
    name: 'Violet',
    color: 'violet' as const,
    isActive: true,
  },
  {
    id: 'events-planning',
    name: 'Blue',
    color: 'blue' as const,
    isActive: true,
  },
  {
    id: 'holidays',
    name: 'Rose',
    color: 'rose' as const,
    isActive: true,
  },
];

export default function TasksPage() {
  const { isColorVisible, toggleColorVisibility } = useCalendarContext();

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
    return <ErrorPage error={error.message} />;
  }

  return (
    <div className="mx-auto max-w-screen-xl gap-y-8 px-4 md:px-8">
      {/* Etiquettes Filter */}
      <div className="mb-6 flex flex-wrap gap-3">
        {etiquettes.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <Checkbox
              id={item.id}
              checked={isColorVisible(item.color)}
              onCheckedChange={() => toggleColorVisibility(item.color)}
            />
            <label
              htmlFor={item.id}
              className={`flex cursor-pointer items-center gap-2 text-sm font-medium ${
                !isColorVisible(item.color) ? 'text-muted-foreground line-through' : ''
              }`}
            >
              <span
                className="size-3 rounded-full"
                style={{
                  backgroundColor: `var(--color-${item.color}-400)`,
                }}
              />
              {item.name}
              {isColorVisible(item.color) ? (
                <CheckCircle className="size-4 text-green-500" />
              ) : (
                <X className="text-muted-foreground size-4" />
              )}
            </label>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="relative">
        {(isLoading || isCreating || isUpdating || isDeleting) && (
          <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-muted-foreground z-20 text-sm">
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
    </div>
  );
}
