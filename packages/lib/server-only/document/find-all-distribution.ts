import type { DistributionStatement, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

import { prisma } from '@documenso/prisma';

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindReleaseOptions = {
  userId: number;
  teamId: number;
  orderBy?: {
    column: keyof DistributionStatement;
    direction: 'asc' | 'desc';
  };
  where?: Prisma.DistributionStatementWhereInput;
  period?: PeriodSelectorValue;
  query?: string;
  platformIds?: number[];
  territoryIds?: number[];
};

export const findAllDistribution = async ({
  userId,
  teamId,
  where,
  orderBy,
  period,
  platformIds,
  territoryIds,
}: FindReleaseOptions) => {
  const team = await prisma.team.findFirstOrThrow({
    where: {
      id: teamId,
    },
    include: {
      teamEmail: true,
    },
  });

  const orderByColumn = orderBy?.column ?? 'id';
  const orderByDirection = orderBy?.direction ?? 'asc';

  // const searchFilter: Prisma.DistributionStatementWhereInput = {
  //   OR: [
  //     { proyecto: { contains: query, mode: 'insensitive' } },
  //     { isrc: { contains: query, mode: 'insensitive' } },
  //     { marketingOwner: { contains: query, mode: 'insensitive' } },
  //     { nombreDistribucion: { contains: query, mode: 'insensitive' } },
  //     { numeroDeCatalogo: { contains: query, mode: 'insensitive' } },
  //     { tituloCatalogo: { contains: query, mode: 'insensitive' } },
  //     { proyecto: { contains: query, mode: 'insensitive' } },
  //     { tipoDeIngreso: { contains: query, mode: 'insensitive' } },
  //   ],
  // };

  let Filter: Prisma.DistributionStatementWhereInput = {
    AND: {
      OR: [
        {
          userId,
        },
      ],
    },
  };

  Filter = {
    AND: {
      OR: team.teamEmail
        ? [
            {
              teamId: team.id,
            },
            {
              user: {
                email: team.teamEmail.email,
              },
            },
          ]
        : [
            {
              teamId: team.id,
            },
          ],
    },
  };

  const whereAndClause: Prisma.DistributionStatementWhereInput['AND'] = [
    // { ...filters },
    // { ...searchFilter },
    { ...Filter },
    { ...where },
  ];

  const whereClause: Prisma.DistributionStatementWhereInput = {
    AND: whereAndClause,
  };

  if (platformIds && platformIds.length > 0) {
    whereClause.distributionStatementMusicPlatforms = {
      some: {
        platformId: {
          in: platformIds,
        },
      },
    };
  }

  if (territoryIds && territoryIds.length > 0) {
    whereClause.distributionStatementTerritories = {
      some: {
        territoryId: {
          in: territoryIds,
        },
      },
    };
  }

  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);
    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');
    whereClause.createdAt = {
      gte: startOfPeriod.toISO(),
    };
  }

  const [data] = await Promise.all([
    prisma.distributionStatement.findMany({
      where: whereClause,
      include: {
        distributionStatementMusicPlatforms: true,
        distributionStatementTerritories: true,
      },
      orderBy: {
        [orderByColumn]: orderByDirection,
      },
    }),
  ]);

  return {
    data: data,
  };
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
