import type { TeamMemberRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

import type { PeriodSelectorValue } from '@documenso/lib/server-only/document/find-documents';
import { prisma } from '@documenso/prisma';
import { isExtendedReleaseType } from '@documenso/prisma/guards/is-extended-releases-type';
import { ExtendedReleaseType } from '@documenso/prisma/types/extended-release';

export type GetReleaseType = {
  team?: Omit<GetTeamCountsOption, 'createdAt'>;
  teamId: number;
  period?: PeriodSelectorValue;
  search?: string;
  artistIds?: number[];
  where?: Prisma.ReleasesWhereInput;
};

export const getReleaseType = async ({
  period,
  artistIds,
  search = '',
  teamId,
  ...options
}: GetReleaseType) => {
  let createdAt: Prisma.ReleasesWhereInput['createdAt'];

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
    createdAt,
    search,
    artistIds,
    teamId: teamId,
  });

  const typeCounts: Record<ExtendedReleaseType, number> = {
    [ExtendedReleaseType.Album]: 0,
    [ExtendedReleaseType.EP]: 0,
    [ExtendedReleaseType.Sencillo]: 0,
    [ExtendedReleaseType.ALL]: 0,
  };

  types.forEach((stat) => {
    if (isExtendedReleaseType(stat.typeOfRelease)) {
      typeCounts[stat.typeOfRelease] = stat._count._all;
    }
  });

  // notSignedCounts.forEach((stat) => {
  //   typeCounts[ExtendedReleaseType.Album] += stat._count._all;

  //   if (
  //     isExtendedReleaseType(stat.typeOfRelease) &&
  //     stat.typeOfRelease === ExtendedReleaseType.EP
  //   ) {
  //     typeCounts[ExtendedReleaseType.EP] += stat._count._all;
  //   }
  // });

  // hasSignedCounts.forEach((stat) => {
  //   if (isExtendedReleaseType(stat.typeOfRelease)) {
  //     if (stat.typeOfRelease === ExtendedReleaseType.Sencillo) {
  //       typeCounts[ExtendedReleaseType.Sencillo] += stat._count._all;
  //     }

  //     if (stat.typeOfRelease === ExtendedReleaseType.Album) {
  //       typeCounts[ExtendedReleaseType.Album] += stat._count._all;
  //     }

  //     if (stat.typeOfRelease === ExtendedReleaseType.EP) {
  //       typeCounts[ExtendedReleaseType.EP] += stat._count._all;
  //     }
  //   }
  // });

  Object.keys(typeCounts).forEach((key) => {
    if (key !== ExtendedReleaseType.ALL && isExtendedReleaseType(key)) {
      typeCounts[ExtendedReleaseType.ALL] += typeCounts[key];
    }
  });

  return typeCounts;
};

type GetCountsOption = {
  createdAt: Prisma.ReleasesWhereInput['createdAt'];
  search?: string;
  teamId: number;
  folderId?: string | null;
  artistIds?: number[];
};

const getCounts = async ({ artistIds, search, teamId }: GetCountsOption) => {
  const searchFilter: Prisma.ReleasesWhereInput = {
    OR: [{ lanzamiento: { contains: search, mode: 'insensitive' } }],
  };

  return Promise.all([
    prisma.releases.groupBy({
      by: ['typeOfRelease'],
      _count: {
        _all: true,
      },
      where: {
        OR: [
          {
            typeOfRelease: ExtendedReleaseType.EP,
          },
          {
            typeOfRelease: ExtendedReleaseType.Sencillo,
          },
          {
            typeOfRelease: ExtendedReleaseType.Album,
          },
        ],
        ...(artistIds?.length
          ? {
              releasesArtists: {
                some: {
                  artistId: {
                    in: artistIds,
                  },
                },
              },
            }
          : {}),
        // ...(teamId ? { teamId } : { userId: user.id, teamId: null }),
        AND: [{ teamId: teamId }, ...(searchFilter ? [searchFilter] : [])],
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
  createdAt: Prisma.ReleasesWhereInput['createdAt'];
  currentTeamMemberRole?: TeamMemberRole;
  search?: string;
};

const getTeamCounts = async (options: GetTeamCountsOption) => {
  const { createdAt, teamId, teamEmail } = options;

  const senderIds = options.senderIds ?? [];

  const userIdWhereClause: Prisma.ReleasesWhereInput['userId'] =
    senderIds.length > 0
      ? {
          in: senderIds,
        }
      : undefined;

  const searchFilter: Prisma.ReleasesWhereInput = {
    OR: [{ lanzamiento: { contains: options.search, mode: 'insensitive' } }],
  };

  let ownerCountsWhereInput: Prisma.ReleasesWhereInput = {
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
      by: ['typeOfRelease'],
      _count: {
        _all: true,
      },
      where: {
        userId: userIdWhereClause,
        createdAt,
        typeOfRelease: ExtendedReleaseType.Sencillo,
      },
    } satisfies Prisma.ReleasesGroupByArgs;

    hasSignedCountsGroupByArgs = {
      by: ['typeOfRelease'],
      _count: {
        _all: true,
      },
      where: {
        userId: userIdWhereClause,
        createdAt,
        OR: [
          {
            typeOfRelease: ExtendedReleaseType.EP,
          },
          {
            typeOfRelease: ExtendedReleaseType.Album,
          },
        ],
      },
    } satisfies Prisma.ReleasesGroupByArgs;
  }

  return Promise.all([
    prisma.releases.groupBy({
      by: ['typeOfRelease'],
      _count: {
        _all: true,
      },
      where: ownerCountsWhereInput,
    }),
    notSignedCountsGroupByArgs ? prisma.releases.groupBy(notSignedCountsGroupByArgs) : [],
    hasSignedCountsGroupByArgs ? prisma.releases.groupBy(hasSignedCountsGroupByArgs) : [],
  ]);
};
