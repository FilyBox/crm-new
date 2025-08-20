import { TaskPriority } from '@prisma/client';

export const ExtendedTaskPriority = {
  ...TaskPriority,
  ALL: 'ALL',
} as const;

export type ExtendedTaskPriority = (typeof ExtendedTaskPriority)[keyof typeof ExtendedTaskPriority];
