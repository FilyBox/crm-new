import { ContractStatus, ExpansionPossibility } from '@prisma/client';

export const ExtendedContractStatus = {
  ...ContractStatus,
  ALL: 'ALL',
} as const;

export const ExtendedExpansionPossibility = {
  ...ExpansionPossibility,
  ALL: 'ALL',
} as const;

export type ExtendedExpansionPossibility =
  (typeof ExtendedExpansionPossibility)[keyof typeof ExtendedExpansionPossibility];

export type ExtendedContractStatus =
  (typeof ExtendedContractStatus)[keyof typeof ExtendedContractStatus];
export type ExtendedContractStatusType =
  (typeof ExtendedContractStatus)[keyof typeof ExtendedContractStatus];
