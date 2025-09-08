import { ExtendedContractStatus } from '@documenso/prisma/types/extended-contracts';

export const isExtendedContractsStatus = (value: unknown): value is ExtendedContractStatus => {
  if (typeof value !== 'string') {
    return false;
  }

  // We're using the assertion for a type-guard so it's safe to ignore the eslint warning
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return Object.values(ExtendedContractStatus).includes(value as ExtendedContractStatus);
};
