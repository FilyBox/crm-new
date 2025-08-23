import { z } from 'zod';

import { TaskSchema } from '@documenso/prisma/generated/zod/modelSchema/TaskSchema';
import { TeamSchema } from '@documenso/prisma/generated/zod/modelSchema/TeamSchema';
import { UserSchema } from '@documenso/prisma/generated/zod/modelSchema/UserSchema';
import { tuStreamsSchema } from '@documenso/prisma/generated/zod/modelSchema/tuStreamsSchema';

/**
 * The full document response schema.
 *
 * Mainly used for returning a single document from the API.
 */

const ZArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export const ZtuStreamsSchema = tuStreamsSchema
  .pick({
    id: true,
    date: true,
    artist: true,
    title: true,
    UPC: true,
    createdAt: true,
    type: true,
    total: true,
    teamId: true,
    userId: true,
  })
  .extend({
    artists: z.array(ZArtistSchema).optional(),
    tuStreamsArtists: z.array(ZArtistSchema).optional(),
    artistsToUpdate: z.array(z.string()).optional(),
  });

export type TtuStreams = z.infer<typeof ZtuStreamsSchema>;

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
