import { z } from 'zod';

import { AllMusicSchema } from '@documenso/prisma/generated/zod/modelSchema/AllMusicSchema';

const ZArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const ZVideoLinkPlatformSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
});

const ZGeneralLinkSchema = z.object({
  id: z.number(),
  name: z.string(),
  url: z.string(),
});

export const ZAllMusicSchema = AllMusicSchema.pick({
  id: true,
  title: true,
  isrcSong: true,
  isrcVideo: true,
  UPC: true,
  publishedAt: true,
  agregadoraPercentage: true,
  distribuidorPercentage: true,
  catalog: true,
  recordLabelId: true,
}).extend({
  artists: z.array(ZArtistSchema).optional(),
  generalLinks: z.array(ZGeneralLinkSchema).optional(),
  videoLinks: z.array(ZVideoLinkPlatformSchema).optional(),
  agregadora: ZArtistSchema.optional(),
  distribuidor: ZArtistSchema.optional(),
  recordLabel: ZArtistSchema.optional(),
});

export const ZAllMusicSchemaUpdateSchema = AllMusicSchema.pick({
  id: true,
  title: true,
  isrcSong: true,
  isrcVideo: true,
  UPC: true,
  publishedAt: true,
  agregadoraPercentage: true,
  distribuidorPercentage: true,
  catalog: true,
  recordLabelId: true,
  teamId: true,
  userId: true,
  createdAt: true,
  deletedAt: true,
}).extend({
  artists: z.array(ZArtistSchema).optional(),
  artistsToUpdate: z.array(z.string()).optional(),
  generalLinks: z.array(ZGeneralLinkSchema).optional(),
  generalLinksUpdate: z.array(z.string()).optional(),
  videoLinks: z.array(ZVideoLinkPlatformSchema).optional(),
  videoLinksUpdate: z.array(z.string()).optional(),
  agregadora: ZArtistSchema.optional(),
  distrubidor: ZArtistSchema.optional(),
});

export type TAllMusic = z.infer<typeof ZAllMusicSchema>;
export type TAllMusicUpdate = z.infer<typeof ZAllMusicSchemaUpdateSchema>;
/**
 * A lite version of the response schema without relations.
 */
export const ZAllMusicSchemaLite = ZAllMusicSchema.pick({
  id: true,
  title: true,
  isrcSong: true,
  isrcVideo: true,
  UPC: true,
  publishedAt: true,
  agregadoraPercentage: true,
  distribuidorPercentage: true,
  catalog: true,
  artists: true,
});

export type TAllMusicLite = z.infer<typeof ZAllMusicSchemaLite>;
