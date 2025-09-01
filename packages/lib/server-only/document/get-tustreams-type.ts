import type { TeamMemberRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { TypeOfTuStreams } from '@prisma/client';
import { DateTime } from 'luxon';

import { prisma } from '@documenso/prisma';

import type { PeriodSelectorValue } from './find-tuStreams';

export const isExtendedTuStreamsType = (value: unknown): value is ExtendedTuStreamsType => {
  if (typeof value !== 'string') {
    return false;
  }

  // We're using the assertion for a type-guard so it's safe to ignore the eslint warning
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return Object.values(ExtendedTuStreamsType).includes(value as ExtendedTuStreamsType);
};

export const ExtendedTuStreamsType = {
  ...TypeOfTuStreams,

  ALL: 'ALL',
} as const;

export type ExtendedTuStreamsType =
  (typeof ExtendedTuStreamsType)[keyof typeof ExtendedTuStreamsType];

export type GetTuStreamsType = {
  team?: Omit<GetTeamCountsOption, 'createdAt'>;
  teamId?: number;
  period?: PeriodSelectorValue;
  search?: string;
  artistIds?: number[];
};

export const getTuStreamsType = async ({
  period,
  artistIds,
  search = '',
  teamId,
  ...options
}: GetTuStreamsType) => {
  let createdAt: Prisma.tuStreamsWhereInput['createdAt'];

  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);

    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');

    createdAt = {
      gte: startOfPeriod.toJSDate(),
    };
  }

  const [types] = await getCounts({
    createdAt,
    search,
    artistIds,
    teamId: teamId,
  });

  const typeCounts: Record<ExtendedTuStreamsType, number> = {
    [ExtendedTuStreamsType.Album]: 0,
    [ExtendedTuStreamsType.EP]: 0,
    [ExtendedTuStreamsType.Sencillo]: 0,
    [ExtendedTuStreamsType.Single]: 0,
    [ExtendedTuStreamsType.ALL]: 0,
  };

  types.forEach((stat) => {
    if (isExtendedTuStreamsType(stat.type)) {
      typeCounts[stat.type] = stat._count._all;
    }
  });

  Object.keys(typeCounts).forEach((key) => {
    if (key !== ExtendedTuStreamsType.ALL && isExtendedTuStreamsType(key)) {
      typeCounts[ExtendedTuStreamsType.ALL] += typeCounts[key];
    }
  });

  return typeCounts;
};

type GetCountsOption = {
  createdAt: Prisma.tuStreamsWhereInput['createdAt'];
  search?: string;
  teamId?: number;
  folderId?: string | null;
  artistIds?: number[];
};

const getCounts = async ({ artistIds, search, teamId, createdAt }: GetCountsOption) => {
  const searchFilter: Prisma.tuStreamsWhereInput = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { UPC: { contains: search, mode: 'insensitive' } },
          { artist: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  return Promise.all([
    prisma.tuStreams.groupBy({
      by: ['type'],
      _count: {
        _all: true,
      },
      where: {
        OR: [
          {
            type: ExtendedTuStreamsType.EP,
          },
          {
            type: ExtendedTuStreamsType.Sencillo,
          },
          {
            type: ExtendedTuStreamsType.Album,
          },
          {
            type: ExtendedTuStreamsType.Single,
          },
        ],
        ...(artistIds?.length
          ? {
              artists: {
                some: {
                  id: {
                    in: artistIds,
                  },
                },
              },
            }
          : {}),
        ...(createdAt ? { createdAt } : {}),
        AND: [{ teamId: teamId }, ...(search ? [searchFilter] : [])],
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
  createdAt: Prisma.tuStreamsWhereInput['createdAt'];
  currentTeamMemberRole?: TeamMemberRole;
  search?: string;
};

const getTeamCounts = async (options: GetTeamCountsOption) => {
  const { createdAt, teamId, teamEmail, search } = options;

  const senderIds = options.senderIds ?? [];

  const userIdWhereClause: Prisma.tuStreamsWhereInput['userId'] =
    senderIds.length > 0
      ? {
          in: senderIds,
        }
      : undefined;

  const searchFilter: Prisma.tuStreamsWhereInput = search
    ? {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          { UPC: { contains: options.search, mode: 'insensitive' } },
          { artist: { contains: options.search, mode: 'insensitive' } },
        ],
      }
    : {};

  let ownerCountsWhereInput: Prisma.tuStreamsWhereInput = {
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
      by: ['type'],
      _count: {
        _all: true,
      },
      where: {
        userId: userIdWhereClause,
        createdAt,
        type: ExtendedTuStreamsType.Sencillo,
      },
    } satisfies Prisma.tuStreamsGroupByArgs;

    hasSignedCountsGroupByArgs = {
      by: ['type'],
      _count: {
        _all: true,
      },
      where: {
        userId: userIdWhereClause,
        createdAt,
        OR: [
          {
            type: ExtendedTuStreamsType.EP,
          },
          {
            type: ExtendedTuStreamsType.Album,
          },
          {
            type: ExtendedTuStreamsType.Single,
          },
        ],
      },
    } satisfies Prisma.tuStreamsGroupByArgs;
  }

  return Promise.all([
    prisma.tuStreams.groupBy({
      by: ['type'],
      _count: {
        _all: true,
      },
      where: ownerCountsWhereInput,
    }),
    notSignedCountsGroupByArgs ? prisma.tuStreams.groupBy(notSignedCountsGroupByArgs) : [],
    hasSignedCountsGroupByArgs ? prisma.tuStreams.groupBy(hasSignedCountsGroupByArgs) : [],
  ]);
};
