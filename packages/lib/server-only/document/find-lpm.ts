import type { Prisma, lpm } from '@prisma/client';

import { prisma } from '@documenso/prisma';

import { type FindResultResponse } from '../../types/search-params';

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindReleaseOptions = {
  userId: number;
  teamId: number;
  page?: number;
  perPage?: number;
  orderBy?: {
    column: keyof lpm;
    direction: 'asc' | 'desc';
  };
  where?: Prisma.lpmWhereInput;
  period?: PeriodSelectorValue;
  query?: string;
  artistIds?: number[];
};

export const findLpm = async ({
  userId,
  teamId,
  page = 1,
  perPage = 10,
  where,
  orderBy,
  artistIds,
}: FindReleaseOptions) => {
  const team = await prisma.team.findFirstOrThrow({
    where: {
      id: teamId,
    },
    include: {
      teamEmail: true,
    },
  });
  const orderByColumn = orderBy?.column ?? 'productType';
  const orderByDirection = orderBy?.direction ?? 'asc';

  // const searchFilter: Prisma.lpmWhereInput = {
  //   OR: [{ productTitle: { contains: query, mode: 'insensitive' } }],
  // };

  let Filter: Prisma.lpmWhereInput = {
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

  const whereAndClause: Prisma.lpmWhereInput['AND'] = [
    // { ...filters },
    // { ...searchFilter },
    { ...Filter },
    { ...where },
  ];

  const whereClause: Prisma.lpmWhereInput = {
    AND: whereAndClause,
  };

  if (artistIds && artistIds.length > 0) {
    whereClause.artists = {
      some: {
        id: {
          in: artistIds,
        },
      },
    };
  }

  // if (period) {
  //   const daysAgo = parseInt(period.replace(/d$/, ''), 10);
  //   const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');
  //   whereClause.originalReleaseDate = {
  //     gte: startOfPeriod.toISO(),
  //   };
  // }

  const [data, count] = await Promise.all([
    prisma.lpm.findMany({
      where: whereClause,
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      include: {
        artists: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        [orderByColumn]: orderByDirection,
      },
    }),
    prisma.lpm.count({
      where: whereClause,
    }),
  ]);

  const dataWithArtists = data.map((release) => {
    return {
      ...release,
      productDisplayArtist: release.artists,
    };
  });

  return {
    data: dataWithArtists,
    count,
    currentPage: Math.max(page, 1),
    perPage,
    totalPages: Math.ceil(count / perPage),
  } satisfies FindResultResponse<typeof dataWithArtists>;
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
