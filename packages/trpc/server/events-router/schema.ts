import { EventColor } from '@prisma/client';
import { z } from 'zod';

import { ZEventSchema } from '@documenso/lib/types/event';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

/**
 * Required for empty responses since we currently can't 201 requests for our openapi setup.
 *
 * Without this it will throw an error in Speakeasy SDK when it tries to parse an empty response.
 */
export const ZSuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const ZGenericSuccessResponse = {
  success: true,
} satisfies z.infer<typeof ZSuccessResponseSchema>;

export const ZFindEventRequestSchema = ZFindSearchParamsSchema.extend({
  color: z.nativeEnum(EventColor).describe('Filter events by their color.').optional(),
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).describe('').default('desc'),
});

export const ZFindEventInternalRequestSchema = ZFindEventRequestSchema.extend({
  period: z.enum(['7d', '14d', '30d']).optional(),
});

export const ZFindEventResponseSchema = ZFindResultResponse.extend({
  data: ZEventSchema.array(),
});

export type TFindEventRequest = z.infer<typeof ZFindEventRequestSchema>;
export type TFindEventInternalRequest = z.infer<typeof ZFindEventInternalRequestSchema>;
export type TFindEventResponse = z.infer<typeof ZFindEventResponseSchema>;

export const ZFindEventInternalResponseSchema = ZFindResultResponse.extend({
  data: ZEventSchema.array(),
});

export type TFindEventInternalResponse = z.infer<typeof ZFindEventInternalResponseSchema>;
