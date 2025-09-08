import { TypeOfTuStreams } from '@prisma/client';
import { z } from 'zod';

import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';
import { ZtuStreamsSchema } from '@documenso/lib/types/tustreams';

export const ExtendedTuStreamsType = {
  ...TypeOfTuStreams,

  ALL: 'ALL',
} as const;

export type ExtendedTuStreamsType =
  (typeof ExtendedTuStreamsType)[keyof typeof ExtendedTuStreamsType];

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

export const ZFindTuStreamsRequestSchema = ZFindSearchParamsSchema.extend({
  type: z.nativeEnum(TypeOfTuStreams).describe('Filter TuStreamss by its type').optional(),
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).describe('').default('desc'),
});

export const ZFindTuStreamsInternalRequestSchema = ZFindTuStreamsRequestSchema.extend({
  period: z.enum(['7d', '14d', '30d']).optional(),
  type: z.nativeEnum(ExtendedTuStreamsType).optional(),
});

export const ZFindTuStreamsResponseSchema = ZFindResultResponse.extend({
  data: ZtuStreamsSchema.array(),
});

export type TFindTuStreamsRequest = z.infer<typeof ZFindTuStreamsRequestSchema>;
export type TFindTuStreamsInternalRequest = z.infer<typeof ZFindTuStreamsInternalRequestSchema>;
export type TFindTuStreamsResponse = z.infer<typeof ZFindTuStreamsResponseSchema>;

export const ZFindTuStreamsInternalResponseSchema = ZFindResultResponse.extend({
  data: ZtuStreamsSchema.array(),
  type: z.object({
    [ExtendedTuStreamsType.Album]: z.number(),
    [ExtendedTuStreamsType.EP]: z.number(),
    [ExtendedTuStreamsType.Sencillo]: z.number(),
    [ExtendedTuStreamsType.Single]: z.number(),
    [ExtendedTuStreamsType.ALL]: z.number(),
  }),
});

export type TFindTuStreamsInternalResponse = z.infer<typeof ZFindTuStreamsInternalResponseSchema>;
