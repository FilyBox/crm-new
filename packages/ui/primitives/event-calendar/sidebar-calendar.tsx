import { useEffect, useState } from 'react';
import * as React from 'react';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDownIcon } from 'lucide-react';

import { Button } from '@documenso/ui/primitives/button';
import { Calendar } from '@documenso/ui/primitives/calendar';
import { useCalendarContext } from '@documenso/ui/primitives/event-calendar/calendar-context';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';

export default function SidebarCalendar() {
  const { currentDate, setCurrentDate } = useCalendarContext();
  const [open, setOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(currentDate);

  // Update the calendar month whenever currentDate changes
  useEffect(() => {
    setCalendarMonth(currentDate);
  }, [currentDate]);

  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" id="date" className="w-fit justify-between font-normal">
          {currentDate ? format(currentDate, "d 'de' MMMM yyyy", { locale: es }) : 'Select date'}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          captionLayout="dropdown"
          mode="single"
          selected={currentDate}
          onSelect={handleSelect}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          classNames={{
            day_button:
              'transition-none! hover:not-in-data-selected:bg-sidebar-accent group-[.range-middle]:group-data-selected:bg-sidebar-accent text-sidebar-foreground',
            today: '*:after:transition-none',
            outside: 'data-selected:bg-sidebar-accent/50',
          }}
        />
      </PopoverContent>
    </Popover>
    // <div className={cn('flex w-full justify-center', className)}>

    // </div>
  );
}
