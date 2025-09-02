import { Release, TypeOfRelease } from '@prisma/client';
import { z } from 'zod';

import { ZReleaseSchema } from '@documenso/lib/types/release';
import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';
import { ExtendedRelease, ExtendedReleaseType } from '@documenso/prisma/types/extended-release';

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

export const ZFindReleaseRequestSchema = ZFindSearchParamsSchema.extend({
  release: z.nativeEnum(Release).describe('Filter tasks by how it was created.').optional(),
  type: z.nativeEnum(TypeOfRelease).describe('Filter releases by its type').optional(),
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).describe('').default('desc'),
});

export const ZFindReleaseInternalRequestSchema = ZFindReleaseRequestSchema.extend({
  period: z.enum(['7d', '14d', '30d']).optional(),
  type: z.nativeEnum(ExtendedReleaseType).optional(),
  release: z.nativeEnum(ExtendedRelease).optional(),
});

export const ZFindReleaseResponseSchema = ZFindResultResponse.extend({
  data: ZReleaseSchema.array(),
});

export type TFindReleaseRequest = z.infer<typeof ZFindReleaseRequestSchema>;
export type TFindReleaseInternalRequest = z.infer<typeof ZFindReleaseInternalRequestSchema>;
export type TFindReleaseResponse = z.infer<typeof ZFindReleaseResponseSchema>;

export const ZFindReleaseInternalResponseSchema = ZFindResultResponse.extend({
  data: ZReleaseSchema.array(),
  type: z.object({
    [ExtendedReleaseType.Album]: z.number(),
    [ExtendedReleaseType.EP]: z.number(),
    [ExtendedReleaseType.Sencillo]: z.number(),
    [ExtendedReleaseType.ALL]: z.number(),
  }),
  release: z.object({
    [ExtendedRelease.Focus]: z.number(),
    [ExtendedRelease.Soft]: z.number(),
    [ExtendedRelease.ALL]: z.number(),
  }),
});

export type TFindReleaseInternalResponse = z.infer<typeof ZFindReleaseInternalResponseSchema>;
