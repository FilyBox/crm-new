import { z } from 'zod';

import { EventSchema } from '@documenso/prisma/generated/zod/modelSchema/EventSchema';
import { TicketTypeSchema } from '@documenso/prisma/generated/zod/modelSchema/TicketTypeSchema';

const ZArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const ZEventSchema = EventSchema.pick({
  id: true,
  end: true,
  description: true,
  beginning: true,
  image: true,
  name: true,
  venue: true,
  deletedAt: true,
  published: true,
  updatedAt: true,
  createdAt: true,
  allDay: true,
  color: true,
  teamId: true,
  userId: true,
}).extend({
  updateTickets: z.array(z.string()).optional(),
  ticketTypes: z
    .array(
      TicketTypeSchema.pick({
        id: true,
        name: true,
        price: true,
        quantity: true,
        maxQuantityPerUser: true,
        description: true,
        seatNumber: true,
      }),
    )
    .optional(),
  artists: z.array(ZArtistSchema).optional(),
  updateArtists: z.array(z.string()).optional(),
});

export const ZEventFormSchema = EventSchema.pick({
  id: true,
  end: true,
  description: true,
  beginning: true,
  image: true,
  name: true,
  venue: true,
  published: true,
  allDay: true,
  color: true,
}).extend({
  updateTickets: z.array(z.string()).optional(),
  ticketTypes: z
    .array(
      TicketTypeSchema.pick({
        id: true,
        name: true,
        price: true,
        quantity: true,
        maxQuantityPerUser: true,
        description: true,
        seatNumber: true,
      }),
    )
    .optional(),
  artists: z.array(ZArtistSchema).optional(),
  updateArtists: z.array(z.string()).optional(),
});

export type TEventForm = z.infer<typeof ZEventFormSchema>;
export type TEvent = z.infer<typeof ZEventSchema>;
