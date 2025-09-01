import type { Prisma, tuStreams } from '@prisma/client';
import { TypeOfTuStreams } from '@prisma/client';
import { DateTime } from 'luxon';
import { match } from 'ts-pattern';

import { prisma } from '@documenso/prisma';

export const ExtendedTuStreamsType = {
  ...TypeOfTuStreams,

  ALL: 'ALL',
} as const;

export type ExtendedTuStreamsType =
  (typeof ExtendedTuStreamsType)[keyof typeof ExtendedTuStreamsType];

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindTuStreamsOptions = {
  userId: number;
  teamId: number;
  artistIds?: number[];
  orderBy?: {
    column: keyof tuStreams;
    direction: 'asc' | 'desc';
  };
  type?: ExtendedTuStreamsType;
  where?: Prisma.tuStreamsWhereInput;
  period?: PeriodSelectorValue;
  query?: string;
};

export const findAllTuStreams = async ({
  userId,
  teamId,
  type = ExtendedTuStreamsType.ALL,
  where,
  orderBy,
  artistIds,
  period,
  query,
}: FindTuStreamsOptions) => {
  const team = await prisma.team.findFirstOrThrow({
    where: {
      id: teamId,
    },
    include: {
      teamEmail: true,
    },
  });

  const orderByColumn = orderBy?.column ?? 'createdAt';
  const orderByDirection = orderBy?.direction ?? 'desc';

  // const searchFilter: Prisma.tuStreamsWhereInput = {
  //   OR: [
  //     { title: { contains: query, mode: 'insensitive' } },
  //     { UPC: { contains: query, mode: 'insensitive' } },
  //     { artist: { contains: query, mode: 'insensitive' } },
  //   ],
  // };

  const filters: Prisma.tuStreamsWhereInput | null = findTuStreamsTypeFilter(type);

  if (filters === null) {
    return {
      data: [],
    };
  }

  let Filter: Prisma.tuStreamsWhereInput = {
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

  const whereAndClause: Prisma.tuStreamsWhereInput['AND'] = [
    { ...filters },
    // { ...searchFilter },
    { ...Filter },
    { ...where },
  ];

  const whereClause: Prisma.tuStreamsWhereInput = {
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
    whereClause.tuStreamsArtists = {
      some: {
        artistId: {
          in: artistIds,
        },
      },
    };
  }

  const [data] = await Promise.all([
    prisma.tuStreams.findMany({
      where: whereClause,
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
  ]);

  return { data };
};
const findTuStreamsTypeFilter = (type: ExtendedTuStreamsType) => {
  return match<ExtendedTuStreamsType, Prisma.tuStreamsWhereInput>(type)
    .with(ExtendedTuStreamsType.ALL, () => ({}))
    .with(ExtendedTuStreamsType.Sencillo, () => ({
      type: 'Sencillo',
    }))
    .with(ExtendedTuStreamsType.Album, () => ({
      type: 'Album',
    }))
    .with(ExtendedTuStreamsType.Single, () => ({
      type: 'Single',
    }))
    .with(ExtendedTuStreamsType.EP, () => ({
      type: 'EP',
    }))
    .exhaustive();
};
