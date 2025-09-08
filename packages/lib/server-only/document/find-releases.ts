import type { Prisma, Releases } from '@prisma/client';
import { DateTime } from 'luxon';
import { match } from 'ts-pattern';

import { prisma } from '@documenso/prisma';
import { ExtendedRelease, ExtendedReleaseType } from '@documenso/prisma/types/extended-release';

import { type FindResultResponse } from '../../types/search-params';

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindReleaseOptions = {
  userId: number;
  teamId?: number;
  page?: number;
  artistIds?: number[];

  perPage?: number;
  orderBy?: {
    column: keyof Releases;
    direction: 'asc' | 'desc';
  };
  type?: ExtendedReleaseType;
  where?: Prisma.ReleasesWhereInput;
  release?: ExtendedRelease;
  period?: PeriodSelectorValue;
  query?: string;
};

export const findRelease = async ({
  userId,
  teamId,
  release = ExtendedRelease.ALL,
  type = ExtendedReleaseType.ALL,
  page = 1,
  perPage = 10,
  where,
  orderBy,
  artistIds,
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

  const orderByColumn = orderBy?.column ?? 'createdAt';
  const orderByDirection = orderBy?.direction ?? 'desc';

  const searchFilter: Prisma.ReleasesWhereInput = {
    OR: [
      { lanzamiento: { contains: query, mode: 'insensitive' } },
      { artist: { contains: query, mode: 'insensitive' } },
    ],
  };

  let filters: Prisma.ReleasesWhereInput | null = findReleasesFilter(release);
  filters = findReleasesTypeFilter(type);
  if (filters === null) {
    return {
      data: [],
      count: 0,
      currentPage: 1,
      perPage,
      totalPages: 0,
    };
  }

  let Filter: Prisma.ReleasesWhereInput = {
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

  const whereAndClause: Prisma.ReleasesWhereInput['AND'] = [
    { ...filters },
    { ...searchFilter },
    { ...Filter },
    { ...where },
  ];

  const whereClause: Prisma.ReleasesWhereInput = {
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

  const [data, count] = await Promise.all([
    prisma.releases.findMany({
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
    prisma.releases.count({
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

const findReleasesTypeFilter = (type: ExtendedReleaseType) => {
  return match<ExtendedReleaseType, Prisma.ReleasesWhereInput>(type)
    .with(ExtendedReleaseType.ALL, () => ({
      OR: [],
    }))
    .with(ExtendedReleaseType.Album, () => ({
      typeOfRelease: ExtendedReleaseType.Album,
    }))
    .with(ExtendedReleaseType.EP, () => ({
      typeOfRelease: ExtendedReleaseType.EP,
    }))
    .with(ExtendedReleaseType.Sencillo, () => ({
      typeOfRelease: ExtendedReleaseType.Sencillo,
    }))
    .exhaustive();
};

const findReleasesFilter = (release: ExtendedRelease) => {
  return match<ExtendedRelease, Prisma.ReleasesWhereInput>(release)
    .with(ExtendedRelease.ALL, () => ({
      OR: [],
    }))
    .with(ExtendedRelease.Focus, () => ({
      release: ExtendedRelease.Focus,
    }))
    .with(ExtendedRelease.Soft, () => ({
      release: ExtendedRelease.Soft,
    }))
    .exhaustive();
};
