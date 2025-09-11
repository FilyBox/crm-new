import { type UIMessage } from 'ai';
import { z } from 'zod';

import DocumentDataSchema from '@documenso/prisma/generated/zod/modelSchema/DocumentDataSchema';

export const ZUploadPdfRequestSchema = z.object({
  file: z.instanceof(File),
});
// const {
//   id,
//   teamId,
//   contractId,
//   body,
//   messages,
//   selectedChatModel,
// }: {
//   id: string;
//   teamId?: string;
//   contractId: string;
//   body?: string;
//   messages: Array<UIMessage>;
//   selectedChatModel: string;
// } = await request.json();

export const ZChatRequestSchema = z.object({
  id: z.string().uuid(),
  teamId: z.number(),
  userId: z.number(),
  contractId: z.number(),
  body: z.string().optional(),
  messages: z.array(z.custom<UIMessage>()),
  model: z.string(),
});

export const ZUploadPdfResponseSchema = DocumentDataSchema.pick({
  type: true,
  id: true,
});

export type TUploadPdfRequest = z.infer<typeof ZUploadPdfRequestSchema>;
export type TUploadPdfResponse = z.infer<typeof ZUploadPdfResponseSchema>;

export const ZGetPresignedPostUrlRequestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
});

export const ZGetPresignedPostUrlResponseSchema = z.object({
  key: z.string().min(1),
  url: z.string().min(1),
});

export const ZGetPresignedGetUrlRequestSchema = z.object({
  key: z.string().min(1),
});

export const ZGetPresignedGetUrlResponseSchema = z.object({
  url: z.string().min(1),
});

export type TGetPresignedPostUrlRequest = z.infer<typeof ZGetPresignedPostUrlRequestSchema>;
export type TGetPresignedPostUrlResponse = z.infer<typeof ZGetPresignedPostUrlResponseSchema>;
export type TGetPresignedGetUrlRequest = z.infer<typeof ZGetPresignedGetUrlRequestSchema>;
export type TGetPresignedGetUrlResponse = z.infer<typeof ZGetPresignedGetUrlResponseSchema>;
