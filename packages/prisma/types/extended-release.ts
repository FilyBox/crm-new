import { Release, TypeOfRelease } from '@prisma/client';

export const ExtendedReleaseType = {
  ...TypeOfRelease,
  ALL: 'ALL',
} as const;

export const ExtendedRelease = {
  ...Release,
  ALL: 'ALL',
} as const;

export type ExtendedRelease = (typeof ExtendedRelease)[keyof typeof ExtendedRelease];

export type ExtendedReleaseType = (typeof ExtendedReleaseType)[keyof typeof ExtendedReleaseType];
