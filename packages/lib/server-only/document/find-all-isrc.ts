import type { IsrcSongs, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

import { prisma } from '@documenso/prisma';

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindReleaseOptions = {
  userId: number;
  teamId: number;
  orderBy?: {
    column: keyof Omit<IsrcSongs, 'teamId' | 'userId'>;
    direction: 'asc' | 'desc';
  };
  where?: Prisma.IsrcSongsWhereInput;
  period?: PeriodSelectorValue;
  query?: string;
  artistIds?: number[];
};

export const findAllIsrc = async ({
  userId,
  teamId,
  artistIds,
  where,
  orderBy,
  period,

  query,
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

  let Filter: Prisma.IsrcSongsWhereInput = {
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

  const whereAndClause: Prisma.IsrcSongsWhereInput['AND'] = [{ ...Filter }, { ...where }];

  const whereClause: Prisma.IsrcSongsWhereInput = {
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

  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);
    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');
    whereClause.date = {
      gte: startOfPeriod.toISO(),
    };
  }

  const [data] = await Promise.all([
    prisma.isrcSongs.findMany({
      where: whereClause,
      orderBy: {
        [orderByColumn]: orderByDirection,
      },
      include: {
        artists: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return data;
};
