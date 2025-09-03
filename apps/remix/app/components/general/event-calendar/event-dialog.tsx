import { useEffect, useMemo, useState } from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { format, isBefore } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CalendarCheck, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { Calendar } from '@documenso/ui/primitives/calendar';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';
import { RadioGroup, RadioGroupItem } from '@documenso/ui/primitives/radio-group';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@documenso/ui/primitives/sheet';
import { Textarea } from '@documenso/ui/primitives/textarea';

import { DefaultEndHour, DefaultStartHour, EndHour, StartHour } from './constants';
import type { CalendarEvent, EventColor } from './types';

type artistData = {
  id: number;
  name: string;
}[];

type tickets = {
  id: number;
  name: string | null;
  price: number | null;
  quantity: number | null;
  maxQuantityPerUser: number | null;
  seatNumber?: number | null;
  description?: string | null;
};

interface EventDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  artistData?: artistData;
  tickets?: tickets[];
}

export function EventDialog({ event, isOpen, onClose, onSave, onDelete }: EventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultEndHour}:00`);
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [color, setColor] = useState<EventColor>('blue');
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const { t, i18n } = useLingui();
  const currentLanguage = i18n.locale;
  console.log('currentLanguage', currentLanguage);
  // Debug log to check what event is being passed
  // useEffect(() => {
  //   console.log('EventDialog received event:', event);
  // }, [event]);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');

      const start = new Date(event.start);
      const end = new Date(event.end);

      setStartDate(start);
      setEndDate(end);
      setStartTime(formatTimeForInput(start));
      setEndTime(formatTimeForInput(end));
      setAllDay(event.allDay || false);
      setLocation(event.location || '');
      setColor((event.color as EventColor) || 'orange');
      setError(null); // Reset error when opening dialog
    } else {
      resetForm();
    }
  }, [event]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartDate(new Date());
    setEndDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultEndHour}:00`);
    setAllDay(false);
    setLocation('');
    setColor('blue');
    setError(null);
  };

  const formatTimeForInput = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = Math.floor(date.getMinutes() / 15) * 15;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Memoize time options so they're only calculated once
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const value = `${formattedHour}:${formattedMinute}`;
        // Use a fixed date to avoid unnecessary date object creations
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, 'h:mm a');
        options.push({ value, label });
      }
    }
    return options;
  }, []); // Empty dependency array ensures this only runs once

  const handleSave = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!allDay) {
      const [startHours = 0, startMinutes = 0] = startTime.split(':').map(Number);
      const [endHours = 0, endMinutes = 0] = endTime.split(':').map(Number);

      if (
        startHours < StartHour ||
        startHours > EndHour ||
        endHours < StartHour ||
        endHours > EndHour
      ) {
        setError(t`Selected time must be between ${StartHour}:00 and ${EndHour}:00`);
        return;
      }

      start.setHours(startHours, startMinutes, 0);
      end.setHours(endHours, endMinutes, 0);
    } else {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    // Validate that end date is not before start date
    if (isBefore(end, start)) {
      setError(t`End date cannot be before start date`);
      return;
    }

    // Use generic title if empty
    const eventTitle = title.trim() ? title : t`(no title)`;

    onSave({
      id: event?.id || '',
      title: eventTitle,
      description,
      start,
      end,
      allDay,
      location,
      color,
    });
  };

  const handleDelete = () => {
    if (event?.id) {
      onDelete(event.id);
    }
  };

  // Updated color options to match types.ts
  const colorOptions: Array<{
    value: EventColor;
    label: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      value: 'blue',
      label: 'Blue',
      bgClass: 'bg-blue-400 data-[state=checked]:bg-blue-400',
      borderClass: 'border-blue-400 data-[state=checked]:border-blue-400',
    },
    {
      value: 'violet',
      label: 'Violet',
      bgClass: 'bg-violet-400 data-[state=checked]:bg-violet-400',
      borderClass: 'border-violet-400 data-[state=checked]:border-violet-400',
    },
    {
      value: 'rose',
      label: 'Rose',
      bgClass: 'bg-rose-400 data-[state=checked]:bg-rose-400',
      borderClass: 'border-rose-400 data-[state=checked]:border-rose-400',
    },
    {
      value: 'emerald',
      label: 'Emerald',
      bgClass: 'bg-emerald-400 data-[state=checked]:bg-emerald-400',
      borderClass: 'border-emerald-400 data-[state=checked]:border-emerald-400',
    },
    {
      value: 'orange',
      label: 'Orange',
      bgClass: 'bg-orange-400 data-[state=checked]:bg-orange-400',
      borderClass: 'border-orange-400 data-[state=checked]:border-orange-400',
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        autoFocus={false}
        showOverlay={true}
        className="dark:bg-backgroundDark m-2 flex max-h-[98vh] w-full max-w-[94vw] flex-col justify-start overflow-y-auto rounded-lg bg-zinc-50 sm:m-2 md:max-w-4xl"
      >
        <SheetHeader>
          <SheetTitle>{event?.id ? t`Edit Event` : t`Create Event`}</SheetTitle>
          <SheetDescription className="sr-only">
            {event?.id ? t`Edit the details of this event` : t`Add a new event to your calendar`}
          </SheetDescription>
        </SheetHeader>
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}
        <div className="grid gap-4 py-4">
          <div className="*:not-first:mt-1.5">
            <Label htmlFor="title">
              <Trans>Title</Trans>
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="description">
              <Trans>Description</Trans>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <div className="*:not-first:mt-1.5 flex-1">
              <Label htmlFor="start-date">
                <Trans>Start Date</Trans>
              </Label>
              <Popover modal={true} open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant={'outline'}
                    className={cn(
                      'bg-background hover:bg-background border-input group w-full justify-between px-3 font-normal outline-none outline-offset-0 focus-visible:outline-[3px]',
                      !startDate && 'text-muted-foreground',
                    )}
                  >
                    <span className={cn('truncate', !startDate && 'text-muted-foreground')}>
                      {startDate
                        ? format(startDate, 'PPP', { locale: currentLanguage === 'es' ? es : enUS })
                        : 'Pick a date'}
                    </span>
                    <CalendarCheck
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-9999 w-auto p-2" align="start">
                  <Calendar
                    captionLayout="dropdown"
                    mode="single"
                    selected={startDate}
                    defaultMonth={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        // If end date is before the new start date, update it to match the start date
                        if (isBefore(endDate, date)) {
                          setEndDate(date);
                        }
                        setError(null);
                        setStartDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="*:not-first:mt-1.5 min-w-40">
                <Label htmlFor="start-time">
                  <Trans>Start Time</Trans>
                </Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="start-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-48">
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <div className="*:not-first:mt-1.5 flex-1">
              <Label htmlFor="end-date">
                <Trans>End Date</Trans>
              </Label>
              <Popover modal={true} open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant={'outline'}
                    className={cn(
                      'bg-background hover:bg-background border-input group w-full justify-between px-3 font-normal outline-none outline-offset-0 focus-visible:outline-[3px]',
                      !endDate && 'text-muted-foreground',
                    )}
                  >
                    <span className={cn('truncate', !endDate && 'text-muted-foreground')}>
                      {endDate
                        ? format(endDate, 'PPP', { locale: currentLanguage === 'es' ? es : enUS })
                        : 'Pick a date'}
                    </span>
                    <CalendarCheck
                      size={16}
                      className="text-muted-foreground/80 shrink-0"
                      aria-hidden="true"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-9999 w-auto p-2" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={endDate}
                    defaultMonth={endDate}
                    disabled={{ before: startDate }}
                    onSelect={(date) => {
                      if (date) {
                        setEndDate(date);
                        setError(null);
                        setEndDateOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {!allDay && (
              <div className="*:not-first:mt-1.5 min-w-40">
                <Label htmlFor="end-time">
                  <Trans>End Time</Trans>
                </Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger id="end-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-48">
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="all-day"
              checked={allDay}
              onCheckedChange={(checked) => setAllDay(checked === true)}
            />
            <Label htmlFor="all-day">
              <Trans>All day</Trans>
            </Label>
          </div>

          <div className="*:not-first:mt-1.5">
            <Label htmlFor="location">
              <Trans>Location</Trans>
            </Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <fieldset className="space-y-4">
            <legend className="text-foreground text-sm font-medium leading-none">
              <Trans>Etiquette</Trans>
            </legend>
            <RadioGroup
              className="flex gap-1.5"
              defaultValue={colorOptions[0]?.value}
              value={color}
              onValueChange={(value: EventColor) => setColor(value)}
            >
              {colorOptions.map((colorOption) => (
                <RadioGroupItem
                  key={colorOption.value}
                  id={`color-${colorOption.value}`}
                  value={colorOption.value}
                  aria-label={colorOption.label}
                  className={cn(
                    'size-6 fill-white text-white shadow-none',
                    colorOption.bgClass,
                    colorOption.borderClass,
                  )}
                />
              ))}
            </RadioGroup>
          </fieldset>
        </div>
        <SheetFooter className="flex-row sm:justify-between">
          {event?.id && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              size="icon"
              onClick={() =>
                toast.warning(t`The event will be deleted`, {
                  description: t`Are you sure you want to delete this event?`,
                  position: 'bottom-center',
                  className: 'z-9999 pointer-events-auto',
                  closeButton: true,
                  action: {
                    label: t`Delete`,
                    onClick: () => {
                      handleDelete();
                    },
                  },
                })
              }
              aria-label="Delete event"
            >
              <Trash2Icon size={16} aria-hidden="true" />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              <Trans>Cancel</Trans>
            </Button>
            <Button onClick={handleSave}>
              <Trans>Save</Trans>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
