import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';

export type GetDocumentByIdOptions = {
  contractId: number;
  userId: number;
  teamId?: number;
};

export const getContractById = async ({ contractId }: GetDocumentByIdOptions) => {
  console.log('contractId', contractId);

  const document = await prisma.contract.findFirst({
    where: {
      id: contractId,
      deletedAt: null,
    },
  });

  if (!document) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Contract could not be found',
    });
  }

  return document;
};

export type GetDocumentWhereInputOptions = {
  contractId: number;
  userId: number;
  teamId: number;

  /**
   * Whether to return a filter that allows access to both the user and team documents.
   * This only applies if `teamId` is passed in.
   *
   * If true, and `teamId` is passed in, the filter will allow both team and user documents.
   * If false, and `teamId` is passed in, the filter will only allow team documents.
   *
   * Defaults to false.
   */
  overlapUserTeamScope?: boolean;
};

/**
 * Generate the where input for a given Prisma document query.
 *
 * This will return a query that allows a user to get a document if they have valid access to it.
 */
