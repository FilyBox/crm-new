// import { TRPCError } from '@trpc/server';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import { findAllDistribution } from '@documenso/lib/server-only/document/find-all-distribution';
import { findDistribution } from '@documenso/lib/server-only/document/find-distribution';
import { getContractsStats } from '@documenso/lib/server-only/team/get-contracts-stats';
// import { jobs } from '@documenso/lib/jobs/client';
// import { getTemplateById } from '@documenso/lib/server-only/template/get-template-by-id';
import { prisma } from '@documenso/prisma';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';

export type GetTaskByIdOptions = {
  id: number;
  userId: number;
  teamId?: number;
  folderId?: string | null;
};

export const distributionRouter = router({
  createDistribution: authenticatedProcedure
    .input(
      z.object({
        territories: z
          .array(
            z.object({
              id: z.number(),
              name: z.string().nullable(),
            }),
          )
          .optional(),
        musicPlatform: z
          .array(
            z.object({
              id: z.number(),
              name: z.string().nullable(),
            }),
          )
          .optional(),
        marketingOwner: z.string().optional(),
        nombreDistribucion: z.string().optional(),
        proyecto: z.string().optional(),
        numeroDeCatalogo: z.string().optional(),
        upc: z.string().optional(),
        localProductNumber: z.string().optional(),
        isrc: z.string().optional(),
        tituloCatalogo: z.string().optional(),
        mesReportado: z.number().int().optional(),
        territorio: z.string().optional(),
        codigoDelTerritorio: z.string().optional(),
        nombreDelTerritorio: z.string().optional(),
        tipoDePrecio: z.string().optional(),
        tipoDeIngreso: z.string().optional(),
        venta: z.number().optional(),
        rtl: z.number().optional(),
        ppd: z.number().optional(),
        rbp: z.number().optional(),
        tipoDeCambio: z.number().optional(),
        valorRecibido: z.number().optional(),
        regaliasArtisticas: z.number().optional(),
        costoDistribucion: z.number().optional(),
        copyright: z.number().optional(),
        cuotaAdministracion: z.number().optional(),
        costoCarga: z.number().optional(),
        otrosCostos: z.number().optional(),
        ingresosRecibidos: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { territories, musicPlatform, ...data } = input;

      // const allData = { ...data, userId, ...(teamId ? { teamId } : {}) };

      return await prisma.distributionStatement.create({
        data: {
          ...data,
          user: {
            connect: { id: userId },
          },
          team: { connect: { id: teamId } },
          distributionStatementMusicPlatforms: {
            create:
              musicPlatform?.map((platform) => ({
                name: platform.name?.trim() || '',
                user: {
                  connect: { id: userId },
                },
                team: { connect: { id: teamId } },
                platform: {
                  connectOrCreate: {
                    where: { name: platform.name?.trim() || '' },
                    create: {
                      name: platform.name?.trim() || '',
                      user: {
                        connect: { id: userId },
                      },
                      team: { connect: { id: teamId } },
                    },
                  },
                },
              })) || [],
          },

          distributionStatementTerritories: {
            create:
              territories?.map((territory) => ({
                name: territory.name?.trim() || '',
                user: {
                  connect: { id: userId },
                },
                team: { connect: { id: teamId } },
                territory: {
                  connectOrCreate: {
                    where: { name: territory.name?.trim() || '' },
                    create: {
                      name: territory.name?.trim() || '',
                      user: {
                        connect: { id: userId },
                      },
                      team: { connect: { id: teamId } },
                    },
                  },
                },
              })) || [],
          },
        },
      });
    }),

  updateDistributionById: authenticatedProcedure
    .input(
      z.object({
        id: z.number(),
        territories: z
          .array(
            z.object({
              id: z.number(),
              name: z.string().nullable(),
            }),
          )
          .optional(),
        musicPlatform: z
          .array(
            z.object({
              id: z.number(),
              name: z.string().nullable(),
            }),
          )
          .optional(),
        marketingOwner: z.string().optional(),
        nombreDistribucion: z.string().optional(),
        proyecto: z.string().optional(),
        numeroDeCatalogo: z.string().optional(),
        upc: z.string().optional(),
        localProductNumber: z.string().optional(),
        isrc: z.string().optional(),
        tituloCatalogo: z.string().optional(),
        mesReportado: z.number().int().optional(),
        territorio: z.string().optional(),
        codigoDelTerritorio: z.string().optional(),
        nombreDelTerritorio: z.string().optional(),
        tipoDePrecio: z.string().optional(),
        tipoDeIngreso: z.string().optional(),
        venta: z.number().optional(),
        rtl: z.number().optional(),
        ppd: z.number().optional(),
        rbp: z.number().optional(),
        tipoDeCambio: z.number().optional(),
        valorRecibido: z.number().optional(),
        regaliasArtisticas: z.number().optional(),
        costoDistribucion: z.number().optional(),
        copyright: z.number().optional(),
        cuotaAdministracion: z.number().optional(),
        costoCarga: z.number().optional(),
        otrosCostos: z.number().optional(),
        ingresosRecibidos: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, territories, musicPlatform, ...data } = input;
      const { user, teamId } = ctx;
      const userId = user.id;

      const pepe = await prisma.distributionStatement.update({
        where: { id },
        data: {
          ...data,
          distributionStatementMusicPlatforms:
            musicPlatform && musicPlatform.length > 0
              ? {
                  deleteMany: {}, // remove existing artists
                  create: musicPlatform.map((platform) => ({
                    name: platform.name?.trim() || '',
                    user: {
                      connect: { id: userId },
                    },
                    team: { connect: { id: teamId } },
                    platform: {
                      connectOrCreate: {
                        where: { name: platform.name?.trim() || '' },
                        create: {
                          name: platform.name?.trim() || '',
                          user: {
                            connect: { id: userId },
                          },
                          team: { connect: { id: teamId } },
                        },
                      },
                    },
                  })),
                }
              : {
                  deleteMany: {}, // remove existing platforms if no new platforms provided
                },
          distributionStatementTerritories:
            territories && territories.length > 0
              ? {
                  deleteMany: {}, // remove existing territories
                  create: territories.map((territory) => ({
                    name: territory.name?.trim() || '',
                    user: {
                      connect: { id: userId },
                    },
                    team: { connect: { id: teamId } },
                    territory: {
                      connectOrCreate: {
                        where: { name: territory.name?.trim() || '' },
                        create: {
                          name: territory.name?.trim() || '',
                          user: {
                            connect: { id: userId },
                          },
                          team: { connect: { id: teamId } },
                        },
                      },
                    },
                  })),
                }
              : {
                  deleteMany: {}, // remove existing territories if no new territories provided
                },
        },
        include: {
          distributionStatementMusicPlatforms: true,
        },
      });

      return pepe;
    }),
  deleteDistributionById: authenticatedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id } = input;
      return await prisma.distributionStatement.delete({
        where: { id },
        include: {
          distributionStatementMusicPlatforms: true,
          distributionStatementTerritories: true,
        },
      });
    }),

  findDistributionStatsByCurrentTeam: authenticatedProcedure.query(async ({ ctx }) => {
    const { teamId } = ctx;
    const contracts = await getContractsStats(teamId);
    return contracts;
  }),

  deleteMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;
      const deleted = await prisma.distributionStatement.deleteMany({
        where: { id: { in: ids } },
      });

      return deleted;
    }),

  findDistribution: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        orderBy: z
          .enum([
            'id',
            'codigoDelTerritorio',
            'copyright',
            'costoCarga',
            'costoDistribucion',
            'cuotaAdministracion',
            'ingresosRecibidos',
            'isrc',
            'localProductNumber',
            'marketingOwner',
            'nombreDelTerritorio',
            'mesReportado',
            'nombreDistribucion',
            'teamId',
            'userId',
            'numeroDeCatalogo',
            'otrosCostos',
            'ppd',
            'proyecto',
            'rbp',
            'regaliasArtisticas',
            'rtl',
            'territorio',
            'tipoDeCambio',
            'tipoDeIngreso',
            'tipoDePrecio',
            'tituloCatalogo',
            'upc',
            'updatedAt',
            'valorRecibido',
            'venta',
            'createdAt',
          ])
          .optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'codigoDelTerritorio',
            'copyright',
            'costoCarga',
            'costoDistribucion',
            'cuotaAdministracion',
            'ingresosRecibidos',
            'isrc',
            'localProductNumber',
            'marketingOwner',
            'nombreDelTerritorio',
            'mesReportado',
            'nombreDistribucion',
            'teamId',
            'userId',
            'numeroDeCatalogo',
            'otrosCostos',
            'ppd',
            'proyecto',
            'rbp',
            'regaliasArtisticas',
            'rtl',
            'territorio',
            'tipoDeCambio',
            'tipoDeIngreso',
            'tipoDePrecio',
            'tituloCatalogo',
            'upc',
            'updatedAt',
            'valorRecibido',
            'venta',
            'createdAt',
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
        platformIds: z.array(z.number()).optional(),
        territoryIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const {
        query,
        page,
        perPage,
        orderByColumn = 'id',
        orderByDirection,
        territoryIds,
        platformIds,
        filterStructure,
        joinOperator,
      } = input;

      const { user, teamId } = ctx;
      const userId = user.id;

      let where: Prisma.DistributionStatementWhereInput = {};

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
        findDistribution({
          query,
          page,
          perPage,
          userId,
          teamId,
          territoryIds,
          platformIds,
          where,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);

      return documents;
    }),

  findAllDistribution: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        orderBy: z
          .enum([
            'id',
            'codigoDelTerritorio',
            'copyright',
            'costoCarga',
            'costoDistribucion',
            'cuotaAdministracion',
            'ingresosRecibidos',
            'isrc',
            'localProductNumber',
            'marketingOwner',
            'nombreDelTerritorio',
            'mesReportado',
            'nombreDistribucion',
            'teamId',
            'userId',
            'numeroDeCatalogo',
            'otrosCostos',
            'ppd',
            'proyecto',
            'rbp',
            'regaliasArtisticas',
            'rtl',
            'territorio',
            'tipoDeCambio',
            'tipoDeIngreso',
            'tipoDePrecio',
            'tituloCatalogo',
            'upc',
            'updatedAt',
            'valorRecibido',
            'venta',
            'createdAt',
          ])
          .optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'codigoDelTerritorio',
            'copyright',
            'costoCarga',
            'costoDistribucion',
            'cuotaAdministracion',
            'ingresosRecibidos',
            'isrc',
            'localProductNumber',
            'marketingOwner',
            'nombreDelTerritorio',
            'mesReportado',
            'nombreDistribucion',
            'teamId',
            'userId',
            'numeroDeCatalogo',
            'otrosCostos',
            'ppd',
            'proyecto',
            'rbp',
            'regaliasArtisticas',
            'rtl',
            'territorio',
            'tipoDeCambio',
            'tipoDeIngreso',
            'tipoDePrecio',
            'tituloCatalogo',
            'upc',
            'updatedAt',
            'valorRecibido',
            'venta',
            'createdAt',
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
        platformIds: z.array(z.number()).optional(),
        territoryIds: z.array(z.number()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        query,
        orderByColumn = 'id',
        orderByDirection,
        territoryIds,
        platformIds,
        filterStructure,
        joinOperator,
      } = input;

      const { user, teamId } = ctx;
      const userId = user.id;

      let where: Prisma.DistributionStatementWhereInput = {};

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
        findAllDistribution({
          query,
          userId,
          teamId,
          territoryIds,
          platformIds,
          where,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);

      return documents;
    }),

  findDistributionUniqueTerritories: authenticatedProcedure.query(async ({ ctx }) => {
    const uniqueTerritories = await prisma.territories.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return uniqueTerritories;
  }),

  findDistributionUniquePlatform: authenticatedProcedure.query(async ({ ctx }) => {
    const uniquePlatforms = await prisma.musicPlatforms.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return uniquePlatforms;
  }),

  createManyDistribution: authenticatedProcedure
    .input(
      z.object({
        distributions: z.array(
          z.object({
            marketingOwner: z.string().optional(),
            nombreDistribucion: z.string().optional(),
            proyecto: z.string().optional(),
            numeroDeCatalogo: z.string().optional(),
            upc: z.string().optional(),
            localProductNumber: z.string().optional(),
            isrc: z.string().optional(),
            tituloCatalogo: z.string().optional(),
            mesReportado: z.number().int().optional(),
            territorio: z.string().optional(),
            codigoDelTerritorio: z.string().optional(),
            nombreDelTerritorio: z.string().optional(),
            tipoDePrecio: z.string().optional(),
            tipoDeIngreso: z.string().optional(),
            venta: z.number().optional(),
            rtl: z.number().optional(),
            ppd: z.number().optional(),
            rbp: z.number().optional(),
            tipoDeCambio: z.number().optional(),
            valorRecibido: z.number().optional(),
            regaliasArtisticas: z.number().optional(),
            costoDistribucion: z.number().optional(),
            copyright: z.number().optional(),
            cuotaAdministracion: z.number().optional(),
            costoCarga: z.number().optional(),
            otrosCostos: z.number().optional(),
            ingresosRecibidos: z.number().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { distributions } = input;
      // Verify permissions if it's a team operation
      if (teamId && ctx.teamId !== teamId) {
        throw new Error('No tienes permisos para crear distribution statements en este equipo');
      }

      // For large datasets, process in smaller chunks
      const BATCH_SIZE = 25; // Process 25 records at a time
      let totalCreated = 0;

      // Process distributions in batches to avoid transaction timeouts
      for (let i = 0; i < distributions.length; i += BATCH_SIZE) {
        const batch = distributions.slice(i, i + BATCH_SIZE);

        // Process each batch in its own transaction
        const result = await prisma.$transaction(
          async (tx) => {
            const createdDistributions = [];

            for (const distributionData of batch) {
              // Create the distribution statement with related records
              const distribution = await tx.distributionStatement.create({
                data: {
                  ...distributionData,
                  userId,
                  teamId,
                  // Create music platform relationship if territorio exists
                  ...(distributionData.territorio && {
                    distributionStatementMusicPlatforms: {
                      create: {
                        name: distributionData.territorio || '',
                        user: {
                          connect: { id: userId },
                        },
                        team: { connect: { id: teamId } },
                        platform: {
                          connectOrCreate: {
                            where: { name: distributionData.territorio.trim() },
                            create: {
                              name: distributionData.territorio.trim(),
                              user: {
                                connect: { id: userId },
                              },
                              team: { connect: { id: teamId } },
                            },
                          },
                        },
                      },
                    },
                  }),
                  // Create territory relationship if nombreDelTerritorio exists
                  ...(distributionData.nombreDelTerritorio && {
                    distributionStatementTerritories: {
                      create: {
                        name: distributionData.nombreDelTerritorio || '',
                        user: {
                          connect: { id: userId },
                        },
                        team: { connect: { id: teamId } },
                        territory: {
                          connectOrCreate: {
                            where: { name: distributionData.nombreDelTerritorio.trim() },
                            create: {
                              name: distributionData.nombreDelTerritorio.trim(),
                              user: {
                                connect: { id: userId },
                              },
                              team: { connect: { id: teamId } },
                            },
                          },
                        },
                      },
                    },
                  }),
                },
              });

              createdDistributions.push(distribution);
            }

            return createdDistributions;
          },
          { timeout: 60000 }, // 60 second timeout for each batch
        );

        totalCreated += result.length;
        console.log(`Batch processed: ${i}-${i + batch.length}, created: ${result.length}`);
      }

      return totalCreated;
    }),
  // uploadTemplate: authenticatedProcedure

  // uploadBulkSend: authenticatedProcedure
  //   .input(
  //     z.object({
  //       taskId: z.number(),
  //       teamId: z.number().optional(),
  //       csv: z.string().min(1),
  //       sendImmediately: z.boolean(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const { taskId, teamId, csv, sendImmediately } = input;
  //     const { user } = ctx;

  //     if (csv.length > 4 * 1024 * 1024) {
  //       throw new TRPCError({
  //         code: 'BAD_REQUEST',
  //         message: 'File size exceeds 4MB limit',
  //       });
  //     }

  //     const task = await getTemplateById({
  //       id: taskId,
  //       teamId,
  //       userId: user.id,
  //     });

  //     if (!task) {
  //       throw new TRPCError({
  //         code: 'NOT_FOUND',
  //         message: 'Template not found',
  //       });
  //     }

  //     await jobs.triggerJob({
  //       name: 'internal.bulk-send-template',
  //       payload: {
  //         userId: user.id,
  //         teamId,
  //         taskId,
  //         csvContent: csv,
  //         sendImmediately,
  //         requestMetadata: ctx.metadata.requestMetadata,
  //       },
  //     });

  //     return { success: true };
  //   }),
});
