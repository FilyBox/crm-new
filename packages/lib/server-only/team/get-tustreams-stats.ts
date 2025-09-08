import { TypeOfTuStreams } from '@prisma/client';

import { prisma } from '@documenso/prisma';

export const getTuStreamsStats = async (teamId?: number) => {
  if (!teamId) {
    return {
      TOTAL_TUSTREAMS: 0,
      [TypeOfTuStreams.Album]: 0,
      [TypeOfTuStreams.EP]: 0,
      [TypeOfTuStreams.Sencillo]: 0,
      [TypeOfTuStreams.Single]: 0,
      TOTAL: 0,
      data: [],
    };
  }

  const results = await prisma.tuStreams.groupBy({
    by: ['type'],
    _count: true,
    where: {
      teamId,
    },
  });

  const data = await prisma.tuStreams.findMany({
    where: {
      teamId,
      total: {
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      type: true,
      total: true,
      UPC: true,
      createdAt: true,
    },
    orderBy: {
      total: 'desc',
    },
    take: 5,
  });

  const totalField = await prisma.tuStreams.aggregate({
    _sum: {
      total: true,
    },
    where: {
      teamId,
    },
  });

  const stats = {
    TOTAL_TUSTREAMS: 0,
    [TypeOfTuStreams.Album]: 0,
    [TypeOfTuStreams.EP]: 0,
    [TypeOfTuStreams.Sencillo]: 0,
    [TypeOfTuStreams.Single]: 0,
    TOTAL: totalField._sum.total || 0,
    data: data,
  };

  results.forEach((result) => {
    const { type, _count } = result;

    if (type !== null) {
      stats[type] += _count;
    }

    stats.TOTAL_TUSTREAMS += _count;
  });

  return stats;
};
