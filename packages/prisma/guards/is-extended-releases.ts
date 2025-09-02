import { ExtendedRelease } from '@documenso/prisma/types/extended-release';

export const isExtendedRelease = (value: unknown): value is ExtendedRelease => {
  if (typeof value !== 'string') {
    return false;
  }

  // We're using the assertion for a type-guard so it's safe to ignore the eslint warning
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return Object.values(ExtendedRelease).includes(value as ExtendedRelease);
};
