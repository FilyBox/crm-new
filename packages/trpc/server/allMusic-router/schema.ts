import { z } from 'zod';

import { ZAllMusicSchema } from '@documenso/lib/types/allMusic';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';

export const ZSuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const ZGenericSuccessResponse = {
  success: true,
} satisfies z.infer<typeof ZSuccessResponseSchema>;

export const ZFindAllMusicRequestSchema = ZFindSearchParamsSchema.extend({
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).describe('').default('desc'),
});

export const ZFindAllMusicInternalRequestSchema = ZFindAllMusicRequestSchema.extend({
  period: z.enum(['7d', '14d', '30d']).optional(),
});

export const ZFindAllMusicResponseSchema = ZFindResultResponse.extend({
  data: ZAllMusicSchema.array(),
});

export type TFindAllMusicRequest = z.infer<typeof ZFindAllMusicRequestSchema>;
export type TFindAllMusicInternalRequest = z.infer<typeof ZFindAllMusicInternalRequestSchema>;
export type TFindAllMusicResponse = z.infer<typeof ZFindAllMusicResponseSchema>;

export const ZFindAllMusicInternalResponseSchema = ZFindResultResponse.extend({
  data: ZAllMusicSchema.array(),
});

export type TFindAllMusicInternalResponse = z.infer<typeof ZFindAllMusicInternalResponseSchema>;
