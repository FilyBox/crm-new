import { Trans } from '@lingui/react/macro';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Calendar, MapPinIcon } from 'lucide-react';

import { cn } from '@documenso/ui/lib/utils';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent, CardHeader, CardTitle } from '@documenso/ui/primitives/card';

import { StackAvatarsTasksWithTooltip } from './stack-avatars-tasks-with-tooltip';
import type { CalendarEvent } from './types';
import { getEventColorClasses } from './utils';

export default function EventCard({
  event_data,
  finished,
  onEventSelect,
}: {
  event_data: CalendarEvent;
  finished: boolean;
  onEventSelect: (event: CalendarEvent) => void;
}) {
  const isFinished = event_data.end ? new Date(event_data.end) < new Date() : false;
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect(event);
  };
  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="leading !line-clamp-1 flex items-center justify-between text-lg font-semibold">
          {event_data.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[380px] px-4 pb-4">
        <div className="flex h-full flex-col !justify-between">
          <div className="relative">
            {event_data.image ? (
              <img
                src={
                  event_data.image instanceof File
                    ? URL.createObjectURL(event_data.image)
                    : event_data.image
                }
                className="flex h-40 w-full justify-start justify-items-end rounded-md bg-slate-300/15 object-contain align-bottom"
                alt="imagen evento"
              />
            ) : (
              <div className="flex h-40 w-full animate-pulse justify-start justify-items-end rounded-md bg-slate-300/15 object-cover align-bottom" />
            )}

            <div className="absolute left-2 top-2 flex items-center justify-start gap-2">
              {isFinished && (
                <Badge className="2" variant="destructive" size={'small'} color="red">
                  Finalizado
                </Badge>
              )}

              <Badge
                className={cn('2', getEventColorClasses(event_data.color ?? undefined))}
                variant="default"
                size={'small'}
                color="red"
              >
                <Trans>{event_data.color}</Trans>
              </Badge>

              {event_data.published ? (
                <Badge className="2" variant="default" size={'small'} color="red">
                  <Trans>Published</Trans>
                </Badge>
              ) : (
                <Badge className="2" variant="secondary" size={'small'} color="red">
                  <Trans>Draft</Trans>
                </Badge>
              )}
            </div>
          </div>
          <p className="text-muted-foreground line-clamp-2 text-sm">{event_data.description}</p>
          <section className="flex flex-col gap-2">
            {/* <p>{event_data.artists?.map((artist) => }</p> */}
            <StackAvatarsTasksWithTooltip artist={event_data.artists} />
            <div className="flex items-center gap-2">
              <Badge className="w-fit !p-2" size={'small'} color="indigo">
                <MapPinIcon width={16} height={16} />
              </Badge>
              <p className="line-clamp-3 text-xs">{event_data.venue}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="!p-2" size={'small'} color="grass">
                <Calendar width={16} height={16} />
              </Badge>
              <Badge className="flex items-center gap-2">
                <p>
                  {event_data.beginning
                    ? format(new Date(event_data.beginning), 'd MMM yyyy', { locale: es })
                    : 'Invalid date'}
                </p>
                <p>{'>'}</p>
                <p>
                  {event_data.end
                    ? format(new Date(event_data.end), 'd MMM yyyy', { locale: es })
                    : 'Invalid date'}
                </p>
              </Badge>
            </div>
            <div className="flex justify-between gap-2">
              {/* <Link to={`/manage-event/${event_data.id}`} className="!w-1/2">

              <Button size="sm" className="!w-full flex-shrink" variant="secondary">
                Gestionar
              </Button>
            </Link> */}
              <Button
                size="sm"
                onClick={(e) => handleEventClick(event_data, e)}
                className="w-full flex-shrink gap-5"
                variant="secondary"
              >
                Editar
              </Button>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
