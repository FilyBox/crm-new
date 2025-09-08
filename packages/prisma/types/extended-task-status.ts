import { TaskStatus } from '@prisma/client';

export const ExtendedTaskStatus = {
  ...TaskStatus,
  ALL: 'ALL',
} as const;

export type ExtendedTaskStatus = (typeof ExtendedTaskStatus)[keyof typeof ExtendedTaskStatus];
