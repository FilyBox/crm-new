import type { z } from 'zod';

import { TicketTemplateSchema } from '@documenso/prisma/generated/zod/modelSchema/TicketTemplateSchema';

export const ZTicketTemplateSchema = TicketTemplateSchema.pick({
  id: true,
  price: true,
  quantity: true,
  imageUrl: true,
  maxQuantityPerUser: true,
  description: true,
  name: true,
  isActive: true,
  teamId: true,
  userId: true,
  deletedAt: true,
  updatedAt: true,
  createdAt: true,
});

export const ZTicketTemplateSchemaLite = TicketTemplateSchema.pick({
  id: true,
  price: true,
  quantity: true,
  maxQuantityPerUser: true,
  description: true,
  name: true,
  imageUrl: true,
  isActive: true,
});

export type TTicketTemplateLite = z.infer<typeof ZTicketTemplateSchemaLite>;

export type TTicketTemplate = z.infer<typeof ZTicketTemplateSchema>;
