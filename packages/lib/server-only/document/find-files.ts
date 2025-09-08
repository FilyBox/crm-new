import type { Files, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';

import { prisma } from '@documenso/prisma';
import type { ExtendedDocumentStatus } from '@documenso/prisma/types/extended-document-status';

import { type FindResultResponse } from '../../types/search-params';
import { getTeamById } from '../team/get-team';

export type PeriodSelectorValue = '' | '7d' | '14d' | '30d';

export type FindDocumentsOptions = {
  userId: number;
  teamId: number;
  status?: ExtendedDocumentStatus;
  useToChat?: boolean;
  page?: number;
  perPage?: number;
  orderBy?: {
    column: keyof Files;
    direction: 'asc' | 'desc';
  };
  period?: PeriodSelectorValue;
  senderIds?: number[];
  query?: string;
  folderId?: string;
};

export const findFiles = async ({
  userId,
  teamId,
  page = 1,
  perPage = 10,
  orderBy,
  period,
  useToChat,
  senderIds,
  query = '',
  folderId,
}: FindDocumentsOptions) => {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
  });

  const orderByColumn = orderBy?.column ?? 'createdAt';
  const orderByDirection = orderBy?.direction ?? 'desc';
  const team = await getTeamById({ userId: user.id, teamId });

  const teamMemberRole = team.currentTeamRole;

  const searchFilter: Prisma.FilesWhereInput = {
    OR: [{ title: { contains: query, mode: 'insensitive' } }],
  };

  const deletedFilter: Prisma.FilesWhereInput = {
    AND: {
      OR: [
        {
          userId: user.id,
          deletedAt: null,
        },
      ],
    },
  };

  const whereAndClause: Prisma.FilesWhereInput['AND'] = [
    { ...deletedFilter },
    { ...searchFilter },
    { deletedAt: null },
  ];

  const whereClause: Prisma.FilesWhereInput = {
    AND: whereAndClause,
  };

  if (period) {
    const daysAgo = parseInt(period.replace(/d$/, ''), 10);

    const startOfPeriod = DateTime.now().minus({ days: daysAgo }).startOf('day');

    whereClause.createdAt = {
      gte: startOfPeriod.toJSDate(),
    };
  }

  if (senderIds && senderIds.length > 0) {
    whereClause.userId = {
      in: senderIds,
    };
  }

  if (folderId !== undefined) {
    whereClause.folderId = folderId;
  } else {
    whereClause.folderId = null;
  }

  const [data, count] = await Promise.all([
    prisma.files.findMany({
      where: whereClause,
      skip: Math.max(page - 1, 0) * perPage,
      take: perPage,
      orderBy: {
        [orderByColumn]: orderByDirection,
      },
      include: {
        documentData: true,

        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            url: true,
          },
        },
      },
    }),
    prisma.files.count({
      where: whereClause,
    }),
  ]);

  // const maskedData = data.map((document) =>
  //   maskRecipientTokensForDocument({
  //     document,
  //     user,
  //   }),
  // );

  return {
    data: data,
    count,
    currentPage: Math.max(page, 1),
    perPage,
    totalPages: Math.ceil(count / perPage),
  } satisfies FindResultResponse<typeof data>;
};
