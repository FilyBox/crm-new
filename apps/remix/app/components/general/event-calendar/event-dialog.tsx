import { useEffect, useMemo, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { format, isBefore } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { CalendarCheck, Trash2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { Calendar } from '@documenso/ui/primitives/calendar';
import { Checkbox } from '@documenso/ui/primitives/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form';
import { Input } from '@documenso/ui/primitives/input';
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
import { Switch } from '@documenso/ui/primitives/switch';
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

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name cannot be empty' }),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  allDay: z.boolean(),
  venue: z.string().optional(),
  color: z.string(),
  published: z.boolean().optional(),
});

export function EventDialog({ event, isOpen, onClose, onSave, onDelete }: EventDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const { t, i18n } = useLingui();
  const currentLanguage = i18n.locale;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      startTime: `${DefaultStartHour}:00`,
      endTime: `${DefaultEndHour}:00`,
      allDay: false,
      venue: '',
      color: 'blue',
    },
  });

  useEffect(() => {
    if (event) {
      const start = new Date(event.beginning);
      const end = new Date(event.end);

      form.reset({
        name: event.name || '',
        description: event.description || '',
        startDate: start,
        endDate: end,
        startTime: formatTimeForInput(start),
        endTime: formatTimeForInput(end),
        allDay: event.allDay || false,
        venue: event.venue || '',
        color: (event.color as EventColor) || 'orange',
        published: event.published || false,
      });
      setError(null);
    } else {
      form.reset({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(),
        startTime: `${DefaultStartHour}:00`,
        endTime: `${DefaultEndHour}:00`,
        allDay: false,
        venue: '',
        color: 'blue',
        published: false,
      });
      setError(null);
    }
  }, [event, form]);

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

  const handleSave = (values: z.infer<typeof formSchema>) => {
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);

    if (!values.allDay) {
      const [startHours = 0, startMinutes = 0] = values.startTime.split(':').map(Number);
      const [endHours = 0, endMinutes = 0] = values.endTime.split(':').map(Number);

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

    const eventName = values.name.trim() ? values.name : t`(no title)`;
    console.log('event published', values.published);
    onSave({
      id: event?.id || '',
      name: eventName,
      description: values.description || null,
      beginning: start,
      end,
      allDay: values.allDay,
      venue: values.venue || null,
      color: values.color as EventColor,
      image: event?.image ?? null,
      published: event?.published ?? false,
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
    {
      value: 'sky',
      label: 'Sky',
      bgClass: 'bg-sky-400 data-[state=checked]:bg-sky-400',
      borderClass: 'border-sky-400 data-[state=checked]:border-sky-400',
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        autoFocus={false}
        showOverlay={true}
        className="dark:bg-backgroundDark m-2 flex max-h-[98vh] w-full max-w-[94vw] flex-col justify-between overflow-y-auto rounded-lg bg-zinc-50 sm:m-2 md:max-w-4xl"
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

        <ScrollArea className="h-[58cqh] w-full sm:h-[75cqh]">
          <Form {...form}>
            <form className="grid gap-4 p-1 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Title</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Description</Trans>
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>
                        <Trans>Start Date</Trans>
                      </FormLabel>
                      <FormControl>
                        <Popover modal={true} open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'bg-background hover:bg-background border-input group w-full justify-between px-3 font-normal outline-none outline-offset-0 focus-visible:outline-[3px]',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              <span
                                className={cn('truncate', !field.value && 'text-muted-foreground')}
                              >
                                {field.value
                                  ? format(field.value, 'PPP', {
                                      locale: currentLanguage === 'es' ? es : enUS,
                                    })
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
                              selected={field.value}
                              defaultMonth={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date);
                                  // If end date is before the new start date, update it to match the start date
                                  const endDate = form.getValues('endDate');
                                  if (isBefore(endDate, date)) {
                                    form.setValue('endDate', date);
                                  }
                                  setError(null);
                                  setStartDateOpen(false);
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!form.watch('allDay') && (
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="min-w-40">
                        <FormLabel>
                          <Trans>Start Time</Trans>
                        </FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>
                        <Trans>End Date</Trans>
                      </FormLabel>
                      <FormControl>
                        <Popover modal={true} open={endDateOpen} onOpenChange={setEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'bg-background hover:bg-background border-input group w-full justify-between px-3 font-normal outline-none outline-offset-0 focus-visible:outline-[3px]',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              <span
                                className={cn('truncate', !field.value && 'text-muted-foreground')}
                              >
                                {field.value
                                  ? format(field.value, 'PPP', {
                                      locale: currentLanguage === 'es' ? es : enUS,
                                    })
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
                              selected={field.value}
                              defaultMonth={field.value}
                              disabled={{ before: form.getValues('startDate') }}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date);
                                  setError(null);
                                  setEndDateOpen(false);
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!form.watch('allDay') && (
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="min-w-40">
                        <FormLabel>
                          <Trans>End Time</Trans>
                        </FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
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
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="allDay"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel>
                        <Trans>All day</Trans>
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Location</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex w-full items-center justify-start gap-6">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem className="col-span-1 w-fit space-y-4">
                      <FormLabel className="text-foreground text-sm font-medium leading-none">
                        <Trans>Etiquette</Trans>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="flex items-center gap-1.5"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          {colorOptions.map((colorOption) => (
                            <RadioGroupItem
                              key={colorOption.value}
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="col-span-1 mt-1 flex w-fit flex-col space-y-4">
                      <FormLabel className="text-foreground text-sm font-medium leading-none">
                        <Trans>Published</Trans>
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked as boolean)}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>
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
            <Button
              onClick={async () => {
                const isValid = await form.trigger();
                if (isValid) {
                  const values = form.getValues();
                  await handleSave(values);
                }
              }}
            >
              <Trans>Save</Trans>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
