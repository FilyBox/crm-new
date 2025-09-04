import { type TEventForm } from '@documenso/lib/types/event';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarEvent
  extends Omit<TEventForm, 'id' | 'name' | 'beginning' | 'end' | 'image'> {
  id: string; // Calendar needs string ID for display
  title: string; // Calendar display name (maps to TEventForm.name)
  start: Date; // Calendar start time (maps to TEventForm.beginning)
  end: Date; // Calendar end time (maps to TEventForm.end)
  image?: File | null; // Calendar image (maps to TEventForm.image)
}
export type EventColor = 'blue' | 'orange' | 'violet' | 'rose' | 'emerald' | 'sky';
