import type { z } from 'zod';

import { FilesSchema } from '@documenso/prisma/generated/zod/modelSchema/FilesSchema';
import { TeamSchema } from '@documenso/prisma/generated/zod/modelSchema/TeamSchema';
import { UserSchema } from '@documenso/prisma/generated/zod/modelSchema/UserSchema';

export const ZFilesSchema = FilesSchema.pick({
  id: true,
  completedAt: true,
  createdAt: true,
  deletedAt: true,
  fileDataId: true,
  folderId: true,
  qrToken: true,
  title: true,
  status: true,
  teamId: true,
  updatedAt: true,
  userId: true,
  useToChat: true,
  visibility: true,
});

export const ZFilesManySchema = FilesSchema.pick({
  id: true,
  completedAt: true,
  createdAt: true,
  deletedAt: true,
  fileDataId: true,
  folderId: true,
  qrToken: true,
  title: true,
  status: true,
  teamId: true,
  updatedAt: true,
  userId: true,
  useToChat: true,
  visibility: true,
}).extend({
  user: UserSchema.pick({
    id: true,
    name: true,
    email: true,
  }),
  team: TeamSchema.pick({
    id: true,
    url: true,
  }).nullable(),
});

export type TFiles = z.infer<typeof ZFilesSchema>;
export type TFilesMany = z.infer<typeof ZFilesManySchema>;
