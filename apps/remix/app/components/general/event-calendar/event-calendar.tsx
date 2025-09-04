import { useEffect, useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { addDays, addMonths, addWeeks, subMonths, subWeeks } from 'date-fns';
import {
  Bird,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2,
  LoaderIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';

import { useCalendarEvents } from '~/hooks/use-calendar-events';

import { AgendaView } from './agenda-view';
import { useCalendarContext } from './calendar-context';
import { CalendarDndProvider } from './calendar-dnd-context';
import { AgendaDaysToShow, EventGap, EventHeight, WeekCellsHeight } from './constants';
import { DayView } from './day-view';
import EventCard from './event-card';
import { EventDialog } from './event-dialog';
import { EventsFilters } from './events-filters';
import { MonthView } from './month-view';
import SidebarCalendar from './sidebar-calendar';
import type { CalendarEvent, CalendarView } from './types';
import { addHoursToDate } from './utils';
import { WeekView } from './week-view';

export interface EventCalendarProps {
  events?: CalendarEvent[];
  className?: string;
  initialView?: CalendarView;
  isLoading: boolean;
}

export function EventCalendar({
  events = [],
  className,
  isLoading = false,
  initialView = 'list',
}: EventCalendarProps) {
  // Use the shared calendar context instead of local state
  const { currentDate, setCurrentDate } = useCalendarContext();
  const [view, setView] = useState<CalendarView>(initialView);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { handleEventAdd, handleEventUpdate, handleEventDelete, artists } = useCalendarEvents({});
  const { t } = useLingui();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea or contentEditable element
      // or if the event dialog is open
      if (
        isEventDialogOpen ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          setView('month');
          break;
        case 'w':
          setView('week');
          break;
        case 'd':
          setView('day');
          break;
        case 'a':
          setView('agenda');
          break;
        case 'l':
          setView('list');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEventDialogOpen]);

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else if (view === 'agenda') {
      // For agenda view, go back 30 days (a full month)
      setCurrentDate(addDays(currentDate, -AgendaDaysToShow));
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === 'agenda') {
      // For agenda view, go forward 30 days (a full month)
      setCurrentDate(addDays(currentDate, AgendaDaysToShow));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventSelect = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleEventCreate = (startTime: Date) => {
    // Snap to 15-minute intervals
    const minutes = startTime.getMinutes();
    const remainder = minutes % 15;
    if (remainder !== 0) {
      if (remainder < 7.5) {
        // Round down to nearest 15 min
        startTime.setMinutes(minutes - remainder);
      } else {
        // Round up to nearest 15 min
        startTime.setMinutes(minutes + (15 - remainder));
      }
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }

    const newEvent: CalendarEvent = {
      id: '',
      name: '',
      beginning: startTime,
      end: addHoursToDate(startTime, 1),
      allDay: false,
      color: 'blue',
      description: '',
      venue: '',
      published: false,
    };
    setSelectedEvent(newEvent);
    setIsEventDialogOpen(true);
  };

  const handleEventSave = (event: CalendarEvent) => {
    if (event.id) {
      toast.promise(handleEventUpdate(event), {
        loading: t`Updating event "${event.name}"...`,
        success: t`Event "${event.name}" updated`,
        error: t`Error updating event "${event.name}"`,
        position: 'bottom-center',
      });
    } else {
      toast.promise(handleEventAdd(event), {
        loading: t`Creating event "${event.name}"...`,
        success: t`Event "${event.name}" created`,
        error: t`Error creating event "${event.name}"`,
        position: 'bottom-center',
      });
    }
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const eventDelete = (eventId: string) => {
    toast.promise(handleEventDelete(eventId), {
      loading: t`Deleting event...`,
      success: t`Event deleted successfully`,
      error: t`Error deleting event`,
      position: 'bottom-center',
    });
    // onEventDelete?.(eventId);
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const eventUpdate = (updatedEvent: CalendarEvent) => {
    toast.promise(handleEventUpdate(updatedEvent), {
      loading: t`Updating event "${updatedEvent.name}"...`,
      success: t`Event "${updatedEvent.name}" updated`,
      error: t`Error updating event "${updatedEvent.name}"`,
      position: 'bottom-center',
    });
  };

  return (
    <div
      className="has-data-[slot=month-view]:flex-1 flex flex-col rounded-lg"
      style={
        {
          '--event-height': `${EventHeight}px`,
          '--event-gap': `${EventGap}px`,
          '--week-cells-height': `${WeekCellsHeight}px`,
        } as React.CSSProperties
      }
    >
      <CalendarDndProvider onEventUpdate={eventUpdate}>
        <div
          className={cn(
            'flex flex-col justify-between gap-2 py-5 sm:flex-row sm:items-center',
            className,
          )}
        >
          <div className="flex items-center justify-start gap-2">
            <SidebarCalendar />
            <EventsFilters isLoading={isLoading} />
            {isLoading && <LoaderIcon className="text-primary animate-spin" />}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center max-sm:order-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="max-sm:size-8"
                  onClick={handlePrevious}
                  aria-label="Previous"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="max-sm:size-8"
                  onClick={handleNext}
                  aria-label="Next"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </div>
              <Button className="max-sm:px-2.5! max-sm:h-8" onClick={handleToday}>
                <Trans>Today</Trans>
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                className="max-sm:px-2.5! max-sm:h-8"
                onClick={() => {
                  setSelectedEvent(null); // Ensure we're creating a new event
                  setIsEventDialogOpen(true);
                }}
              >
                <Trans>New Event</Trans>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="max-sm:px-2! gap-1.5 max-sm:h-8 max-sm:gap-1"
                  >
                    <span className="capitalize">{view}</span>
                    <ChevronDownIcon className="-me-1 opacity-60" size={16} aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-32">
                  <DropdownMenuItem onClick={() => setView('month')}>
                    <Trans>Month</Trans> <DropdownMenuShortcut>M</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('week')}>
                    <Trans>Week</Trans> <DropdownMenuShortcut>W</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('day')}>
                    <Trans>Day</Trans> <DropdownMenuShortcut>D</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('agenda')}>
                    <Trans>Agenda</Trans> <DropdownMenuShortcut>A</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setView('list')}>
                    <Trans>List</Trans> <DropdownMenuShortcut>L</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
              onEventCreate={handleEventCreate}
            />
          )}
          {view === 'agenda' && (
            <AgendaView
              currentDate={currentDate}
              events={events}
              onEventSelect={handleEventSelect}
            />
          )}

          {view === 'list' && (
            <div className="mb-8">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                </div>
              ) : events && events.length === 0 ? (
                <div className="text-muted-foreground/60 flex h-96 flex-col items-center justify-center gap-y-4">
                  <Bird className="h-12 w-12" strokeWidth={1.5} />

                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      <Trans>No hay eventos</Trans>
                    </h3>

                    <p className="mt-2 max-w-[50ch]">
                      <Trans>
                        No has creado ningun evento todavía. Crea una nuevo evento para comenzar.
                      </Trans>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      onEventSelect={handleEventSelect}
                      event_data={event}
                      finished={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <EventDialog
          event={selectedEvent}
          isOpen={isEventDialogOpen}
          artistData={artists}
          onClose={() => {
            setIsEventDialogOpen(false);
            setSelectedEvent(null);
          }}
          onSave={handleEventSave}
          onDelete={eventDelete}
        />
      </CalendarDndProvider>
    </div>
  );
}
