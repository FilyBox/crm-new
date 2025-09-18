import type { TeamMemberRole } from '@prisma/client';
import type { Prisma, User } from '@prisma/client';
import { TaskStatus } from '@prisma/client';
import { DateTime } from 'luxon';

import type { PeriodSelectorValue } from '@documenso/lib/server-only/document/find-documents';
import { prisma } from '@documenso/prisma';
import { isExtendedTaskPriority } from '@documenso/prisma/guards/is-extended-task-priority';
import { ExtendedTaskPriority } from '@documenso/prisma/types/extended-task-priority';

export type GetStatsInput = {
  user: Pick<User, 'id' | 'email'>;
  teamId: number;
  period?: PeriodSelectorValue;
  search?: string;
  where?: Prisma.TaskWhereInput;
};

export const getStats = async ({ user, period, where, search = '', ...options }: GetStatsInput) => {
  let createdAt: Prisma.TaskWhereInput['createdAt'];

  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);

    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');

    createdAt = {
      gte: startOfPeriod.toJSDate(),
    };
  }
  const [ownerCounts, notCompletedCounts, completedCounts] = await getTeamCounts({
    teamId: options.teamId,
    createdAt,
    currentUserEmail: user.email,
    userId: user.id,
    search,
    where,
  });

  const stats: Record<ExtendedTaskPriority, number> = {
    [ExtendedTaskPriority.LOW]: 0,
    [ExtendedTaskPriority.MEDIUM]: 0,
    [ExtendedTaskPriority.HIGH]: 0,
    [ExtendedTaskPriority.CRITICAL]: 0,
    [ExtendedTaskPriority.ALL]: 0,
  };

  ownerCounts.forEach((stat) => {
    stats[stat.priority as ExtendedTaskPriority] = stat._count._all;
  });

  Object.keys(stats).forEach((key) => {
    if (key !== ExtendedTaskPriority.ALL && isExtendedTaskPriority(key)) {
      stats[ExtendedTaskPriority.ALL] += stats[key as ExtendedTaskPriority];
    }
  });

  return stats;
};

type GetCountsOption = {
  user: User;
  createdAt: Prisma.TaskWhereInput['createdAt'];
  search?: string;
  where?: Prisma.TaskWhereInput;
};

type GetTeamCountsOption = {
  teamId: number;
  teamEmail?: string;
  asignedIds?: number[];
  currentUserEmail: string;
  userId: number;
  createdAt: Prisma.TaskWhereInput['createdAt'];
  currentTeamMemberRole?: TeamMemberRole;
  search?: string;
  where?: Prisma.TaskWhereInput;
};

const getTeamCounts = async (options: GetTeamCountsOption) => {
  const { createdAt, teamId, teamEmail } = options;

  const asignedIds = options.asignedIds ?? [];

  const userIdWhereClause: Prisma.TaskWhereInput['userId'] =
    asignedIds.length > 0
      ? {
          in: asignedIds,
        }
      : undefined;

  const searchFilter: Prisma.TaskWhereInput = options.search
    ? {
        OR: [
          { title: { contains: options.search, mode: 'insensitive' } },
          // { priority: { equals: options.search.toUpperCase() as any } },
        ],
      }
    : {};

  let ownerCountsWhereInput: Prisma.TaskWhereInput = {
    userId: userIdWhereClause,
    createdAt,
    teamId,
    deletedAt: null,
  };

  let notCompletedCountsGroupByArgs = null;
  let completedCountsGroupByArgs = null;

  ownerCountsWhereInput = {
    ...ownerCountsWhereInput,
    ...options.where,
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
      deletedAt: null,
      ...searchFilter,
    };

    notCompletedCountsGroupByArgs = {
      by: ['status'],
      _count: {
        _all: true,
      },
      where: {
        userId: userIdWhereClause,
        createdAt,
        status: {
          in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
        },
        deletedAt: null,
        ...searchFilter,
      },
    } satisfies Prisma.TaskGroupByArgs;

    completedCountsGroupByArgs = {
      by: ['status'],
      _count: {
        _all: true,
      },
      where: {
        userId: userIdWhereClause,
        createdAt,
        status: TaskStatus.COMPLETED,
        deletedAt: null,
        ...searchFilter,
      },
    } satisfies Prisma.TaskGroupByArgs;
  }

  return Promise.all([
    prisma.task.groupBy({
      by: ['priority'],
      _count: {
        _all: true,
      },
      where: ownerCountsWhereInput,
    }),
    notCompletedCountsGroupByArgs ? prisma.task.groupBy(notCompletedCountsGroupByArgs) : [],
    completedCountsGroupByArgs ? prisma.task.groupBy(completedCountsGroupByArgs) : [],
  ]);
};
