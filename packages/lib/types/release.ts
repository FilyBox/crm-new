import { z } from 'zod';

import { ReleasesSchema } from '@documenso/prisma/generated/zod/modelSchema/ReleasesSchema';
import { TaskSchema } from '@documenso/prisma/generated/zod/modelSchema/TaskSchema';
import { TeamSchema } from '@documenso/prisma/generated/zod/modelSchema/TeamSchema';
import { UserSchema } from '@documenso/prisma/generated/zod/modelSchema/UserSchema';

/**
 * The full document response schema.
 *
 * Mainly used for returning a single document from the API.
 */

const ZArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export const ZReleaseSchema = ReleasesSchema.pick({
  id: true,
  date: true,
  artist: true,
  assets: true,
  audioWAV: true,
  banners: true,
  cover: true,
  Biography: true,
  canvas: true,
  createdAt: true,
  video: true,
  EPKUpdates: true,
  lanzamiento: true,
  release: true,
  pitch: true,
  uploaded: true,
  streamingLink: true,
  typeOfRelease: true,
  WebSiteUpdates: true,
  deletedAt: true,
}).extend({
  artists: z.array(ZArtistSchema).optional(),
  artistsToUpdate: z.array(z.string()).optional(),
});

export type TRelease = z.infer<typeof ZReleaseSchema>;

/**
 * A lite version of the document response schema without relations.
 */
export const ZDocumentLiteSchema = TaskSchema.pick({
  id: true,
  externalId: true,
  userId: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  tags: true,
  projectId: true,
  parentTaskId: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  deletedAt: true,
  teamId: true,
});

export type TTaskLite = z.infer<typeof ZDocumentLiteSchema>;

/**
 * A version of the document response schema when returning multiple documents at once from a single API endpoint.
 */
export const ZTaskManySchema = TaskSchema.pick({
  id: true,
  externalId: true,
  userId: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  tags: true,
  projectId: true,
  parentTaskId: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  deletedAt: true,
  teamId: true,
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

export type TDocumentMany = z.infer<typeof ZTaskManySchema>;
