import type { z } from 'zod';

import { TicketTypeSchema } from '@documenso/prisma/generated/zod/modelSchema/TicketTypeSchema';

export const ZTicketTypeSchema = TicketTypeSchema.pick({
  id: true,
  available: true,
  price: true,
  quantity: true,
  imageUrl: true,
  maxQuantityPerUser: true,
  seatNumber: true,
  status: true,
  stripePriceId: true,
  stripeProductId: true,
  uid: true,
  description: true,
  name: true,
  deletedAt: true,
  updatedAt: true,
  createdAt: true,
});

export const ZTicketTypeSchemaLite = TicketTypeSchema.pick({
  price: true,
  quantity: true,
  maxQuantityPerUser: true,
  seatNumber: true,
  description: true,
  name: true,
});

export type TTicketTypeLite = z.infer<typeof ZTicketTypeSchemaLite>;

export type TTicketType = z.infer<typeof ZTicketTypeSchema>;
