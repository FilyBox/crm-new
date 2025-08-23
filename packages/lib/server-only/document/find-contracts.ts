import type { Contract, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

import { prisma } from '@documenso/prisma';
import {
  ExtendedContractStatus,
  ExtendedExpansionPossibility,
} from '@documenso/prisma/types/extended-contracts';

import { type FindResultResponse } from '../../types/search-params';
import { getTeamById } from '../team/get-team';

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindReleaseOptions = {
  userId: number;
  status?: ExtendedContractStatus;
  expansion?: ExtendedExpansionPossibility;
  teamId: number;
  page?: number;
  folderId?: string;
  perPage?: number;
  orderBy?: {
    column: keyof Contract;
    direction: 'asc' | 'desc';
  };
  where?: Prisma.ContractWhereInput;
  period?: PeriodSelectorValue;
  query?: string;
};

export const findContracts = async ({
  userId,
  teamId,
  folderId,
  page = 1,
  perPage = 10,
  where,
  orderBy,
  status,
  expansion,
  period,

  query,
}: FindReleaseOptions) => {
  const team = await getTeamById({ userId, teamId });

  const orderByColumn = orderBy?.column ?? 'id';
  const orderByDirection = orderBy?.direction ?? 'asc';

  const searchFilter: Prisma.ContractWhereInput = {
    OR: [
      {
        fileName: { contains: query, mode: 'insensitive' },
        folderId: folderId || undefined,
      },

      {
        title: { contains: query, mode: 'insensitive' },
        folderId: folderId || undefined,
      },
      {
        artists: { contains: query, mode: 'insensitive' },
        folderId: folderId || undefined,
      },
    ],
  };

  // let filters: Prisma.ReleasesWhereInput | null = findReleasesFilter(release);
  // // filters = findReleasesTypeFilter(type);
  // if (filters === null) {
  //   return {
  //     data: [],
  //     count: 0,
  //     currentPage: 1,
  //     perPage,
  //     totalPages: 0,
  //   };
  // }

  let Filter: Prisma.ContractWhereInput = {
    AND: {
      OR: [
        {
          userId,
        },
      ],
      ...(folderId ? { folderId: folderId } : { folderId: null }),
    },
  };

  if (status && status !== ExtendedContractStatus.ALL) {
    Filter.status = status;
  }

  if (expansion && expansion !== ExtendedExpansionPossibility.ALL) {
    Filter.isPossibleToExpand = expansion;
  }
  const baseFilter = {
    teamId: team.id,
    ...(folderId ? { folderId: folderId } : { folderId: null }),
    ...(status && status !== ExtendedContractStatus.ALL ? { status } : {}),
  };

  Filter = {
    AND: {
      OR: team.teamEmail
        ? [
            baseFilter,
            {
              user: {
                email: team.teamEmail.email,
              },
            },
          ]
        : [baseFilter],
    },
  };

  const whereAndClause: Prisma.ContractWhereInput['AND'] = [
    // { ...filters },
    // { ...searchFilter },
    { ...Filter },
    { deletedAt: null },
    ...(where ? [where] : []),
  ];

  const whereClause: Prisma.ContractWhereInput = {
    AND: whereAndClause,
  };

  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);
    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');
    whereClause.createdAt = {
      gte: startOfPeriod.toISO(),
    };
  }

  const [data, count] = await Promise.all([
    prisma.contract.findMany({
      where: whereClause,
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      orderBy: {
        [orderByColumn]: orderByDirection,
      },
    }),
    prisma.contract.count({
      where: whereClause,
    }),
  ]);
  return {
    data: data,
    count,
    currentPage: Math.max(page, 1),
    perPage,
    totalPages: Math.ceil(count / perPage),
  } satisfies FindResultResponse<typeof data>;
};

/**
 * Create a Prisma filter for the Document schema to find documents for a team.
 *
 * Status All:
 *  - Documents that belong to the team
 *  - Documents that have been sent by the team email
 *  - Non draft documents that have been sent to the team email
 *
 * Status Inbox:
 *  - Non draft documents that have been sent to the team email that have not been signed
 *
 * Status Draft:
 * - Documents that belong to the team that are draft
 * - Documents that belong to the team email that are draft
 *
 * Status Pending:
 * - Documents that belong to the team that are pending
 * - Documents that have been sent by the team email that is pending to be signed by someone else
 * - Documents that have been sent to the team email that is pending to be signed by someone else
 *
 * Status Completed:
 * - Documents that belong to the team that are completed
 * - Documents that have been sent to the team email that are completed
 * - Documents that have been sent by the team email that are completed
 *
 * @param status The status of the documents to find.
 * @param team The team to find the documents for.
 * @returns A filter which can be applied to the Prisma Document schema.
 */
