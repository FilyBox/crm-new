import type { AllMusic, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

import { prisma } from '@documenso/prisma';

import { type FindResultResponse } from '../../types/search-params';

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindAllMusicOptions = {
  userId: number;
  teamId?: number;
  page?: number;
  artistIds?: number[];
  agregadoraIds?: number[];
  recordLabelIds?: number[];
  perPage?: number;
  orderBy?: {
    column: keyof AllMusic;
    direction: 'asc' | 'desc';
  };
  where?: Prisma.AllMusicWhereInput;
  period?: PeriodSelectorValue;
  query?: string;
};

export const findAllMusic = async ({
  userId,
  teamId,
  page = 1,
  perPage = 10,
  where,
  orderBy,
  artistIds,
  period,
  agregadoraIds,
  recordLabelIds,
}: FindAllMusicOptions) => {
  const team = await prisma.team.findFirstOrThrow({
    where: {
      id: teamId,
    },
    include: {
      teamEmail: true,
    },
  });

  const orderByColumn = orderBy?.column ?? 'publishedAt';
  const orderByDirection = orderBy?.direction ?? 'desc';

  let Filter: Prisma.AllMusicWhereInput = {
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

  const whereAndClause: Prisma.AllMusicWhereInput['AND'] = [{ ...Filter }, { ...where }];

  const whereClause: Prisma.AllMusicWhereInput = {
    AND: whereAndClause,
  };

  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);
    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');
    whereClause.createdAt = {
      gte: startOfPeriod.toJSDate(),
    };
  }

  if (artistIds && artistIds.length > 0) {
    whereClause.artists = {
      some: {
        id: {
          in: artistIds,
        },
      },
    };
  }

  if (recordLabelIds && recordLabelIds.length > 0) {
    whereClause.recordLabelId = {
      in: recordLabelIds,
    };
  }

  if (agregadoraIds && agregadoraIds.length > 0) {
    whereClause.agregadoraId = {
      in: agregadoraIds,
    };
  }

  const [data, count] = await Promise.all([
    prisma.allMusic.findMany({
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
        distribuidor: {
          select: {
            name: true,
            id: true,
          },
        },

        agregadora: {
          select: {
            name: true,
            id: true,
          },
        },
        videoLinks: {
          select: {
            id: true,
            url: true,
            name: true,
          },
        },
        generalLinks: {
          select: {
            id: true,
            url: true,
            name: true,
          },
        },
        recordLabel: {
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
    prisma.allMusic.count({
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
