import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import { findAllMusic } from '@documenso/lib/server-only/document/find-allMusic';
import { findAllMusicNoPagination } from '@documenso/lib/server-only/document/find-allMusic-no-pagination';
import { prisma } from '@documenso/prisma';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';

export type GetTaskByIdOptions = {
  id: number;
  userId: number;
  teamId: number;
  folderId?: string | null;
};

export const allMusicRouter = router({
  createAllMusic: authenticatedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        isrcVideo: z.string().optional(),
        isrcSong: z.string().optional(),
        UPC: z.string().optional(),
        publishedAt: z.date().optional(),
        catalog: z.string().optional(),
        artists: z.array(z.string()).optional(),
        agregadoraId: z.number().optional(),
        distribuidorId: z.number().optional(),
        recordLabelId: z.number().optional(),
        videoLinks: z
          .array(
            z.object({
              name: z.string(),
              url: z.string(),
              isrcVideo: z.string().optional().nullable(),
              publishedAt: z.date().optional().nullable(),
              lyrics: z.string().optional().nullable(),
            }),
          )
          .optional(),
        generalLinks: z
          .array(
            z.object({
              name: z.string(),
              url: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { teamId, user } = ctx;
      const { artists, videoLinks, generalLinks, ...data } = input;

      try {
        const result = await prisma.$transaction(async (tx) => {
          // Create the AllMusic record
          const allMusic = await tx.allMusic.create({
            data: {
              ...data,
              userId: user.id,
              teamId,
            },
          });

          // Connect artists if provided
          if (artists && artists.length > 0) {
            const existingArtists = await tx.artistsAllMusic.findMany({
              where: { name: { in: artists } },
            });

            const newArtists = artists.filter(
              (name) => !existingArtists.find((artist) => artist.name === name),
            );

            // Create new artists
            for (const name of newArtists) {
              await tx.artistsAllMusic.create({ data: { name } });
            }

            // Connect all artists
            await tx.allMusic.update({
              where: { id: allMusic.id },
              data: {
                artists: {
                  connect: artists.map((name) => ({ name })),
                },
              },
            });
          }

          // Create video links if provided
          if (videoLinks && videoLinks.length > 0) {
            for (const link of videoLinks) {
              const videoLink = await tx.videoLinks.create({
                data: link,
              });
              await tx.allMusic.update({
                where: { id: allMusic.id },
                data: {
                  videoLinks: { connect: { id: videoLink.id } },
                },
              });
            }
          }

          // Create general links if provided
          if (generalLinks && generalLinks.length > 0) {
            for (const link of generalLinks) {
              const generalLink = await tx.generalLinks.create({
                data: link,
              });
              await tx.allMusic.update({
                where: { id: allMusic.id },
                data: {
                  generalLinks: { connect: { id: generalLink.id } },
                },
              });
            }
          }

          return allMusic;
        });

        return { success: true, data: result };
      } catch (error) {
        throw new Error('Failed to create AllMusic record');
      }
    }),

  updateAllMusic: authenticatedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        isrcVideo: z.string().optional(),
        isrcSong: z.string().optional(),
        UPC: z.string().optional(),
        publishedAt: z.date().optional(),
        catalog: z.string().optional(),
        artists: z.array(z.string()).optional(),
        agregadoraId: z.number().optional(),
        distribuidorId: z.number().optional(),
        recordLabelId: z.number().optional(),
        videoLinks: z
          .array(
            z.object({
              id: z.number().optional(),
              name: z.string(),
              url: z.string(),
              isrcVideo: z.string().optional().nullable(),
              publishedAt: z.date().optional().nullable(),
              lyrics: z.string().optional().nullable(),
              deleted: z.boolean().optional(),
              modified: z.boolean().optional(),
            }),
          )
          .optional(),
        generalLinks: z
          .array(
            z.object({
              id: z.number().optional(),
              name: z.string(),
              url: z.string(),
              modified: z.boolean().optional(),
              deleted: z.boolean().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, artists, videoLinks, generalLinks, ...data } = input;

      try {
        const result = await prisma.$transaction(async (tx) => {
          // Update the main AllMusic record
          const allMusic = await tx.allMusic.update({
            where: { id },
            data,
          });

          // Handle artist updates if provided
          if (artists) {
            // Disconnect current artists
            await tx.allMusic.update({
              where: { id },
              data: {
                artists: { set: [] },
              },
            });

            if (artists.length > 0) {
              const existingArtists = await tx.artistsAllMusic.findMany({
                where: { name: { in: artists } },
              });

              const newArtists = artists.filter(
                (name) => !existingArtists.find((artist) => artist.name === name),
              );

              // Create new artists
              for (const name of newArtists) {
                await tx.artistsAllMusic.create({ data: { name } });
              }

              // Connect all artists
              await tx.allMusic.update({
                where: { id },
                data: {
                  artists: {
                    connect: artists.map((name) => ({ name })),
                  },
                },
              });
            }
          }

          // Handle video links updates
          if (videoLinks) {
            for (const link of videoLinks) {
              console.log('Processing video link:', link);
              if (link.deleted && link.id) {
                // Remove from AllMusic connection and delete
                await tx.allMusic.update({
                  where: { id },
                  data: {
                    videoLinks: { disconnect: { id: link.id } },
                  },
                });
                await tx.videoLinks.delete({ where: { id: link.id } });
              } else if (link.id && link.modified) {
                // Update existing link
                await tx.videoLinks.update({
                  where: { id: link.id },
                  data: {
                    name: link.name,
                    url: link.url,
                    isrcVideo: link.isrcVideo,
                    publishedAt: link.publishedAt,
                    lyrics: link.lyrics,
                  },
                });
              } else if (!link.id) {
                // Create new link
                const videoLink = await tx.videoLinks.create({
                  data: {
                    name: link.name,
                    url: link.url,
                    isrcVideo: link.isrcVideo,
                    publishedAt: link.publishedAt,
                    lyrics: link.lyrics,
                  },
                });
                await tx.allMusic.update({
                  where: { id },
                  data: {
                    videoLinks: { connect: { id: videoLink.id } },
                  },
                });
              }
            }
          }

          // Handle general links updates
          if (generalLinks) {
            for (const link of generalLinks) {
              if (link.deleted && link.id) {
                // Remove from AllMusic connection and delete
                await tx.allMusic.update({
                  where: { id },
                  data: {
                    generalLinks: { disconnect: { id: link.id } },
                  },
                });
                await tx.generalLinks.delete({ where: { id: link.id } });
              } else if (link.id) {
                // Update existing link
                await tx.generalLinks.update({
                  where: { id: link.id },
                  data: {
                    name: link.name,
                    url: link.url,
                  },
                });
              } else {
                // Create new link
                const generalLink = await tx.generalLinks.create({
                  data: {
                    name: link.name,
                    url: link.url,
                  },
                });
                await tx.allMusic.update({
                  where: { id },
                  data: {
                    generalLinks: { connect: { id: generalLink.id } },
                  },
                });
              }
            }
          }

          return allMusic;
        });

        return { success: true, data: result };
      } catch (error) {
        throw new Error('Failed to update AllMusic record');
      }
    }),

  getByIdAllMusic: authenticatedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { id } = input;

      return await prisma.allMusic.findUnique({
        where: { id },
        include: {
          artists: true,
          videoLinks: true,
          generalLinks: true,
          agregadora: true,
          distribuidor: true,
          recordLabel: true,
        },
      });
    }),
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
        agregadora: z.enum(['Virgin', 'TuStreams', 'Ada', 'No definida']),
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
      const existingArtists = await prisma.artistsAllMusic.findMany({});

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

              const normalizedArtistString = (artists || '')
                .replace(/\s+ft\.\s+/gi, ', ')
                .replace(/\s+&\s+/g, ', ')
                .replace(/\s+feat\.\s+/gi, ', ')
                .replace(/\s+ft\s+/gi, ', ')
                .replace(/\s+feat\s+/gi, ', ')
                .replace(/\s*\/\s*/g, ', ');
              console.log('normalizedArtistString:', normalizedArtistString);

              // Función para normalizar texto (sin acentos, minúsculas, sin espacios extra)
              const normalizeText = (text: string) => {
                return text
                  .toLowerCase()
                  .trim()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
              };

              const existingArtistsMap = new Map();
              existingArtists.forEach((artist) => {
                const normalizedKey = normalizeText(artist.name);
                existingArtistsMap.set(normalizedKey, artist.name);
              });

              const normalizedArtistsList = normalizedArtistString
                .split(',')
                .map((name) => name.trim())
                .filter((name) => name.length > 0);
              const finalArtistsList = normalizedArtistsList.map((artistName) => {
                const normalizedName = normalizeText(artistName);
                // Si existe en la BD, usar el nombre exacto de la BD, sino usar el nombre normalizado original
                return existingArtistsMap.has(normalizedName)
                  ? existingArtistsMap.get(normalizedName)
                  : artistName;
              });

              console.log('finalArtistsList:', finalArtistsList);

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

                  ...(finalArtistsList.length > 0 && {
                    artists: {
                      connectOrCreate: finalArtistsList.map((artistName) => ({
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

      const existingArtists = await prisma.artistsAllMusic.findMany({});

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

              const normalizedArtistString = (artists || '')
                .replace(/\s+ft\.\s+/gi, ', ')
                .replace(/\s+&\s+/g, ', ')

                .replace(/\s+feat\.\s+/gi, ', ')

                .replace(/\s+ft\s+/gi, ', ')
                .replace(/\s+feat\s+/gi, ', ')
                .replace(/\s*\/\s*/g, ', ');
              console.log('normalizedArtistString:', normalizedArtistString);
              const existingArtistsMap = new Map();
              existingArtists.forEach((artist) => {
                existingArtistsMap.set(artist.name.toLowerCase().trim(), artist.name);
              });

              // Procesar los artistas normalizados para usar los nombres exactos de la BD
              const normalizedArtistsList = normalizedArtistString
                .split(',')
                .map((name) => name.trim())
                .filter((name) => name.length > 0);
              const finalArtistsList = normalizedArtistsList.map((artistName) => {
                const lowerName = artistName.toLowerCase().trim();
                // Si existe en la BD, usar el nombre exacto de la BD, sino usar el nombre normalizado original
                return existingArtistsMap.has(lowerName)
                  ? existingArtistsMap.get(lowerName)
                  : artistName;
              });

              console.log('finalArtistsList:', finalArtistsList);

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
                  ...(finalArtistsList.length > 0 && {
                    artists: {
                      connectOrCreate: finalArtistsList.map((artistName) => ({
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
      const {
        query,
        page,
        perPage,
        artistIds,
        agregadoraIds,
        recordLabelIds,
        period,
        joinOperator,
        filterStructure,
      } = input;

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
          agregadoraIds,
          recordLabelIds,
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

  findAllMusicNoPagination: authenticatedProcedure
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
    .mutation(async ({ input, ctx }) => {
      const {
        query,
        artistIds,
        agregadoraIds,
        recordLabelIds,
        period,
        joinOperator,
        filterStructure,
      } = input;

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
        findAllMusicNoPagination({
          query,
          agregadoraIds,
          recordLabelIds,
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

  findInfoToFilter: authenticatedProcedure.query(async () => {
    const [artists, agregadora, recordLabel, distribuidor] = await Promise.all([
      prisma.artistsAllMusic.findMany({ select: { id: true, name: true } }),
      prisma.agregadora.findMany({ select: { id: true, name: true } }),
      prisma.recordLabel.findMany({ select: { id: true, name: true } }),
      prisma.distribuidor.findMany({ select: { id: true, name: true } }),
    ]);
    return {
      agregadora,
      recordLabel,
      distribuidor,
      artists,
    };
  }),

  deleteMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;

      const deleted = await prisma.allMusic.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });

      return deleted;
    }),
});
