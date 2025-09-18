import { z } from 'zod';

import { TaskAssigneeSchema } from '@documenso/prisma/generated/zod/modelSchema/TaskAssigneeSchema';
import { TaskCommentSchema } from '@documenso/prisma/generated/zod/modelSchema/TaskCommentSchema';
import { TaskSchema } from '@documenso/prisma/generated/zod/modelSchema/TaskSchema';
import { TeamSchema } from '@documenso/prisma/generated/zod/modelSchema/TeamSchema';
import UserSchema from '@documenso/prisma/generated/zod/modelSchema/UserSchema';

const ZTaskAssigneeSchema = z.object({
  name: z.string().optional(),
  email: z.string(),
});

export const ZTaskSchema = TaskSchema.pick({
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
  listId: true,
  teamId: true,
}).extend({
  enhancedAssignees: z.array(ZTaskAssigneeSchema).optional(),
  assignees: z.array(
    TaskAssigneeSchema.pick({
      id: true,
      userId: true,
      taskId: true,
      assignedAt: true,
      assignedBy: true,
    }).extend({
      user: UserSchema.pick({
        id: true,
        name: true,
        email: true,
      }),
    }),
  ),
  comments: z.array(
    TaskCommentSchema.pick({
      id: true,
      userId: true,
      createdAt: true,
      updatedAt: true,
      taskId: true,
      content: true,
    }),
  ),
});

export type TTask = z.infer<typeof ZTaskSchema>;

/**
 * A lite version of the document response schema without relations.
 */
export const ZTaskLiteSchema = TaskSchema.pick({
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
  listId: true,
});

export type TTaskLite = z.infer<typeof ZTaskLiteSchema>;

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
  listId: true,
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

export type TTaskMany = z.infer<typeof ZTaskManySchema>;
