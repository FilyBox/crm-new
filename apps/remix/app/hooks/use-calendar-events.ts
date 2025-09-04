import { useMemo } from 'react';

import { queryOptions } from '@tanstack/react-query';

import { putFile } from '@documenso/lib/universal/upload/put-file';
import { trpc } from '@documenso/trpc/react';
import type { FilterStructure } from '@documenso/ui/lib/filter-columns';

import type { CalendarEvent, EventColor } from '~/components/general/event-calendar/types';
import { useCurrentTeam } from '~/providers/team';

export interface DatabaseEvent {
  id: number;
  name: string;
  description?: string | null;
  beginning: Date;
  end: Date;
  venue?: string | null;
  color?: EventColor | null;
  allDay?: boolean;
  image?: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  artists: Array<{
    id: number;
    name: string;
  }>;
}

export const useCalendarEvents = ({
  query,
  orderByColumn,
  orderByDirection,
  filterStructure,
  joinOperator,
  artistIds,
}: {
  query?: string | undefined;
  orderByColumn?: 'id' | undefined;
  orderByDirection?: 'asc' | 'desc' | undefined;
  period?: '7d' | '14d' | '30d' | undefined;
  filterStructure?: (FilterStructure | null | undefined)[] | undefined;
  joinOperator?: 'and' | 'or' | undefined;
  artistIds?: number[] | undefined;
}) => {
  const utils = trpc.useUtils();

  const team = useCurrentTeam();
  const {
    data: eventsData,
    isLoading,
    error,
  } = trpc.events.getAllEventsNoPagination.useQuery(
    {
      orderByColumn,
      orderByDirection,
      filterStructure,
      joinOperator,
      artistIds,
    },
    queryOptions({
      queryKey: ['events', team.id, query, artistIds, filterStructure, joinOperator],
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }),
  );

  // Create event mutation
  const createEventMutation = trpc.events.createEvent.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsNoPagination.invalidate();
    },
  });

  // Update event mutation
  const updateEventMutation = trpc.events.updateEventById.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsNoPagination.invalidate();
    },
  });

  // Delete event mutation
  const deleteEventMutation = trpc.events.deleteEventById.useMutation({
    onSuccess: async () => {
      await utils.events.getAllEventsNoPagination.invalidate();
    },
  });

  // Convert database events to calendar events
  const calendarEvents = useMemo(() => {
    if (!eventsData?.events) return [];

    return eventsData.events.map(
      (event): CalendarEvent => ({
        id: event.id.toString(),
        name: event.name,
        description: event.description,
        beginning: event.beginning,
        end: event.end,
        venue: event.venue,
        color: event.color,
        allDay: event.allDay,
        published: event.published,
        image: event.image,
        artists: event.artists,
        ticketTypes: event.ticketTypes,
      }),
    );
  }, [eventsData?.events]);

  const handleEventAdd = async (event: CalendarEvent) => {
    const eventCreated = await createEventMutation.mutateAsync({
      name: event.name,
      description: event.description ?? undefined,
      beginning: event.beginning,
      end: event.end,
      venue: event.venue ?? undefined,
      allDay: event.allDay,
      color: event.color ?? undefined,
      published: event.published,
      artists: event.updateArtists,
    });

    const image = event.image instanceof File ? event.image : null;
    let imageUrl: string | undefined = undefined;
    if (image) {
      const parts = image.name.split('.');
      const ext = parts.length > 1 ? '.' + parts.pop() : '';
      let base = parts.join('.');
      if (base.length > 50) base = base.slice(0, 50);
      const safeName = base + ext;

      const truncatedFile = new File([image], safeName, { type: image.type });

      const result = await putFile(truncatedFile);
      imageUrl = result.data;
      console.log('Image uploaded successfully:', result.data);
      imageUrl = result.data;

      if (imageUrl) {
        await updateEventMutation.mutateAsync({
          id: eventCreated.id,
          image: imageUrl,
        });
      }
    }
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    const id = parseInt(event.id);
    if (isNaN(id)) return;
    console.log('event published', event.published);

    const image = event.image instanceof File ? event.image : null;
    let imageUrl: string | undefined = undefined;
    if (image) {
      const parts = image.name.split('.');
      const ext = parts.length > 1 ? '.' + parts.pop() : '';
      let base = parts.join('.');
      if (base.length > 50) base = base.slice(0, 50);
      const safeName = base + ext;

      const truncatedFile = new File([image], safeName, { type: image.type });

      const result = await putFile(truncatedFile);
      imageUrl = result.data;
      console.log('Image uploaded successfully:', result.data);
      imageUrl = result.data;
    }
    await updateEventMutation.mutateAsync({
      id,
      name: event.name,
      description: event.description ?? undefined,
      beginning: event.beginning,
      end: event.end,
      venue: event.venue ?? undefined,
      allDay: event.allDay,
      color: event.color ?? undefined,
      published: event.published,
      image: imageUrl,
      updateArtists: event.updateArtists,
      removeImage: event.removeImage,
    });
  };

  const handleEventDelete = async (eventId: string) => {
    const id = parseInt(eventId);
    if (isNaN(id)) return;

    await deleteEventMutation.mutateAsync({ id });
  };
  return {
    events: calendarEvents,
    isLoading,
    error,
    artists: eventsData?.artists,
    handleEventAdd,
    handleEventUpdate,
    handleEventDelete,
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
};
