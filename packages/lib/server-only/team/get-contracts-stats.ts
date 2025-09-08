import { ContractStatus } from '@prisma/client';

import { prisma } from '@documenso/prisma';

export const getContractsStats = async (teamId?: number) => {
  if (!teamId) {
    return {
      TOTAL_CONTRACTS: 0,
      [ContractStatus.FINALIZADO]: 0,
      [ContractStatus.NO_ESPECIFICADO]: 0,
      [ContractStatus.VIGENTE]: 0,
      data: [],
    };
  }

  const results = await prisma.contract.groupBy({
    by: ['status'],
    _count: true,
    where: {
      teamId,
    },
  });

  const data = await prisma.contract.findMany({
    where: {
      teamId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const stats = {
    TOTAL_CONTRACTS: 0,
    [ContractStatus.FINALIZADO]: 0,
    [ContractStatus.NO_ESPECIFICADO]: 0,
    [ContractStatus.VIGENTE]: 0,
    data: data,
  };

  results.forEach((result) => {
    const { status, _count } = result;

    if (status !== null) {
      stats[status] += _count;
    }

    stats.TOTAL_CONTRACTS += _count;
  });

  return stats;
};
