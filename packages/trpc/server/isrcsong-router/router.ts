import { z } from 'zod';

import { findAllIsrc } from '@documenso/lib/server-only/document/find-all-isrc';
import { findIsrc } from '@documenso/lib/server-only/document/find-isrc';
import { prisma } from '@documenso/prisma';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';
import type { Prisma } from '.prisma/client';

export type GetIsrcSongsByIdOptions = {
  id: number;
  trackName?: string;
  artist?: string;
  duration?: string;
  title?: string;
  license?: string;
  date?: string;
};

export const IsrcSongsRouter = router({
  createIsrcSongs: authenticatedProcedure
    .input(
      z.object({
        trackName: z.string().optional(),
        artistsToUpdate: z.array(z.string()).optional(),

        artists: z
          .array(
            z.object({
              id: z.number(),
              artistName: z.string().nullable(),
            }),
          )
          .optional(),
        duration: z.string().optional(),
        title: z.string().optional(),
        license: z.string().optional(),
        date: z.date().optional(),
        isrc: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { artistsToUpdate, ...data } = input;

      return await prisma.isrcSongs.create({
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

  createManyIsrcSongs: authenticatedProcedure
    .input(
      z.object({
        isrcSongs: z.array(
          z.object({
            trackName: z.string().optional(),
            artist: z.string().optional(),
            duration: z.string().optional(),
            title: z.string().optional(),
            license: z.string().optional(),
            date: z.date().optional(),
            isrc: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { isrcSongs } = input;
      const { user, teamId } = ctx;
      const userId = user.id;

      // Verify permissions if it's a team task
      if (teamId && ctx.teamId !== teamId) {
        throw new Error('No tienes permisos para crear releases en este equipo');
      }

      const BATCH_SIZE = 25;
      let totalCreated = 0;

      // Process releases in batches to avoid transaction timeouts
      for (let i = 0; i < isrcSongs.length; i += BATCH_SIZE) {
        const batch = isrcSongs.slice(i, i + BATCH_SIZE);
        // Process each batch in its own transaction
        const result = await prisma.$transaction(
          async (tx) => {
            interface CreatedRelease {
              teamId: number | null;
              id: number;
              userId: number | null;
              createdAt: Date;
              date: Date | null;
              trackName: string | null;
              artist: string | null;
              duration: string | null;
              title: string | null;
              license: string | null;
              isrc: string | null;
            }

            const createdReleases: CreatedRelease[] = [];

            for (const file of batch) {
              // Normalize artist string for consistent processing
              const normalizedArtistString = (file.artist || '')
                .replace(/\s+ft\.\s+/gi, ', ')
                .replace(/\s+&\s+/g, ', ')

                .replace(/\s+feat\.\s+/gi, ', ')

                .replace(/\s+ft\s+/gi, ', ')
                .replace(/\s+feat\s+/gi, ', ')
                .replace(/\s*\/\s*/g, ', '); // Cambiar \s+ por \s*

              // Create the release with associated artists
              const release = await tx.isrcSongs.create({
                data: {
                  ...file,
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

              createdReleases.push(release);
            }

            return createdReleases;
          },
          { timeout: 60000 }, // 60 second timeout for each batch
        );

        totalCreated += result.length;
      }

      return totalCreated;
    }),

  findIsrcUniqueArtists: authenticatedProcedure.query(async ({ ctx }) => {
    const { teamId } = ctx;

    const uniqueArtists = await prisma.artist.findMany({
      where: {
        teamId,
      },
    });

    return uniqueArtists;
  }),

  findIsrcSongs: authenticatedProcedure
    .input(
      z.object({
        // userId: z.number(),
        query: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        artistIds: z.array(z.number()).optional(),

        period: z.enum(['7d', '14d', '30d']).optional(),
        orderBy: z.enum(['createdAt', 'updatedAt']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'date',
            'createdAt',
            'isrc',
            'artist',
            'duration',
            'trackName',
            'title',
            'license',
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
      }),
    )
    .query(async ({ input, ctx }) => {
      const {
        query,
        page,
        perPage,
        // release,
        artistIds,
        orderByColumn,
        orderByDirection,
        period,
        filterStructure,
        joinOperator,
        // orderBy = 'createdAt',
      } = input;
      const { user, teamId } = ctx;
      const userId = user.id;
      let where: Prisma.IsrcSongsWhereInput = {};

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        where = advancedWhere;
      }
      const [documents] = await Promise.all([
        findIsrc({
          query,
          page,
          perPage,
          artistIds,
          userId,
          where,
          teamId,
          period,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);
      return documents;
    }),

  findAllIsrc: authenticatedProcedure
    .input(
      z.object({
        // userId: z.number(),
        query: z.string().optional(),

        artistIds: z.array(z.number()).optional(),

        period: z.enum(['7d', '14d', '30d']).optional(),
        orderBy: z.enum(['createdAt', 'updatedAt']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'date',
            'createdAt',
            'isrc',
            'artist',
            'duration',
            'trackName',
            'title',
            'license',
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
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        query,

        // release,
        artistIds,
        orderByColumn,
        orderByDirection,
        period,
        filterStructure,
        joinOperator,
        // orderBy = 'createdAt',
      } = input;
      const { user, teamId } = ctx;
      const userId = user.id;
      let where: Prisma.IsrcSongsWhereInput = {};

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        where = advancedWhere;
      }
      const [documents] = await Promise.all([
        findAllIsrc({
          query,
          artistIds,
          userId,
          where,
          teamId,
          period,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);
      return documents;
    }),

  updateIsrcSongsById: authenticatedProcedure
    .input(
      z.object({
        id: z.number(),
        trackName: z.string().optional(),
        artist: z.string().optional(),
        duration: z.string().optional(),
        artists: z
          .array(
            z.object({
              id: z.number(),
              name: z.string().nullable(),
            }),
          )
          .optional(),
        artistsToUpdate: z.array(z.string()).optional(),

        title: z.string().optional(),
        license: z.string().optional(),
        date: z.date().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, artistsToUpdate, artists, ...data } = input;

      if (artists && artistsToUpdate) {
        await prisma.isrcSongs.update({
          where: { id },
          data: {
            artists: {
              disconnect: artists?.map((artist) => ({ id: artist.id })),
              connect: artistsToUpdate.map((artistId) => ({ id: Number(artistId) })),
            },
          },
        });
      } else if (artistsToUpdate) {
        await prisma.isrcSongs.update({
          where: { id },
          data: {
            artists: {
              connect: artistsToUpdate.map((artistId) => ({ id: Number(artistId) })),
            },
          },
        });
      }

      const pepe = await prisma.isrcSongs.update({
        where: { id },
        data: {
          ...data,
        },
      });

      return pepe;
    }),

  deleteIsrcSongsById: authenticatedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id } = input;
      const deletedIsrcSong = await prisma.isrcSongs.delete({
        where: { id },
      });

      return deletedIsrcSong;
    }),

  deleteMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;
      const deleted = await prisma.isrcSongs.deleteMany({
        where: { id: { in: ids } },
      });

      return deleted;
    }),
});
