import { z } from 'zod';

import { MessageSchema } from '@documenso/prisma/generated/zod/modelSchema/MessageSchema';

export const ZMessageSchema = MessageSchema.pick({
  id: true,
  role: true,
  attachments: true,
  parts: true,
  chatId: true,
  createdAt: true,
});

export type DBMessage = z.infer<typeof ZMessageSchema>;
