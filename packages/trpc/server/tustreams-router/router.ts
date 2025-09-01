// import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';
import { TypeOfTuStreams } from '@prisma/client';
import { z } from 'zod';

import { findAllTuStreams } from '@documenso/lib/server-only/document/find-all-tuStreams';
import { findTuStreams } from '@documenso/lib/server-only/document/find-tuStreams';
import { type GetTuStreamsType } from '@documenso/lib/server-only/document/get-tustreams-type';
import { getTuStreamsType } from '@documenso/lib/server-only/document/get-tustreams-type';
import { getTuStreamsStats } from '@documenso/lib/server-only/team/get-tustreams-stats';
import { prisma } from '@documenso/prisma';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';

export const ExtendedTuStreamsType = {
  ...TypeOfTuStreams,

  ALL: 'ALL',
} as const;

export type ExtendedTuStreamsType =
  (typeof ExtendedTuStreamsType)[keyof typeof ExtendedTuStreamsType];

export type GetTuStreamsByIdOptions = {
  id: number;
  userId: number;
  teamId?: number;
};

export const tuStreamsRouter = router({
  createTuStreams: authenticatedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        UPC: z.string().optional(),
        artistsToUpdate: z.array(z.string()).optional(),

        artists: z
          .array(
            z.object({
              id: z.number(),
              artistName: z.string().nullable(),
            }),
          )
          .optional(),
        type: z.nativeEnum(TypeOfTuStreams).optional(),
        total: z.number().optional(),
        date: z.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { artistsToUpdate, artists, ...data } = input;
      return await prisma.tuStreams.create({
        data: {
          ...data,
          user: {
            connect: { id: userId },
          },
          team: { connect: { id: teamId } },
          artists: artistsToUpdate
            ? {
                connect: artistsToUpdate.map((artistId) => ({ id: Number(artistId) })),
              }
            : undefined,
        },
      });
    }),

  createManyTuStreams: authenticatedProcedure
    .input(
      z.object({
        tuStreams: z.array(
          z.object({
            title: z.string().optional(),
            UPC: z.string().optional(),
            artist: z.string().optional(),
            type: z.nativeEnum(TypeOfTuStreams).optional(),
            total: z.number().optional(),
            date: z.date().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { tuStreams } = input;
      console.log('Creating multiple tuStreams:', tuStreams.length);

      // Verify permissions if it's a team task
      if (teamId && ctx.teamId !== teamId) {
        throw new Error('No tienes permisos para crear tuStreams en este equipo');
      }

      // For large datasets, process in smaller chunks
      const BATCH_SIZE = 25; // Process 25 records at a time
      let totalCreated = 0;

      // Process tuStreams in batches to avoid transaction timeouts
      for (let i = 0; i < tuStreams.length; i += BATCH_SIZE) {
        const batch = tuStreams.slice(i, i + BATCH_SIZE);

        // Process each batch in its own transaction
        const result = await prisma.$transaction(
          async (tx) => {
            const createdTuStreams = [];

            for (const stream of batch) {
              console.log('Processing stream:', stream);
              // Normalize artist string for consistent processing
              const normalizedArtistString = (stream.artist || '')
                .replace(/\s+ft\.\s+/gi, ', ')
                .replace(/\s+&\s+/g, ', ');

              console.log('Normalized artist string:', normalizedArtistString);

              // Create arrays of artist data
              // const artistsData = normalizedArtistString
              //   .split(',')
              //   .filter((name) => name.trim() !== '')
              //   .map((artistName) => ({

              //     artists: {
              //       connectOrCreate: {
              //         where: { name: artistName.trim() },
              //         create: {
              //           name: artistName.trim(),
              //           user: { connect: { id: userId } },
              //           ...(teamId ? { team: { connect: { id: teamId } } } : {}),
              //         },
              //       },
              //     },
              //   }));

              // Create the tuStream with associated artists
              const tuStream = await tx.tuStreams.create({
                data: {
                  ...stream,
                  userId,
                  teamId,
                  artists: {
                    create: (normalizedArtistString?.split(',') || []).map((artistName) => ({
                      name: artistName.trim(),
                      user: {
                        connect: { id: userId },
                      },
                      team: { connect: { id: teamId } },
                    })),
                  },
                },
              });

              createdTuStreams.push(tuStream);
            }

            return createdTuStreams;
          },
          { timeout: 60000 }, // 60 second timeout for each batch
        );

        totalCreated += result.length;
        console.log(`Batch processed: ${i}-${i + batch.length}, created: ${result.length}`);
      }

      return totalCreated;
    }),

  findTuStreamsUniqueArtists: authenticatedProcedure.query(async ({ ctx }) => {
    const { user, teamId } = ctx;
    const userId = user.id;

    const uniqueArtists = await prisma.artist.findMany({
      where: {
        teamId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return uniqueArtists;
  }),

  findArtists: authenticatedProcedure.query(async ({ ctx }) => {
    const { user, teamId } = ctx;
    const userId = user.id;

    const artists = await prisma.artist.findMany({
      where: {
        teamId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return artists;
  }),

  findTuStreamsById: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }: { input: { id: string } }) => {
      const { id } = input;
      return await prisma.tuStreams.findUnique({
        where: { id: Number(id) },
        include: {
          user: true,
          team: true,
          tuStreamsArtists: true,
          artists: true,
        },
      });
    }),

  findTuStreams: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        type: z.nativeEnum(ExtendedTuStreamsType).optional(),
        orderBy: z.enum(['createdAt', 'updatedAt']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'date',
            'artist',
            'title',
            'UPC',
            'createdAt',
            'type',
            'total',
            'teamId',
            'userId',
          ])
          .optional(),
        filterStructure: z
          .array(
            z
              .custom<FilterStructure>(
                (val) => val === null || val === undefined || typeof val === 'object',
              )
              .optional()
              .nullable(),
          )
          .optional(),
        joinOperator: z.enum(['and', 'or']).optional().default('and'),

        artistIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const {
        query,
        type,
        page,
        perPage,
        artistIds,
        orderByColumn,
        orderByDirection,
        joinOperator,
        period,
        filterStructure,
      } = input;
      const { user, teamId } = ctx;
      const userId = user.id;

      // Construir el objeto where para los filtros
      let where: Prisma.tuStreamsWhereInput = {
        teamId,
        // ...(query && {
        //   OR: [
        //     { title: { contains: query, mode: 'insensitive' } },
        //     { UPC: { contains: query, mode: 'insensitive' } },
        //     { artist: { contains: query, mode: 'insensitive' } },
        //   ],
        // }),
      };

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        where = advancedWhere;
      }

      if (type && type !== ExtendedTuStreamsType.ALL) {
        where.type = type;
      }

      const getStatOptions: GetTuStreamsType = {
        period,
        search: query,
        artistIds,
        teamId,
      };

      const [stats] = await Promise.all([getTuStreamsType(getStatOptions)]);

      const [tuStreams] = await Promise.all([
        findTuStreams({
          query,
          page,
          perPage,
          artistIds,
          userId,
          teamId,
          period,
          where,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);

      return { tuStreams, types: stats };
    }),

  findAllTuStreams: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        type: z.nativeEnum(ExtendedTuStreamsType).optional(),
        orderBy: z.enum(['createdAt', 'updatedAt']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'date',
            'artist',
            'title',
            'UPC',
            'createdAt',
            'type',
            'total',
            'teamId',
            'userId',
          ])
          .optional(),
        filterStructure: z
          .array(
            z
              .custom<FilterStructure>(
                (val) => val === null || val === undefined || typeof val === 'object',
              )
              .optional()
              .nullable(),
          )
          .optional(),
        joinOperator: z.enum(['and', 'or']).optional().default('and'),

        artistIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        query,
        type,
        artistIds,
        orderByColumn,
        orderByDirection,
        joinOperator,
        period,
        filterStructure,
      } = input;
      const { user, teamId } = ctx;
      const userId = user.id;

      let where: Prisma.tuStreamsWhereInput = {
        ...(teamId && { teamId }),
      };

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        where = advancedWhere;
      }

      if (type && type !== ExtendedTuStreamsType.ALL) {
        where.type = type;
      }

      const [tuStreams] = await Promise.all([
        findAllTuStreams({
          query,
          artistIds,
          userId,
          teamId,
          period,
          where,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);

      return tuStreams;
    }),

  updateTuStreams: authenticatedProcedure
    .input(
      z.object({
        id: z.number().min(1),
        title: z.string().optional(),
        UPC: z.string().optional(),
        artistsToUpdate: z.array(z.string()).optional(),

        artists: z
          .array(
            z.object({
              id: z.number(),
              name: z.string().nullable(),
            }),
          )
          .optional(),
        type: z.nativeEnum(TypeOfTuStreams).optional(),
        total: z.number().optional(),
        date: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, artistsToUpdate, artists, ...data } = input;

      if (artists && artistsToUpdate) {
        console.log('artists to disconnect', artists);
        console.log('artists to connect', artistsToUpdate);
        await prisma.tuStreams.update({
          where: { id },
          data: {
            artists: {
              disconnect: artists?.map((artist) => ({ id: artist.id })),
              connect: artistsToUpdate.map((artistId) => ({ id: Number(artistId) })),
            },
          },
        });
      } else if (artistsToUpdate) {
        console.log('artists to connect', artistsToUpdate);
        await prisma.tuStreams.update({
          where: { id },
          data: {
            artists: {
              connect: artistsToUpdate.map((artistId) => ({ id: Number(artistId) })),
            },
          },
        });
      }

      const pepe = await prisma.tuStreams.update({
        where: { id },
        data: {
          ...data,
        },
      });

      return pepe;
    }),

  deleteTuStreams: authenticatedProcedure
    .input(z.object({ id: z.number().min(1) }))
    .mutation(async ({ input }) => {
      const { id } = input;
      try {
        await prisma.tuStreams.deleteMany({
          where: {
            id,
          },
        });
        return { success: true };
      } catch (error) {
        console.error('Error deleting TuStreams:', error);
        return { success: false, error: 'Error deleting TuStreams' };
      }
    }),

  findTuStreamsStatsByCurrentTeam: authenticatedProcedure.query(async ({ ctx }) => {
    const { teamId } = ctx;
    const contracts = await getTuStreamsStats(teamId);
    return contracts;
  }),

  deleteMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;

      const updateMany = await Promise.all(
        ids.map(async (id) =>
          prisma.tuStreams.update({
            where: { id },
            data: {
              tuStreamsArtists: {
                deleteMany: {},
              },
            },
          }),
        ),
      );

      const deleted = await prisma.tuStreams.deleteMany({
        where: { id: { in: ids } },
      });

      return deleted;
    }),
});
