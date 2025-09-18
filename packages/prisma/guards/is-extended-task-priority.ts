import { ExtendedTaskPriority } from '@documenso/prisma/types/extended-task-priority';

export const isExtendedTaskPriority = (value: unknown): value is ExtendedTaskPriority => {
  if (typeof value !== 'string') {
    return false;
  }

  // We're using the assertion for a type-guard so it's safe to ignore the eslint warning
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return Object.values(ExtendedTaskPriority).includes(value as ExtendedTaskPriority);
};
