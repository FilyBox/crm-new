import { z } from 'zod';

import { ZDistributionSchema } from '@documenso/lib/types/distribution';
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

export const ZFindDistributionRequestSchema = ZFindSearchParamsSchema.extend({
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).describe('').default('desc'),
});

export const ZFindDistributionInternalRequestSchema = ZFindDistributionRequestSchema.extend({
  period: z.enum(['7d', '14d', '30d']).optional(),
});

export const ZFindDistributionResponseSchema = ZFindResultResponse.extend({
  data: ZDistributionSchema.array(),
});

export type TFindDistributionRequest = z.infer<typeof ZFindDistributionRequestSchema>;
export type TFindDistributionInternalRequest = z.infer<
  typeof ZFindDistributionInternalRequestSchema
>;
export type TFindDistributionResponse = z.infer<typeof ZFindDistributionResponseSchema>;

export const ZFindDistributionInternalResponseSchema = ZFindResultResponse.extend({
  data: ZDistributionSchema.array(),
});

export type TFindDistributionInternalResponse = z.infer<
  typeof ZFindDistributionInternalResponseSchema
>;
