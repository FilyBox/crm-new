import { z } from 'zod';

import { ChatSchema } from '@documenso/prisma/generated/zod/modelSchema/ChatSchema';

export const ZChatSchema = ChatSchema.pick({
  id: true,
  title: true,
  visibility: true,
  documentId: true,
  userId: true,
  teamId: true,
  createdAt: true,
});

export type DBChat = z.infer<typeof ZChatSchema>;
export type Chat = z.infer<typeof ZChatSchema>;
