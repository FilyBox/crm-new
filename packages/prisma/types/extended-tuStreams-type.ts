import { TypeOfTuStreams } from '@prisma/client';

export const ExtendedTuStreamsType = {
  ...TypeOfTuStreams,

  ALL: 'ALL',
} as const;

export type ExtendedTuStreamsType =
  (typeof ExtendedTuStreamsType)[keyof typeof ExtendedTuStreamsType];
