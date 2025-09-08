import { z } from 'zod';

import { ZIsrcSongsSchema } from '@documenso/lib/types/isrc';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

// import { ExtendedIsrcSongs, ExtendedIsrcSongsType } from '@documenso/prisma/types/extended-IsrcSongs';

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

export const ZFindIsrcSongsRequestSchema = ZFindSearchParamsSchema.extend({
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).describe('').default('desc'),
});

export const ZFindIsrcSongsInternalRequestSchema = ZFindIsrcSongsRequestSchema.extend({
  period: z.enum(['7d', '14d', '30d']).optional(),
  folderId: z.string().optional(),
});

export const ZFindIsrcSongsResponseSchema = ZFindResultResponse.extend({
  data: ZIsrcSongsSchema.array(),
});

export type TFindIsrcSongsRequest = z.infer<typeof ZFindIsrcSongsRequestSchema>;
export type TFindIsrcSongsInternalRequest = z.infer<typeof ZFindIsrcSongsInternalRequestSchema>;
export type TFindIsrcSongsResponse = z.infer<typeof ZFindIsrcSongsResponseSchema>;

export const ZFindIsrcSongsInternalResponseSchema = ZFindResultResponse.extend({
  data: ZIsrcSongsSchema.array(),
});

export type TFindIsrcSongsInternalResponse = z.infer<typeof ZFindIsrcSongsInternalResponseSchema>;
