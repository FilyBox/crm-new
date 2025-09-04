import { type TEventForm } from '@documenso/lib/types/event';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'list';

export interface CalendarEvent extends Omit<TEventForm, 'id' | 'image'> {
  id: string; // Calendar needs string ID for display
  image?: File | string | null; // Calendar image
  removeImage?: boolean; // Flag to indicate if the image should be removed
}

export type EventColor = 'blue' | 'orange' | 'violet' | 'rose' | 'emerald' | 'sky';
