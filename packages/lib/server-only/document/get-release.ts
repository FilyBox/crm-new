import type { TeamMemberRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

import type { PeriodSelectorValue } from '@documenso/lib/server-only/document/find-documents';
import { prisma } from '@documenso/prisma';
import { isExtendedRelease } from '@documenso/prisma/guards/is-extended-releases';
import { ExtendedRelease } from '@documenso/prisma/types/extended-release';

export type GetReleaseType = {
  team?: Omit<GetTeamCountsOption, 'createdAt'>;
  teamId: number;
  period?: PeriodSelectorValue;
  search?: string;
  artistIds?: number[];
  where: Prisma.ReleasesWhereInput;
};

export const getRelease = async ({
  period,
  artistIds,
  search = '',
  teamId,
  where,
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
    where,
  });

  const typeCounts: Record<ExtendedRelease, number> = {
    [ExtendedRelease.Focus]: 0,
    [ExtendedRelease.Soft]: 0,
    [ExtendedRelease.ALL]: 0,
  };

  types.forEach((stat) => {
    if (isExtendedRelease(stat.release)) {
      typeCounts[stat.release] = stat._count._all;
    }
  });

  Object.keys(typeCounts).forEach((key) => {
    if (key !== ExtendedRelease.ALL && isExtendedRelease(key)) {
      typeCounts[ExtendedRelease.ALL] += typeCounts[key as ExtendedRelease];
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
  where: Prisma.ReleasesWhereInput;
};

const getCounts = async ({ artistIds, teamId, where }: GetCountsOption) => {
  const team = await prisma.team.findFirstOrThrow({
    where: {
      id: teamId,
    },
    include: {
      teamEmail: true,
    },
  });

  const Filter = {
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

  where = {
    ...where,
    ...Filter,
    OR: [{ release: ExtendedRelease.Focus }, { release: ExtendedRelease.Soft }],
  };

  if (artistIds && artistIds.length > 0) {
    where.releasesArtists = {
      some: {
        artistId: {
          in: artistIds,
        },
      },
    };
  }

  return Promise.all([
    prisma.releases.groupBy({
      by: ['release'],
      _count: {
        _all: true,
      },
      where,
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
