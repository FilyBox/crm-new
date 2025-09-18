import type { Prisma, Task } from '@prisma/client';
import { TypeOfTuStreams } from '@prisma/client';
import { DateTime } from 'luxon';

import { prisma } from '@documenso/prisma';

import { type FindResultResponse } from '../../types/search-params';

export const ExtendedTuStreamsType = {
  ...TypeOfTuStreams,

  ALL: 'ALL',
} as const;

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindTaskOptions = {
  userId: number;
  teamId: number;
  page?: number;
  assigneeIds?: number[];
  perPage?: number;
  orderBy?: {
    column: keyof Task;
    direction: 'asc' | 'desc';
  };
  where?: Prisma.TaskWhereInput;
  period?: PeriodSelectorValue;
  query?: string;
};

export const findTasks = async ({
  userId,
  teamId,
  page = 1,
  perPage = 10,
  where,
  orderBy,
  assigneeIds,
  period,
  query,
}: FindTaskOptions) => {
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

  let Filter: Prisma.TaskWhereInput = {
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
  const whereAndClause: Prisma.TaskWhereInput['AND'] = [
    // { ...searchFilter },
    { ...Filter },
    { ...where },
  ];

  const whereClause: Prisma.TaskWhereInput = {
    AND: whereAndClause,
  };

  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);
    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');
    whereClause.createdAt = {
      gte: startOfPeriod.toJSDate(),
    };
  }

  if (assigneeIds && assigneeIds.length > 0) {
    whereClause.assignees = {
      some: {
        userId: {
          in: assigneeIds,
        },
      },
    };
  }

  const [data, count] = await Promise.all([
    prisma.task.findMany({
      where: whereClause,
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      include: {
        assignees: true,
        comments: true,
      },
      orderBy: {
        [orderByColumn]: orderByDirection,
      },
    }),
    prisma.task.count({
      where: whereClause,
    }),
    // getStats({ where: whereClause, user })
  ]);

  const taskAssignees = await prisma.taskAssignee.findMany({
    where: {
      taskId: { in: data.map((task) => task.id) },
    },
    select: {
      userId: false,
      taskId: true,
      assignedBy: false,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const tasksWithAssignees = data.map((task) => {
    const assignees = taskAssignees
      .filter((assignee) => assignee.taskId === task.id)
      .map((assignee) => assignee.user);
    return {
      ...task,
      enhancedAssignees: assignees.length > 0 ? assignees : [],
    };
  });

  return {
    data: tasksWithAssignees,
    count,
    currentPage: Math.max(page, 1),
    perPage,
    totalPages: Math.ceil(count / perPage),
  } satisfies FindResultResponse<typeof data>;
};
