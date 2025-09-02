import { ExtendedReleaseType } from '@documenso/prisma/types/extended-release';

export const isExtendedReleaseType = (value: unknown): value is ExtendedReleaseType => {
  if (typeof value !== 'string') {
    return false;
  }

  // We're using the assertion for a type-guard so it's safe to ignore the eslint warning
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return Object.values(ExtendedReleaseType).includes(value as ExtendedReleaseType);
};
