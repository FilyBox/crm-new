import { z } from 'zod';

import { TaskSchema } from '@documenso/prisma/generated/zod/modelSchema/TaskSchema';
import { TeamSchema } from '@documenso/prisma/generated/zod/modelSchema/TeamSchema';
import { UserSchema } from '@documenso/prisma/generated/zod/modelSchema/UserSchema';
import { lpmSchema } from '@documenso/prisma/generated/zod/modelSchema/lpmSchema';

/**
 * The full document response schema.
 *
 * Mainly used for returning a single document from the API.
 */
const ZArtistSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const ZLpmSchema = lpmSchema
  .pick({
    id: true,
    productId: true,
    productType: true,
    productTitle: true,
    productVersion: true,
    parentLabel: true,
    label: true,
    originalReleaseDate: true,
    releaseDate: true,
    upc: true,
    catalog: true,
    productPriceTier: true,
    productGenre: true,
    submissionStatus: true,
    productCLine: true,
    productPLine: true,
    preOrderDate: true,
    exclusives: true,
    explicitLyrics: true,
    additionalContributorsNonPerforming: true,
    additionalContributorsPerforming: true,
    albumOnly: true,
    audioLanguage: true,
    compilation: true,
    continuousMix: true,
    createdBy: true,
    duration: true,
    importDate: true,
    explicitLyricsTrack: true,
    instantGratificationDate: true,
    lastModified: true,
    lastProcessDate: true,
    linerNotes: true,
    isrc: true,
    lyrics: true,
    producers: true,
    sampleStartTime: true,
    trackCLine: true,
    trackId: true,
    trackGenre: true,
    trackName: true,
    trackNumber: true,
    trackPLine: true,
    trackPriceTier: true,
    trackType: true,
    trackVolume: true,
    writersComposers: true,
    timedReleaseDate: true,
    timedReleaseMusicServices: true,
    pdfBooklet: true,
    preOrderType: true,
    submittedAt: true,
    productPlayLink: true,
    publishersCollectionSocieties: true,
    trackDisplayArtist: true,
    submittedBy: true,
    continuouslyMixedIndividualSong: true,
    primaryMetadataLanguage: true,
    trackVersion: true,
    vevoChannel: true,
    trackPlayLink: true,
    withholdMechanicals: true,
    teamId: true,
    userId: true,
  })
  .extend({
    productDisplayArtist: z.array(ZArtistSchema).optional(),
    artistsToUpdate: z.array(z.string()).optional(),
  });

export type TLpm = z.infer<typeof ZLpmSchema>;

/**
 * A lite version of the document response schema without relations.
 */
export const ZDocumentLiteSchema = TaskSchema.pick({
  id: true,
  externalId: true,
  userId: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  tags: true,
  projectId: true,
  parentTaskId: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  deletedAt: true,
  teamId: true,
});

export type TTaskLite = z.infer<typeof ZDocumentLiteSchema>;

/**
 * A version of the document response schema when returning multiple documents at once from a single API endpoint.
 */
export const ZTaskManySchema = TaskSchema.pick({
  id: true,
  externalId: true,
  userId: true,
  description: true,
  priority: true,
  status: true,
  dueDate: true,
  tags: true,
  projectId: true,
  parentTaskId: true,
  title: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  deletedAt: true,
  teamId: true,
}).extend({
  user: UserSchema.pick({
    id: true,
    name: true,
    email: true,
  }),
  team: TeamSchema.pick({
    id: true,
    url: true,
  }).nullable(),
});

export type TDocumentMany = z.infer<typeof ZTaskManySchema>;
