import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import { findAllMusic } from '@documenso/lib/server-only/document/find-allMusic';
import { prisma } from '@documenso/prisma';
import { ZFindAllMusicResponseSchema } from '@documenso/trpc/server/allMusic-router/schema';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';

export type GetTaskByIdOptions = {
  id: number;
  userId: number;
  teamId: number;
  folderId?: string | null;
};

export const allMusicRouter = router({
  createManyAllMusic: authenticatedProcedure
    .input(
      z.object({
        allMusic: z.array(
          z.object({
            title: z.string(),
            isrcSong: z.string().optional(),
            isrcVideo: z.string().optional(),
            UPC: z.string().optional(),
            publishedAt: z.date().optional(),
            artists: z.string().optional(),
            catalog: z.string().optional(),
            videoLinks: z.string().optional(),
            generalLinks: z.string().optional(),
            recordLabel: z.string().optional(),
          }),
        ),
        agregadora: z.enum(['Virgin', 'TuStreams', 'Ada']),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { allMusic, agregadora } = input;

      const uniqueInputMusic = allMusic.filter(
        (item, index, self) =>
          index ===
          self.findIndex((t) => t.title.toLowerCase().trim() === item.title.toLowerCase().trim()),
      );

      const titles = uniqueInputMusic.map((item) => item.title.toLowerCase().trim());

      const existingTitles = await prisma.allMusic.findMany({
        where: {
          title: {
            in: titles,
            mode: 'insensitive',
          },
          agregadora: {
            name: agregadora,
          },
        },
        select: {
          title: true,
        },
      });

      const existingTitlesSet = new Set(
        existingTitles.map((item) => item.title.toLowerCase().trim()),
      );

      // Filtrar los registros que no existen en la base de datos
      const newMusicToCreate = uniqueInputMusic.filter(
        (item) => !existingTitlesSet.has(item.title.toLowerCase().trim()),
      );

      if (newMusicToCreate.length === 0) {
        return 0;
      }

      const BATCH_SIZE = 25;
      let totalCreated = 0;
      let totalSkipped = allMusic.length - newMusicToCreate.length;

      for (let i = 0; i < newMusicToCreate.length; i += BATCH_SIZE) {
        const batch = newMusicToCreate.slice(i, i + BATCH_SIZE);

        const result = await prisma.$transaction(
          async (tx) => {
            const createdAllMusic = [];

            for (const allMusicData of batch) {
              const { artists, videoLinks, generalLinks, recordLabel, ...baseData } = allMusicData;
              console.log('Creating AllMusic:', baseData.title);
              console.log('baseData:', allMusicData);
              console.log('artists:', artists);
              // Verificar una vez más antes de crear (por si acaso se creó durante el procesamiento)
              const existingRecord = await tx.allMusic.findFirst({
                where: {
                  title: {
                    equals: baseData.title,
                    mode: 'insensitive',
                  },
                  agregadora: {
                    name: agregadora,
                  },
                },
              });

              if (existingRecord) {
                totalSkipped++;
                continue;
              }

              const allMusic = await tx.allMusic.create({
                data: {
                  ...baseData,
                  team: { connect: { id: teamId } },
                  user: { connect: { id: userId } },

                  ...(artists && {
                    artists: {
                      connectOrCreate: artists.split(',').map((artistName) => ({
                        where: { name: artistName.trim() },
                        create: { name: artistName.trim() },
                      })),
                    },
                  }),
                  agregadora: {
                    connectOrCreate: {
                      where: { name: agregadora },
                      create: { name: agregadora },
                    },
                  },

                  ...(recordLabel && {
                    recordLabel: {
                      connectOrCreate: {
                        where: { name: recordLabel.trim() },
                        create: { name: recordLabel.trim() },
                      },
                    },
                  }),

                  ...(videoLinks && {
                    videoLinks: {
                      create: {
                        url: videoLinks,
                        name: 'Link',
                      },
                    },
                  }),
                  ...(generalLinks && {
                    generalLinks: {
                      create: {
                        url: generalLinks,
                        name: 'Link',
                      },
                    },
                  }),
                },
              });

              createdAllMusic.push(allMusic);
            }

            return createdAllMusic;
          },
          { timeout: 60000 }, // 60 second timeout for each batch
        );

        totalCreated += result.length;
        console.log(`Batch processed: ${i}-${i + batch.length}, created: ${result.length}`);
      }

      console.log('totalSkipped', totalSkipped);
      console.log('totalCreated', totalCreated);
      console.log('totalProcessed', allMusic.length);

      return totalCreated;
    }),

  createManyAllMusicTuStream: authenticatedProcedure
    .input(
      z.object({
        allMusic: z.array(
          z.object({
            title: z.string(),
            UPC: z.string().optional(),
            publishedAt: z.date().optional(),
            artists: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { allMusic } = input;

      const uniqueInputMusic = allMusic.filter(
        (item, index, self) =>
          index ===
          self.findIndex((t) => t.title.toLowerCase().trim() === item.title.toLowerCase().trim()),
      );

      const titles = uniqueInputMusic.map((item) => item.title.toLowerCase().trim());

      const existingTitles = await prisma.allMusic.findMany({
        where: {
          title: {
            in: titles,
            mode: 'insensitive',
          },
          agregadora: {
            name: 'TuStream',
          },
        },
        select: {
          title: true,
        },
      });

      const existingTitlesSet = new Set(
        existingTitles.map((item) => item.title.toLowerCase().trim()),
      );

      // Filtrar los registros que no existen en la base de datos
      const newMusicToCreate = uniqueInputMusic.filter(
        (item) => !existingTitlesSet.has(item.title.toLowerCase().trim()),
      );

      if (newMusicToCreate.length === 0) {
        return 0;
      }

      const BATCH_SIZE = 25;
      let totalCreated = 0;
      let totalSkipped = allMusic.length - newMusicToCreate.length;

      for (let i = 0; i < newMusicToCreate.length; i += BATCH_SIZE) {
        const batch = newMusicToCreate.slice(i, i + BATCH_SIZE);

        const result = await prisma.$transaction(
          async (tx) => {
            const createdAllMusic = [];

            for (const allMusicData of batch) {
              const { artists, ...baseData } = allMusicData;
              console.log('Creating AllMusic:', baseData.title);
              console.log('baseData:', allMusicData);
              console.log('artists:', artists);
              // Verificar una vez más antes de crear (por si acaso se creó durante el procesamiento)
              const existingRecord = await tx.allMusic.findFirst({
                where: {
                  title: {
                    equals: baseData.title,
                    mode: 'insensitive',
                  },
                  agregadora: {
                    name: 'Virgin',
                  },
                },
              });

              if (existingRecord) {
                totalSkipped++;
                continue;
              }

              const allMusic = await tx.allMusic.create({
                data: {
                  ...baseData,
                  team: { connect: { id: teamId } },
                  user: { connect: { id: userId } },

                  ...(artists && {
                    artists: {
                      connectOrCreate: artists.split(',').map((artistName) => ({
                        where: { name: artistName.trim() },
                        create: { name: artistName.trim() },
                      })),
                    },
                  }),
                  agregadora: {
                    connectOrCreate: {
                      where: { name: 'TuStream' },
                      create: { name: 'TuStream' },
                    },
                  },
                },
              });

              createdAllMusic.push(allMusic);
            }

            return createdAllMusic;
          },
          { timeout: 60000 }, // 60 second timeout for each batch
        );

        totalCreated += result.length;
        console.log(`Batch processed: ${i}-${i + batch.length}, created: ${result.length}`);
      }

      console.log('totalSkipped', totalSkipped);
      console.log('totalCreated', totalCreated);
      console.log('totalProcessed', allMusic.length);

      return totalCreated;
    }),

  findAllMusic: authenticatedProcedure
    .output(ZFindAllMusicResponseSchema)
    .input(
      z.object({
        query: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
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
        distributorIds: z.array(z.number()).optional(),
        agregadoraIds: z.array(z.number()).optional(),
        recordLabelIds: z.array(z.number()).optional(),
        videoLinksDatesRange: z
          .object({
            from: z.date().optional(),
            to: z.date().optional(),
          })
          .optional(),
        generalLinksDatesRange: z
          .object({
            from: z.date().optional(),
            to: z.date().optional(),
          })
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
      const { query, page, perPage, artistIds, period, joinOperator, filterStructure } = input;

      const { user, teamId } = ctx;
      const userId = user.id;
      let where: Prisma.AllMusicWhereInput = {};

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
        findAllMusic({
          query,
          page,
          perPage,
          artistIds,
          userId,
          teamId,
          period,
          where,
        }),
      ]);

      const mappedData = documents.data.map((item) => ({
        ...item,
        agregadora: item.agregadora === null ? undefined : item.agregadora,
        distribuidor: item.distribuidor === null ? undefined : item.distribuidor,
        recordLabel: item.recordLabel === null ? undefined : item.recordLabel,
      }));

      return {
        ...documents,
        data: mappedData,
      };
    }),
});
