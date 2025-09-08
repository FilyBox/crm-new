import { useMemo } from 'react';

import { Trans } from '@lingui/react/macro';
import { format, isAfter, isSameDay, isToday, startOfDay } from 'date-fns';
import { Calendar } from 'lucide-react';

import { EventItem } from './event-item';
import type { CalendarEvent } from './types';
import { getAgendaEventsForDay } from './utils';

export type { CalendarEvent, CalendarView, EventColor } from './types';

interface AgendaViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventSelect: (event: CalendarEvent) => void;
}

export function AgendaView({ currentDate, events, onEventSelect }: AgendaViewProps) {
  const futureEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return events.filter((event) => {
      const eventDate = new Date(event.beginning);
      return isSameDay(eventDate, today) || isAfter(eventDate, today);
    });
  }, [events]);

  const daysWithEvents = useMemo(() => {
    const uniqueDays = new Set<string>();
    futureEvents.forEach((event) => {
      const eventDate = new Date(event.beginning);
      uniqueDays.add(startOfDay(eventDate).toISOString());
    });

    return Array.from(uniqueDays)
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
  }, [futureEvents]);

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };

  return (
    <div className="border-border/70 border-t ps-4">
      {!futureEvents.length ? (
        <div className="flex min-h-[70svh] flex-col items-center justify-center py-16 text-center">
          <Calendar size={32} className="text-muted-foreground/50 mb-2" />
          <h3 className="text-lg font-medium">
            <Trans>No events found</Trans>
          </h3>
          <p className="text-muted-foreground">
            <Trans>There are no events scheduled for this time period.</Trans>
          </p>
        </div>
      ) : (
        daysWithEvents.map((day) => {
          const dayEvents = getAgendaEventsForDay(futureEvents, day);
          return (
            <div key={day.toString()} className="border-border/70 relative my-12 border-t">
              <span
                className="bg-background data-today:font-medium absolute -top-3 left-0 flex h-6 items-center pe-4 text-[10px] uppercase sm:pe-4 sm:text-xs"
                data-today={isToday(day) || undefined}
              >
                {format(day, 'd MMM, EEEE')}
              </span>
              <div className="mt-6 space-y-2">
                {dayEvents.map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    view="agenda"
                    onClick={(e) => handleEventClick(event, e)}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
