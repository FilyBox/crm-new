// import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';
import { Release, TypeOfRelease } from '@prisma/client';
import { z } from 'zod';

import { findRelease } from '@documenso/lib/server-only/document/find-releases';
import { getRelease } from '@documenso/lib/server-only/document/get-release';
import { type GetReleaseType } from '@documenso/lib/server-only/document/get-release-type';
import { getReleaseType } from '@documenso/lib/server-only/document/get-release-type';
import { prisma } from '@documenso/prisma';
import { ExtendedRelease, ExtendedReleaseType } from '@documenso/prisma/types/extended-release';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';

export type GetTaskByIdOptions = {
  id: number;
  userId: number;
  teamId: number;
  folderId?: string | null;
};

export const releaseRouter = router({
  createRelease: authenticatedProcedure
    .input(
      z.object({
        date: z.date().optional(),
        artistsToUpdate: z.array(z.string()).optional(),
        artist: z.string().optional(),
        lanzamiento: z.string().optional(),
        typeOfRelease: z.nativeEnum(TypeOfRelease).optional(),
        release: z.nativeEnum(Release).optional(),
        uploaded: z.string().optional(),
        streamingLink: z.string().optional(),
        assets: z.boolean().optional(),
        canvas: z.boolean().optional(),
        cover: z.boolean().optional(),
        audioWAV: z.boolean().optional(),
        video: z.boolean().optional(),
        banners: z.boolean().optional(),
        pitch: z.boolean().optional(),
        EPKUpdates: z.boolean().optional(),
        WebSiteUpdates: z.boolean().optional(),
        Biography: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { artistsToUpdate, ...data } = input;
      console.log('artiststoupdate', artistsToUpdate);
      return await prisma.releases.create({
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

  createManyReleases: authenticatedProcedure
    .input(
      z.object({
        releases: z.array(
          z.object({
            date: z.date().optional(),
            artist: z.string().optional(),
            lanzamiento: z.string().optional(),
            typeOfRelease: z.nativeEnum(TypeOfRelease).optional(),
            release: z.nativeEnum(Release).optional(),
            uploaded: z.string().optional(),
            streamingLink: z.string().optional(),
            assets: z.boolean().optional(),
            canvas: z.boolean().optional(),
            cover: z.boolean().optional(),
            audioWAV: z.boolean().optional(),
            video: z.boolean().optional(),
            banners: z.boolean().optional(),
            pitch: z.boolean().optional(),
            EPKUpdates: z.boolean().optional(),
            WebSiteUpdates: z.boolean().optional(),
            Biography: z.boolean().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { releases } = input;

      // Verify permissions if it's a team task
      if (teamId && ctx.teamId !== teamId) {
        throw new Error('No tienes permisos para crear releases en este equipo');
      }

      // For large datasets, process in smaller chunks
      const BATCH_SIZE = 25; // Process 25 records at a time
      let totalCreated = 0;

      // Process releases in batches to avoid transaction timeouts
      for (let i = 0; i < releases.length; i += BATCH_SIZE) {
        const batch = releases.slice(i, i + BATCH_SIZE);

        // Process each batch in its own transaction
        const result = await prisma.$transaction(
          async (tx) => {
            const createdReleases = [];

            for (const file of batch) {
              // Normalize artist string for consistent processing
              const normalizedArtistString = file.artist
                ? file.artist.replace(/\s+ft\.\s+/gi, ', ').replace(/\s+&\s+/g, ', ')
                : '';

              const release = await tx.releases.create({
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
        console.log(`Batch processed: ${i}-${i + batch.length}, created: ${result.length}`);
      }

      return totalCreated;
    }),
  findReleasesUniqueArtists: authenticatedProcedure.query(async ({ ctx }) => {
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
      distinct: ['name'],
    });

    return uniqueArtists;
  }),
  findRelease: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        type: z.nativeEnum(ExtendedReleaseType).optional(),
        release: z.nativeEnum(ExtendedRelease).optional(),
        orderBy: z
          .enum([
            'id',
            'createdAt',
            'date',
            'lanzamiento',
            'typeOfRelease',
            'release',
            'uploaded',
            'streamingLink',
            'assets',
            'canvas',
            'cover',
            'audioWAV',
            'video',
            'banners',
            'pitch',
            'EPKUpdates',
            'WebSiteUpdates',
            'Biography',
          ])
          .optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'createdAt',
            'date',
            'lanzamiento',
            'typeOfRelease',
            'uploaded',
            'release',
            'streamingLink',
            'assets',
            'canvas',
            'cover',
            'audioWAV',
            'video',
            'banners',
            'pitch',
            'EPKUpdates',
            'WebSiteUpdates',
            'Biography',
          ])
          .optional(),

        artistIds: z.array(z.number()).optional(),
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
        type,
        page,
        perPage,
        // release,
        artistIds,

        orderByColumn,
        orderByDirection,
        period,
        joinOperator,

        filterStructure,
        // orderBy = 'createdAt',
      } = input;

      const { user, teamId } = ctx;
      const userId = user.id;
      let where: Prisma.ReleasesWhereInput = {};

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        where = advancedWhere;
      }

      if (type && type !== ExtendedReleaseType.ALL) {
        where.typeOfRelease = type;
      }
      const getStatOptions: GetReleaseType = {
        period,
        search: query,
        artistIds,
        teamId,
        where,
      };

      const [stats] = await Promise.all([getReleaseType(getStatOptions)]);
      const [release] = await Promise.all([
        getRelease({
          ...getStatOptions,
          where: where || {}, // Ensure where is always defined
        }),
      ]);

      const [documents] = await Promise.all([
        findRelease({
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

      return { releases: documents, types: stats, releasesCount: release };
    }),

  updateRelease: authenticatedProcedure
    .input(
      z.object({
        id: z.number().min(1),
        date: z.date().optional(),
        artist: z.string().optional(),
        lanzamiento: z.string().optional(),
        typeOfRelease: z.nativeEnum(TypeOfRelease).optional(),
        release: z.nativeEnum(Release).optional(),
        artistsToUpdate: z.array(z.string()).optional(),

        artists: z
          .array(
            z.object({
              id: z.number(),
              name: z.string().nullable(),
            }),
          )
          .optional(),
        uploaded: z.string().optional(),
        streamingLink: z.string().optional(),
        assets: z.boolean().optional().nullable(),
        canvas: z.boolean().optional().nullable(),
        cover: z.boolean().optional().nullable(),
        audioWAV: z.boolean().optional().nullable(),
        video: z.boolean().optional().nullable(),
        banners: z.boolean().optional().nullable(),
        pitch: z.boolean().optional().nullable(),
        EPKUpdates: z.boolean().optional().nullable(),
        WebSiteUpdates: z.boolean().optional().nullable(),
        Biography: z.boolean().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, artistsToUpdate, artists, ...data } = input;
      // Verificar permisos si es tarea de equipo
      // if (teamId && ctx.teamId !== teamId) {
      //   throw new Error('No tienes permisos para actualizar tareas en este equipo');
      // }

      console.log('Updating release with data:', data);

      if (artists && artistsToUpdate) {
        console.log('artists to disconnect', artists);
        console.log('artists to connect', artistsToUpdate);
        await prisma.releases.update({
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
        await prisma.releases.update({
          where: { id },
          data: {
            artists: {
              connect: artistsToUpdate.map((artistId) => ({ id: Number(artistId) })),
            },
          },
        });
      }

      const pepe = await prisma.releases.update({
        where: { id },
        data: {
          ...data,
        },
      });

      return pepe;
    }),

  deleteRelease: authenticatedProcedure
    .input(z.object({ releaseId: z.number().min(1) }))
    .mutation(async ({ input }) => {
      const { releaseId } = input;
      // Eliminar la tarea y sus subtareas
      await prisma.releases.deleteMany({
        where: {
          id: releaseId,
        },
      });
      return { success: true };
    }),

  deleteMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;
      const deleted = await prisma.releases.deleteMany({
        where: { id: { in: ids } },
      });

      return deleted;
    }),
});
