import BigCalendar from '@documenso/ui/primitives/big-calendar';
import { useCalendarContext } from '@documenso/ui/primitives/event-calendar/calendar-context';

import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Task');
}

export default function TasksPage() {
  const { isColorVisible, toggleColorVisibility } = useCalendarContext();

  return (
    <div className="mx-auto max-w-screen-xl gap-y-8 px-4 md:px-8">
      {/* {etiquettes.map((item) => (
        <div key={item.id}>
          <button
            asChild
            className="has-focus-visible:border-ring has-focus-visible:ring-ring/50 has-focus-visible:ring-[3px] relative justify-between rounded-md [&>svg]:size-auto"
          >
            <span>
              <span className="flex items-center justify-between gap-3 font-medium">
                <Checkbox
                  id={item.id}
                  className="peer sr-only"
                  checked={isColorVisible(item.color)}
                  onCheckedChange={() => toggleColorVisibility(item.color)}
                />
                <CalendarCheck
                  className="peer-not-data-[state=checked]:invisible"
                  size={16}
                  aria-hidden="true"
                />
                <label
                  htmlFor={item.id}
                  className="peer-not-data-[state=checked]:line-through peer-not-data-[state=checked]:text-muted-foreground/65 after:absolute after:inset-0"
                >
                  {item.name}
                </label>
              </span>
              <span
                className="bg-(--event-color) size-1.5 rounded-full"
                style={
                  {
                    '--event-color': `var(--color-${item.color}-400)`,
                  } as React.CSSProperties
                }
              ></span>
            </span>
          </button>
        </div>
      ))} */}

      <BigCalendar />
    </div>
  );
}
