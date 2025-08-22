import type { z } from 'zod';

import { ContractSchema } from '@documenso/prisma/generated/zod/modelSchema/ContractSchema';
import { TaskSchema } from '@documenso/prisma/generated/zod/modelSchema/TaskSchema';
import { TeamSchema } from '@documenso/prisma/generated/zod/modelSchema/TeamSchema';
import { UserSchema } from '@documenso/prisma/generated/zod/modelSchema/UserSchema';

/**
 * The full document response schema.
 *
 * Mainly used for returning a single document from the API.
 */
export const ZContractsSchema = ContractSchema.pick({
  id: true,
  artists: true,
  startDate: true,
  endDate: true,
  isPossibleToExpand: true,
  possibleExtensionTime: true,
  status: true,
  documentId: true,
  summary: true,
  fileName: true,
  createdAt: true,
  updatedAt: true,
  teamId: true,
  userId: true,
  title: true,
  collectionPeriod: true,
  collectionPeriodDescription: true,
  collectionPeriodDuration: true,
  contractType: true,
  folderId: true,
  retentionPeriod: true,
  retentionPeriodDescription: true,
  retentionPeriodDuration: true,
});

export type TContracts = z.infer<typeof ZContractsSchema>;

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
