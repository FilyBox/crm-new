import { z } from 'zod';

import { ZFindResultResponse, ZFindSearchParamsSchema } from '@documenso/lib/types/search-params';
import { TTask, ZTaskSchema } from '@documenso/lib/types/task';

export interface BoardsWithTasksRecord {
  boards: Record<string, TTask[]>;
}

export const ZSuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const ZGenericSuccessResponse = {
  success: true,
} satisfies z.infer<typeof ZSuccessResponseSchema>;

export const ZFindTaskRequestSchema = ZFindSearchParamsSchema.extend({
  orderByColumn: z.enum(['createdAt']).optional(),
  orderByDirection: z.enum(['asc', 'desc']).describe('').default('desc'),
});

export const ZFindTaskInternalRequestSchema = ZFindTaskRequestSchema.extend({
  period: z.enum(['7d', '14d', '30d']).optional(),
  folderId: z.string().optional(),
});

export const ZFindTaskSchema = ZFindResultResponse.extend({
  data: ZTaskSchema.array(),
});

export type TFindTaskRequest = z.infer<typeof ZFindTaskRequestSchema>;
export type TFindTaskInternalRequest = z.infer<typeof ZFindTaskInternalRequestSchema>;
export type TFindTaskResponse = z.infer<typeof ZFindTaskSchema>;

export const ZFindTaskInternalResponseSchema = ZFindResultResponse.extend({
  data: ZTaskSchema.array(),
});

export type TFindTaskInternalResponse = z.infer<typeof ZFindTaskInternalResponseSchema>;
