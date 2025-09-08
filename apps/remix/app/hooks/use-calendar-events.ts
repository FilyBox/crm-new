import { useMemo } from 'react';

import { queryOptions } from '@tanstack/react-query';

import { putFile } from '@documenso/lib/universal/upload/put-file';
import { trpc } from '@documenso/trpc/react';
import type { FilterStructure } from '@documenso/ui/lib/filter-columns';

import type { CalendarEvent, EventColor } from '~/components/general/event-calendar/types';
import { useCurrentTeam } from '~/providers/team';
import { useRegistrationFormStore, useUpdateFormStore } from '~/storage/store-tickets';

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
  const { newType, addNewTicket } = useRegistrationFormStore();
  const { type } = useUpdateFormStore();

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

  const { data: ticketTemplates } = trpc.ticketType.getTicketTemplate.useQuery();

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

  const { mutateAsync: createTicketType } = trpc.ticketType.createTicketType.useMutation();
  const { mutateAsync: createMultipleTicketType } =
    trpc.ticketType.createMultipleTicketType.useMutation();
  const { mutateAsync: updateMultipleTicketType } =
    trpc.ticketType.updateMultpleTicketTypeById.useMutation();

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

    if (newType.length > 0 && event) {
      newType.forEach(async (type) => {
        console.log('Creating ticket type for event:', event.id, type);

        await createTicketType({
          name: type.name ?? '',
          price: type.price ?? 0,
          quantity: type.quantity ?? 0,
          maxQuantityPerUser: type.maxQuantityPerUser ?? 0,
          description: type.description ?? '',
          eventId: eventCreated.id,
          // imageUrl: type.imageUrl,
        });
      });
    }

    newType.length = 0;
    await addNewTicket({
      id: crypto.randomUUID(),
      name: '',
      description: '',
      quantity: 0,
      price: 0,
      maxQuantityPerUser: 0,
      seatNumber: 0,
    });
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

    await Promise.allSettled([
      createMultipleTicketType({ ticketTypes: newType, eventId: id }),
      updateMultipleTicketType(type),
    ]);
  };

  const handleEventDelete = async (eventId: string) => {
    const id = parseInt(eventId);
    if (isNaN(id)) return;

    await deleteEventMutation.mutateAsync({ id });
  };
  return {
    events: calendarEvents,
    ticketTemplates: ticketTemplates,
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
