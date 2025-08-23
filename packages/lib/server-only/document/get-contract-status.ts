import type { TeamMemberRole } from '@prisma/client';
import type { Prisma, User } from '@prisma/client';
import { DateTime } from 'luxon';

import type { PeriodSelectorValue } from '@documenso/lib/server-only/document/find-documents';
import { prisma } from '@documenso/prisma';
import { isExtendedContractsStatus } from '@documenso/prisma/guards/is-extended-contracts-status';
import { ExtendedContractStatus } from '@documenso/prisma/types/extended-contracts';

export type GetContractsInput = {
  user: User;
  folderId?: string;
  teamId: number;
  team?: Omit<GetTeamCountsOption, 'createdAt'>;
  period?: PeriodSelectorValue;
  search?: string;
};

export const getContractStatus = async ({
  user,
  period,
  folderId,
  teamId,
  search = '',
  ...options
}: GetContractsInput) => {
  let createdAt: Prisma.ContractWhereInput['createdAt'];
  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);

    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');

    createdAt = {
      gte: startOfPeriod.toJSDate(),
    };
  }

  // const [ownerCounts, notSignedCounts, hasSignedCounts] = await (options.team
  //   ? getTeamCounts({
  //       ...options.team,
  //       createdAt,
  //       currentUserEmail: user.email,
  //       userId: user.id,
  //       search,
  //     })
  //   : getCounts({ user, createdAt, search }));
  const [types] = await getCounts({
    user,
    teamId,
    folderId,
    search,
  });
  const typeCounts: Record<ExtendedContractStatus, number> = {
    [ExtendedContractStatus.FINALIZADO]: 0,
    [ExtendedContractStatus.VIGENTE]: 0,
    [ExtendedContractStatus.NO_ESPECIFICADO]: 0,
    [ExtendedContractStatus.ALL]: 0,
  };

  types.forEach((stat) => {
    if (isExtendedContractsStatus(stat.status)) {
      typeCounts[stat.status] = stat._count._all;
    }
  });

  // notSignedCounts.forEach((stat) => {
  //   typeCounts[ExtendedContractStatus.Album] += stat._count._all;

  //   if (
  //     isExtendedContractStatus(stat.typeOfRelease) &&
  //     stat.typeOfRelease === ExtendedContractStatus.EP
  //   ) {
  //     typeCounts[ExtendedContractStatus.EP] += stat._count._all;
  //   }
  // });

  // hasSignedCounts.forEach((stat) => {
  //   if (isExtendedContractStatus(stat.typeOfRelease)) {
  //     if (stat.typeOfRelease === ExtendedContractStatus.Sencillo) {
  //       typeCounts[ExtendedContractStatus.Sencillo] += stat._count._all;
  //     }

  //     if (stat.typeOfRelease === ExtendedContractStatus.Album) {
  //       typeCounts[ExtendedContractStatus.Album] += stat._count._all;
  //     }

  //     if (stat.typeOfRelease === ExtendedContractStatus.EP) {
  //       typeCounts[ExtendedContractStatus.EP] += stat._count._all;
  //     }
  //   }
  // });

  Object.keys(typeCounts).forEach((key) => {
    if (key !== ExtendedContractStatus.ALL && isExtendedContractsStatus(key)) {
      typeCounts[ExtendedContractStatus.ALL] += typeCounts[key];
    }
  });

  return typeCounts;
};

export type GetCountsOption = {
  user: User;
  // createdAt: Prisma.ContractWhereInput['createdAt'];
  search?: string;
  period?: PeriodSelectorValue;

  teamId?: number;
  folderId?: string | null;
};

const getCounts = async ({ user, period, search, folderId, teamId }: GetCountsOption) => {
  const searchFilter: Prisma.ContractWhereInput = {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { fileName: { contains: search, mode: 'insensitive' } },
      { artists: { contains: search, mode: 'insensitive' } },
    ],
  };

  return Promise.all([
    prisma.contract.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
      where: {
        OR: [
          {
            status: ExtendedContractStatus.FINALIZADO,
          },
          {
            status: ExtendedContractStatus.VIGENTE,
          },
          {
            status: ExtendedContractStatus.NO_ESPECIFICADO,
          },
        ],
        AND: [
          { teamId },
          { deletedAt: null },
          ...(searchFilter ? [searchFilter] : []),
          ...(folderId ? [{ folderId }] : []),
        ],
      },
    }),
  ]);
};

type GetTeamCountsOption = {
  teamId: number;
  teamEmail?: string;
  senderIds?: number[];
  currentUserEmail: string;
  userId: number;
  createdAt: Prisma.ContractWhereInput['createdAt'];
  currentTeamMemberRole?: TeamMemberRole;
  search?: string;
};

const getTeamCounts = async (options: GetTeamCountsOption) => {
  const { createdAt, teamId, teamEmail } = options;

  const senderIds = options.senderIds ?? [];

  const userIdWhereClause: Prisma.ContractWhereInput['userId'] =
    senderIds.length > 0
      ? {
          in: senderIds,
        }
      : undefined;

  const searchFilter: Prisma.ContractWhereInput = {
    OR: [{ title: { contains: options.search, mode: 'insensitive' } }],
  };

  let ownerCountsWhereInput: Prisma.ContractWhereInput = {
    userId: userIdWhereClause,
    createdAt,
    teamId,
  };

  let notSignedCountsGroupByArgs = null;
  let hasSignedCountsGroupByArgs = null;

  ownerCountsWhereInput = {
    ...ownerCountsWhereInput,
    ...searchFilter,
  };

  if (teamEmail) {
    ownerCountsWhereInput = {
      userId: userIdWhereClause,
      createdAt,
      OR: [
        {
          teamId,
        },
        {
          user: {
            email: teamEmail,
          },
        },
      ],
    };

    notSignedCountsGroupByArgs = {
      by: ['status'],
      _count: {
        _all: true,
      },
      where: {
        userId: userIdWhereClause,
        createdAt,
        status: ExtendedContractStatus.NO_ESPECIFICADO,
      },
    } satisfies Prisma.ContractGroupByArgs;

    hasSignedCountsGroupByArgs = {
      by: ['status'],
      _count: {
        _all: true,
      },
      where: {
        userId: userIdWhereClause,
        createdAt,
        OR: [
          {
            status: ExtendedContractStatus.VIGENTE,
          },
          {
            status: ExtendedContractStatus.FINALIZADO,
          },
        ],
      },
    } satisfies Prisma.ContractGroupByArgs;
  }

  return Promise.all([
    prisma.contract.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
      where: ownerCountsWhereInput,
    }),
    notSignedCountsGroupByArgs ? prisma.contract.groupBy(notSignedCountsGroupByArgs) : [],
    hasSignedCountsGroupByArgs ? prisma.contract.groupBy(hasSignedCountsGroupByArgs) : [],
  ]);
};
