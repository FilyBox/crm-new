// If you need Prisma types, import them directly from "@prisma/client"
import { z } from 'zod';

import { findAllLpm } from '@documenso/lib/server-only/document/find-all-lpm';
import { findLpm } from '@documenso/lib/server-only/document/find-lpm';
import { prisma } from '@documenso/prisma';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';
import type { Prisma } from '.prisma/client';

export type GetLpmByIdOptions = {
  id: number;
  productId: string;
  productType: string;
  productTitle: string;
  productVersion?: string;
  productDisplayArtist: string;
  parentLabel?: string;
  label: string;
  originalReleaseDate?: string;
  releaseDate: string;
  upc: string;
  catalog: string;
  productPriceTier?: string;
  productGenre?: string;
  submissionStatus: string;
  productCLine: string;
  productPLine: string;
  preOrderDate?: string;
  exclusives?: string;
  explicitLyrics: string;
  productPlayLink?: string;
  linerNotes?: string;
  primaryMetadataLanguage: string;
  compilation?: string;
  pdfBooklet?: string;
  timedReleaseDate?: string;
  timedReleaseMusicServices?: string;
  lastProcessDate: string;
  importDate: string;
  createdBy: string;
  lastModified: string;
  submittedAt: string;
  submittedBy?: string;
  vevoChannel?: string;
  trackType: string;
  trackId: string;
  trackVolume?: boolean;
  trackNumber: string;
  trackName: string;
  trackVersion?: string;
  trackDisplayArtist: string;
  isrc: string;
  trackPriceTier?: string;
  trackGenre: string;
  audioLanguage: string;
  trackCLine: string;
  trackPLine: string;
  writersComposers: string;
  publishersCollectionSocieties: string;
  withholdMechanicals: string;
  preOrderType?: string;
  instantGratificationDate: string;
  duration: string;
  sampleStartTime: string;
  explicitLyricsTrack: string;
  albumOnly: string;
  lyrics?: string;
  additionalContributorsPerforming?: string;
  additionalContributorsNonPerforming?: string;
  producers?: string;
  continuousMix: string;
  continuouslyMixedIndividualSong: string;
  trackPlayLink: string;
};

export const lpmRouter = router({
  createLpm: authenticatedProcedure
    .input(
      z.object({
        productId: z.string().optional().nullable(),
        productType: z.string().optional().nullable(),
        productTitle: z.string().optional().nullable(),
        productVersion: z.string().optional().nullable(),
        productDisplayArtist: z.string().optional().nullable(),
        parentLabel: z.string().optional().nullable(),
        label: z.string().optional().nullable(),
        artistsToUpdate: z.array(z.string()).optional(),

        // artists: z
        //   .array(
        //     z.object({
        //       id: z.number(),
        //       artistName: z.string().nullable(),
        //     }),
        //   )
        //   .optional(),
        originalReleaseDate: z.date().optional().nullable(),
        releaseDate: z.date().optional().nullable(),
        upc: z.string().optional().nullable(),
        catalog: z.string().optional().nullable(),
        productPriceTier: z.string().optional().nullable(),
        productGenre: z.string().optional().nullable(),
        submissionStatus: z.string().optional().nullable(),
        productCLine: z.string().optional().nullable(),
        productPLine: z.string().optional().nullable(),
        preOrderDate: z.date().optional().nullable(),
        exclusives: z.string().optional().nullable(),
        explicitLyrics: z.string().optional().nullable(),
        productPlayLink: z.string().optional().nullable(),
        linerNotes: z.string().optional().nullable(),
        primaryMetadataLanguage: z.string().optional().nullable(),
        compilation: z.string().optional().nullable(),
        pdfBooklet: z.string().optional().nullable(),
        timedReleaseDate: z.date().optional().nullable(),
        timedReleaseMusicServices: z.date().optional().nullable(),
        lastProcessDate: z.date().optional().nullable(),
        importDate: z.date().optional().nullable(),
        createdBy: z.string().optional().nullable(),
        lastModified: z.date().optional().nullable(),
        submittedAt: z.date().optional().nullable(),
        submittedBy: z.string().optional().nullable(),
        vevoChannel: z.string().optional().nullable(),
        trackType: z.string().optional().nullable(),
        trackId: z.string().optional().nullable(),
        trackVolume: z.boolean().optional(),
        trackNumber: z.string().optional().nullable(),
        trackName: z.string().optional().nullable(),
        trackVersion: z.string().optional().nullable(),
        trackDisplayArtist: z.string().optional().nullable(),
        isrc: z.string().optional().nullable(),
        trackPriceTier: z.string().optional().nullable(),
        trackGenre: z.string().optional().nullable(),
        audioLanguage: z.string().optional().nullable(),
        trackCLine: z.string().optional().nullable(),
        trackPLine: z.string().optional().nullable(),
        writersComposers: z.string().optional().nullable(),
        publishersCollectionSocieties: z.string().optional().nullable(),
        withholdMechanicals: z.string().optional().nullable(),
        preOrderType: z.string().optional().nullable(),
        instantGratificationDate: z.date().optional().nullable(),
        duration: z.string().optional().nullable(),
        sampleStartTime: z.string().optional().nullable(),
        explicitLyricsTrack: z.string().optional().nullable(),
        albumOnly: z.string().optional().nullable(),
        lyrics: z.string().optional().nullable(),
        additionalContributorsPerforming: z.string().optional().nullable(),
        additionalContributorsNonPerforming: z.string().optional().nullable(),
        producers: z.string().optional().nullable(),
        continuousMix: z.string().optional().nullable(),
        continuouslyMixedIndividualSong: z.string().optional().nullable(),
        trackPlayLink: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const userId = user.id;
      const { artistsToUpdate, ...data } = input;

      return await prisma.lpm.create({
        // data: {
        //   ...cleanedInput,
        //   userId,
        //   ...(teamId ? { teamId } : {}), // Add teamId if it exists
        // } as unknown as Prisma.lpmCreateInput,
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
          // productDisplayArtist:
          //   artistsToUpdate && artistsToUpdate.length > 0
          //     ? {
          //         create: artistsToUpdate.map((artistId) => ({
          //           artistName: '',

          //           user: {
          //             connect: { id: userId },
          //           },
          //           ...(teamId ? { team: { connect: { id: teamId } } } : {}),
          //           artist: {
          //             connect: {
          //               id: Number(artistId),
          //             },
          //           },
          //         })),
          //       }
          //     : undefined,

          // productDisplayArtist: {
          //   create:
          //     artists?.map((artist) => ({
          //       artistName: artist.artistName?.trim() || '',
          //       user: {
          //         connect: { id: userId },
          //       },
          //       ...(teamId ? { team: { connect: { id: teamId } } } : {}),
          //       artist: {
          //         connectOrCreate: {
          //           where: { name: artist.artistName?.trim() || '' },
          //           create: {
          //             name: artist.artistName?.trim() || '',
          //             user: {
          //               connect: { id: userId },
          //             },
          //             ...(teamId ? { team: { connect: { id: teamId } } } : {}),
          //           },
          //         },
          //       },
          //     })) || [],
          // },
        },
      });
    }),

  createManyMusic: authenticatedProcedure
    .input(
      z.object({
        music: z.array(
          z.object({
            productId: z.string().optional().nullable(),
            productType: z.string().optional().nullable(),
            productTitle: z.string().optional().nullable(),
            productVersion: z.string().optional().nullable(),
            productDisplayArtist: z.string().optional().nullable(),
            parentLabel: z.string().optional().nullable(),
            label: z.string().optional().nullable(),
            artistsToUpdate: z.array(z.string()).optional(),

            artists: z
              .array(
                z.object({
                  id: z.number(),
                  artistName: z.string().nullable(),
                }),
              )
              .optional(),
            originalReleaseDate: z.date().optional().nullable(),
            releaseDate: z.date().optional().nullable(),
            upc: z.string().optional().nullable(),
            catalog: z.string().optional().nullable(),
            productPriceTier: z.string().optional().nullable(),
            productGenre: z.string().optional().nullable(),
            submissionStatus: z.string().optional().nullable(),
            productCLine: z.string().optional().nullable(),
            productPLine: z.string().optional().nullable(),
            preOrderDate: z.date().optional().nullable(),
            exclusives: z.string().optional().nullable(),
            explicitLyrics: z.string().optional().nullable(),
            productPlayLink: z.string().optional().nullable(),
            linerNotes: z.string().optional().nullable(),
            primaryMetadataLanguage: z.string().optional().nullable(),
            compilation: z.string().optional().nullable(),
            pdfBooklet: z.string().optional().nullable(),
            timedReleaseDate: z.date().optional().nullable(),
            timedReleaseMusicServices: z.date().optional().nullable(),
            lastProcessDate: z.date().optional().nullable(),
            importDate: z.date().optional().nullable(),
            createdBy: z.string().optional().nullable(),
            lastModified: z.date().optional().nullable(),
            submittedAt: z.date().optional().nullable(),
            submittedBy: z.string().optional().nullable(),
            vevoChannel: z.string().optional().nullable(),
            trackType: z.string().optional().nullable(),
            trackId: z.string().optional().nullable(),
            trackVolume: z.boolean().optional(),
            trackNumber: z.string().optional().nullable(),
            trackName: z.string().optional().nullable(),
            trackVersion: z.string().optional().nullable(),
            trackDisplayArtist: z.string().optional().nullable(),
            isrc: z.string().optional().nullable(),
            trackPriceTier: z.string().optional().nullable(),
            trackGenre: z.string().optional().nullable(),
            audioLanguage: z.string().optional().nullable(),
            trackCLine: z.string().optional().nullable(),
            trackPLine: z.string().optional().nullable(),
            writersComposers: z.string().optional().nullable(),
            publishersCollectionSocieties: z.string().optional().nullable(),
            withholdMechanicals: z.string().optional().nullable(),
            preOrderType: z.string().optional().nullable(),
            instantGratificationDate: z.date().optional().nullable(),
            duration: z.string().optional().nullable(),
            sampleStartTime: z.string().optional().nullable(),
            explicitLyricsTrack: z.string().optional().nullable(),
            albumOnly: z.string().optional().nullable(),
            lyrics: z.string().optional().nullable(),
            additionalContributorsPerforming: z.string().optional().nullable(),
            additionalContributorsNonPerforming: z.string().optional().nullable(),
            producers: z.string().optional().nullable(),
            continuousMix: z.string().optional().nullable(),
            continuouslyMixedIndividualSong: z.string().optional().nullable(),
            trackPlayLink: z.string().optional().nullable(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { music } = input;
      const { user, teamId } = ctx;
      const userId = user.id;

      // Process in batches to avoid timeout
      const BATCH_SIZE = 30; // Adjust based on your needs
      const allResults = [];

      for (let i = 0; i < music.length; i += BATCH_SIZE) {
        const batch = music.slice(i, i + BATCH_SIZE);

        const batchResults = await prisma.$transaction(
          async (prismaClient) => {
            const createdRecords = [];
            for (const file of batch) {
              const { artists, ...fileData } = file;
              const result = await prismaClient.lpm.create({
                data: {
                  ...fileData,
                  user: {
                    connect: { id: userId },
                  },
                  team: { connect: { id: teamId } },
                  artists: {
                    create: (file.trackDisplayArtist?.split(',') || []).map((artistName) => ({
                      name: artistName.trim(),
                      user: {
                        connect: { id: userId },
                      },
                      team: { connect: { id: teamId } },
                    })),
                  },
                },
              });
              createdRecords.push(result);
            }
            return createdRecords;
          },
          {
            maxWait: 10000, // 10 seconds
            timeout: 30000, // 30 seconds
          },
        );

        allResults.push(...batchResults);
      }
      return allResults.length;
    }),

  findLpmUniqueArtists: authenticatedProcedure.query(async ({ ctx }) => {
    const { teamId } = ctx;

    const [productDisplayArtist, artists] = await Promise.all([
      prisma.lpm.findMany({
        where: {
          teamId,
        },
        select: {
          artists: {
            select: {
              id: true,
              name: true,
            },
            distinct: ['name'],
          },
        },
      }),
      prisma.artist.findMany({
        where: {
          teamId,
        },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    // Get all artists from lpm entries
    const allArtistsList = productDisplayArtist.flatMap((lpm) => lpm.artists);

    // Combine with standalone artists and remove duplicates by ID
    const uniqueArtistsMap = new Map();

    // First add all artists from productDisplayArtist
    allArtistsList.forEach((artist) => {
      if (artist && artist.id) {
        uniqueArtistsMap.set(artist.id, artist);
      }
    });

    // Then add artists from the artists table (if not already included)
    artists.forEach((artist) => {
      if (artist && artist.id && !uniqueArtistsMap.has(artist.id)) {
        uniqueArtistsMap.set(artist.id, artist);
      }
    });

    // Convert Map values to array
    const uniqueArtists = Array.from(uniqueArtistsMap.values());

    return { artists: uniqueArtists };
    // const allArtistsList = productDisplayArtist.flatMap((lpm) => lpm.artists);
    // const fusionAllArtistsListAndArtists = [...allArtistsList, ...artists];

    // return { artists: fusionAllArtistsListAndArtists };
  }),

  findLpmById: authenticatedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { id } = input;
      return await prisma.lpm.findUnique({
        where: { id },
        // include: {

        // },
      });
    }),
  findLpm: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        orderBy: z.enum(['createdAt', 'updatedAt']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'productId',
            'productType',
            'productTitle',
            'productVersion',
            'productDisplayArtist',
            'parentLabel',
            'label',
            'originalReleaseDate',
            'releaseDate',
            'upc',
            'catalog',
            'productPriceTier',
            'productGenre',
            'submissionStatus',
            'productCLine',
            'productPLine',
            'preOrderDate',
            'exclusives',
            'explicitLyrics',
            'additionalContributorsNonPerforming',
            'additionalContributorsPerforming',
            'albumOnly',
            'audioLanguage',
            'compilation',
            'continuousMix',
            'createdBy',
            'duration',
            'importDate',
            'explicitLyricsTrack',
            'instantGratificationDate',
            'lastModified',
            'lastProcessDate',
            'linerNotes',
            'isrc',
            'lyrics',
            'producers',
            'sampleStartTime',
            'trackCLine',
            'trackId',
            'trackGenre',
            'trackName',
            'trackNumber',
            'trackPLine',
            'trackPriceTier',
            'trackType',
            'trackVolume',
            'writersComposers',
            'timedReleaseDate',
            'timedReleaseMusicServices',
            'pdfBooklet',
            'preOrderType',
            'submittedAt',
            'productPlayLink',
            'publishersCollectionSocieties',
            'trackDisplayArtist',
            'submittedBy',
            'continuouslyMixedIndividualSong',
            'primaryMetadataLanguage',
            'trackVersion',
            'vevoChannel',
            'trackPlayLink',
            'withholdMechanicals',
            'teamId',
            'userId',
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
        page,
        perPage,
        orderByColumn,
        artistIds,
        orderByDirection,
        period,
        filterStructure,
        joinOperator,
      } = input;

      const { user, teamId } = ctx;
      const userId = user.id;

      let where: Prisma.lpmWhereInput = {};

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        where = advancedWhere;
      }

      const [documents, artists] = await Promise.all([
        findLpm({
          query,
          where,
          artistIds,
          page,
          perPage,
          userId,
          teamId,
          period,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
        prisma.artist.findMany({
          where: {
            teamId,
          },
          select: {
            id: true,
            name: true,
          },
        }),
      ]);
      return { records: documents, artists };
    }),

  findAllLpm: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        orderBy: z.enum(['createdAt', 'updatedAt']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
            'id',
            'productId',
            'productType',
            'productTitle',
            'productVersion',
            'productDisplayArtist',
            'parentLabel',
            'label',
            'originalReleaseDate',
            'releaseDate',
            'upc',
            'catalog',
            'productPriceTier',
            'productGenre',
            'submissionStatus',
            'productCLine',
            'productPLine',
            'preOrderDate',
            'exclusives',
            'explicitLyrics',
            'additionalContributorsNonPerforming',
            'additionalContributorsPerforming',
            'albumOnly',
            'audioLanguage',
            'compilation',
            'continuousMix',
            'createdBy',
            'duration',
            'importDate',
            'explicitLyricsTrack',
            'instantGratificationDate',
            'lastModified',
            'lastProcessDate',
            'linerNotes',
            'isrc',
            'lyrics',
            'producers',
            'sampleStartTime',
            'trackCLine',
            'trackId',
            'trackGenre',
            'trackName',
            'trackNumber',
            'trackPLine',
            'trackPriceTier',
            'trackType',
            'trackVolume',
            'writersComposers',
            'timedReleaseDate',
            'timedReleaseMusicServices',
            'pdfBooklet',
            'preOrderType',
            'submittedAt',
            'productPlayLink',
            'publishersCollectionSocieties',
            'trackDisplayArtist',
            'submittedBy',
            'continuouslyMixedIndividualSong',
            'primaryMetadataLanguage',
            'trackVersion',
            'vevoChannel',
            'trackPlayLink',
            'withholdMechanicals',
            'teamId',
            'userId',
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
    .mutation(async ({ input, ctx }) => {
      const {
        query,
        orderByColumn,
        artistIds,
        orderByDirection,
        period,
        filterStructure,
        joinOperator,
      } = input;

      const { user, teamId } = ctx;
      const userId = user.id;

      let where: Prisma.lpmWhereInput = {};

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
        findAllLpm({
          query,
          where,
          artistIds,
          userId,
          teamId,
          period,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);
      return documents;
    }),

  updateLpmById: authenticatedProcedure
    .input(
      z.object({
        id: z.number(),
        productId: z.string().optional().nullable(),
        productType: z.string().optional().nullable(),
        productTitle: z.string().optional().nullable(),
        productVersion: z.string().optional().nullable(),
        productDisplayArtist: z.string().optional().nullable(),
        parentLabel: z.string().optional().nullable(),
        label: z.string().optional().nullable(),
        artistsToUpdate: z.array(z.string()).optional(),
        artists: z
          .array(
            z.object({
              id: z.number(),
              name: z.string().nullable(),
            }),
          )
          .optional(),
        originalReleaseDate: z.date().optional().nullable(),
        releaseDate: z.date().optional().nullable(),
        upc: z.string().optional().nullable(),
        catalog: z.string().optional().nullable(),
        productPriceTier: z.string().optional().nullable(),
        productGenre: z.string().optional().nullable(),
        submissionStatus: z.string().optional().nullable(),
        productCLine: z.string().optional().nullable(),
        productPLine: z.string().optional().nullable(),
        preOrderDate: z.date().optional().nullable(),
        exclusives: z.string().optional().nullable(),
        explicitLyrics: z.string().optional().nullable(),
        productPlayLink: z.string().optional().nullable(),
        linerNotes: z.string().optional().nullable(),
        primaryMetadataLanguage: z.string().optional().nullable(),
        compilation: z.string().optional().nullable(),
        pdfBooklet: z.string().optional().nullable(),
        timedReleaseDate: z.date().optional().nullable(),
        timedReleaseMusicServices: z.date().optional().nullable(),
        lastProcessDate: z.date().optional().nullable(),
        importDate: z.date().optional().nullable(),
        createdBy: z.string().optional().nullable(),
        lastModified: z.date().optional().nullable(),
        submittedAt: z.date().optional().nullable(),
        submittedBy: z.string().optional().nullable(),
        vevoChannel: z.string().optional().nullable(),
        trackType: z.string().optional().nullable(),
        trackId: z.string().optional().nullable(),
        trackVolume: z.boolean().optional(),
        trackNumber: z.string().optional().nullable(),
        trackName: z.string().optional().nullable(),
        trackVersion: z.string().optional().nullable(),
        trackDisplayArtist: z.string().optional().nullable(),
        isrc: z.string().optional().nullable(),
        trackPriceTier: z.string().optional().nullable(),
        trackGenre: z.string().optional().nullable(),
        audioLanguage: z.string().optional().nullable(),
        trackCLine: z.string().optional().nullable(),
        trackPLine: z.string().optional().nullable(),
        writersComposers: z.string().optional().nullable(),
        publishersCollectionSocieties: z.string().optional().nullable(),
        withholdMechanicals: z.string().optional().nullable(),
        preOrderType: z.string().optional().nullable(),
        instantGratificationDate: z.date().optional().nullable(),
        duration: z.string().optional().nullable(),
        sampleStartTime: z.string().optional().nullable(),
        explicitLyricsTrack: z.string().optional().nullable(),
        albumOnly: z.string().optional().nullable(),
        lyrics: z.string().optional().nullable(),
        additionalContributorsPerforming: z.string().optional().nullable(),
        additionalContributorsNonPerforming: z.string().optional().nullable(),
        producers: z.string().optional().nullable(),
        continuousMix: z.string().optional().nullable(),
        continuouslyMixedIndividualSong: z.string().optional().nullable(),
        trackPlayLink: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, artistsToUpdate, artists, ...data } = input;
      console.log('attached artists', artists);
      console.log('artistsToUpdate', artistsToUpdate);
      console.log('id', id);
      if (artists && artistsToUpdate) {
        console.log('artists to disconnect', artists);
        console.log('artists to connect', artistsToUpdate);
        await prisma.lpm.update({
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
        await prisma.lpm.update({
          where: { id },
          data: {
            artists: {
              connect: artistsToUpdate.map((artistId) => ({ id: Number(artistId) })),
            },
          },
        });
      }
      const pepe = await prisma.lpm.update({
        where: { id },
        data: {
          ...data,
        },
      });

      return pepe;
    }),
  deleteLpmById: authenticatedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id } = input;
      return await prisma.lpm.delete({
        where: { id },
      });
    }),

  deleteMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;
      const deleted = await prisma.lpm.deleteMany({
        where: { id: { in: ids } },
      });

      return deleted;
    }),
});
