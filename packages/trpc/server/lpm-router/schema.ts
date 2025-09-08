import { z } from 'zod';

import { ZLpmSchema } from '@documenso/lib/types/lpm';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

// import { ExtendedLpm, ExtendedLpmType } from '@documenso/prisma/types/extended-Lpm';

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

export const ZFindLpmRequestSchema = ZFindSearchParamsSchema.extend({
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).describe('').default('desc'),
});

export const ZFindLpmInternalRequestSchema = ZFindLpmRequestSchema.extend({
  period: z.enum(['7d', '14d', '30d']).optional(),
});

export const ZExtendedLpmSchema = ZLpmSchema.extend({
  artist: z
    .object({
      id: z.number(),
      name: z.string(),
    })
    .array()
    .optional(),
  ZLpmSchema,
});

export const ZFindLpmResponseSchema = ZFindResultResponse.extend({
  data: ZLpmSchema.array(),
});

export type TFindLpmRequest = z.infer<typeof ZFindLpmRequestSchema>;
export type TFindLpmInternalRequest = z.infer<typeof ZFindLpmInternalRequestSchema>;
export type TFindLpmResponse = z.infer<typeof ZFindLpmResponseSchema>;

export const ZFindLpmInternalResponseSchema = ZFindResultResponse.extend({
  data: ZLpmSchema.array(),
});

export type TFindLpmInternalResponse = z.infer<typeof ZFindLpmInternalResponseSchema>;
