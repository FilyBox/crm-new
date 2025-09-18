import { isSameDay } from 'date-fns';

import type { CalendarEvent, EventColor } from './types';

/**
 * Get CSS classes for event colors
 */
export function getEventColorClasses(color?: EventColor | string): string {
  const eventColor = color || 'sky';

  switch (eventColor) {
    case 'sky':
      return 'bg-indigo-200/80 border border-indigo-400 dark:border-indigo-600 dark:!text-indigo-100 !text-indigo-900  dark:bg-indigo-900/80  dark:text-indigo-200 shadow-indigo-700/8';
    case 'violet':
      return 'bg-violet-200/80 border border-violet-400 dark:border-violet-600 dark:!text-violet-100 !text-violet-900 dark:bg-violet-900/80  dark:text-violet-200 shadow-violet-700/8';
    case 'rose':
      return 'bg-rose-200/80 border border-rose-400 dark:border-rose-600 dark:!text-rose-100 !text-rose-900  dark:bg-rose-900/80  dark:text-rose-200 shadow-rose-700/8';
    case 'emerald':
      return 'bg-emerald-200/80 border border-emerald-400 dark:border-emerald-600 dark:!text-emerald-100 !text-emerald-900  dark:bg-emerald-900/80  dark:text-emerald-200 shadow-emerald-700/8';
    case 'orange':
      return 'bg-orange-200/80 border border-orange-400 dark:border-orange-600 dark:!text-orange-100 !text-orange-900  dark:bg-orange-900/80 dark:text-orange-200 shadow-orange-700/8';
    default:
      return 'bg-indigo-200/80 border border-indigo-400 dark:border-indigo-600 dark:!text-indigo-100 !text-indigo-900  dark:bg-indigo-900/80 dark:text-indigo-200 shadow-indigo-700/8';
  }
}

export function getEventColorBorderClasses(color?: EventColor | string): string {
  const eventColor = color || 'sky';
  switch (eventColor) {
    case 'sky':
      return 'border-blue-400';
    case 'violet':
      return 'border-violet-400';
    case 'rose':
      return 'border-rose-400';
    case 'emerald':
      return 'border-emerald-400';
    case 'orange':
      return 'border-orange-400';
    default:
      return 'border-blue-400';
  }
}

export function getEventColorClassesGradient(color?: EventColor | string): string {
  const eventColor = color || 'sky';
  switch (eventColor) {
    case 'sky':
      return 'bg-gradient-to-b from-blue-400 via-cyan-400 to-blue-600 dark:from-blue-600 dark:via-cyan-600 dark:to-blue-800';
    case 'violet':
      return 'bg-gradient-to-b from-purple-400 via-violet-400 to-fuchsia-600 dark:from-purple-600 dark:via-violet-600 dark:to-fuchsia-800';
    case 'rose':
      return 'bg-gradient-to-b from-rose-400 via-pink-400 to-rose-600 dark:from-rose-600 dark:via-pink-600 dark:to-rose-800';
    case 'emerald':
      return 'bg-gradient-to-b from-emerald-400 via-teal-400 to-emerald-600 dark:from-emerald-600 dark:via-teal-600 dark:to-emerald-800';
    case 'orange':
      return 'bg-gradient-to-b from-orange-400 via-yellow-400 to-orange-600 dark:from-orange-600 dark:via-yellow-600 dark:to-orange-800';
    default:
      return 'bg-gradient-to-b from-blue-400 via-cyan-400 to-blue-600 dark:from-blue-600 dark:via-cyan-600 dark:to-blue-800';
  }
}
/**
 * Get CSS classes for border radius based on event position in multi-day events
 */
export function getBorderRadiusClasses(isFirstDay: boolean, isLastDay: boolean): string {
  if (isFirstDay && isLastDay) {
    return 'rounded'; // Both ends rounded
  } else if (isFirstDay) {
    return 'rounded-l rounded-r-none not-in-data-[slot=popover-content]:w-[calc(100%+5px)]'; // Only left end rounded
  } else if (isLastDay) {
    return 'rounded-r rounded-l-none not-in-data-[slot=popover-content]:w-[calc(100%+4px)] not-in-data-[slot=popover-content]:-translate-x-[4px]'; // Only right end rounded
  } else {
    return 'rounded-none not-in-data-[slot=popover-content]:w-[calc(100%+9px)] not-in-data-[slot=popover-content]:-translate-x-[4px]'; // No rounded corners
  }
}

/**
 * Check if an event is a multi-day event
 */
export function isMultiDayEvent(event: CalendarEvent): boolean {
  const eventStart = new Date(event.beginning);
  const eventEnd = new Date(event.end);
  return event.allDay || eventStart.getDate() !== eventEnd.getDate();
}

/**
 * Filter events for a specific day
 */
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.beginning);
      return isSameDay(day, eventStart);
    })
    .sort((a, b) => new Date(a.beginning).getTime() - new Date(b.beginning).getTime());
}

/**
 * Sort events with multi-day events first, then by start time
 */
export function sortEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aIsMultiDay = isMultiDayEvent(a);
    const bIsMultiDay = isMultiDayEvent(b);

    if (aIsMultiDay && !bIsMultiDay) return -1;
    if (!aIsMultiDay && bIsMultiDay) return 1;

    return new Date(a.beginning).getTime() - new Date(b.beginning).getTime();
  });
}

/**
 * Get multi-day events that span across a specific day (but don't start on that day)
 */
export function getSpanningEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    if (!isMultiDayEvent(event)) return false;

    const eventStart = new Date(event.beginning);
    const eventEnd = new Date(event.end);

    // Only include if it's not the start day but is either the end day or a middle day
    return (
      !isSameDay(day, eventStart) &&
      (isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd))
    );
  });
}

/**
 * Get all events visible on a specific day (starting, ending, or spanning)
 */
export function getAllEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((event) => {
    const eventStart = new Date(event.beginning);
    const eventEnd = new Date(event.end);
    return (
      isSameDay(day, eventStart) || isSameDay(day, eventEnd) || (day > eventStart && day < eventEnd)
    );
  });
}

/**
 * Get all events for a day (for agenda view)
 */
export function getAgendaEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events
    .filter((event) => {
      const eventStart = new Date(event.beginning);
      const eventEnd = new Date(event.end);
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        (day > eventStart && day < eventEnd)
      );
    })
    .sort((a, b) => new Date(a.beginning).getTime() - new Date(b.beginning).getTime());
}

/**
 * Add hours to a date
 */
export function addHoursToDate(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}
