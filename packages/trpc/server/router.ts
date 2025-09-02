import { adminRouter } from './admin-router/router';
import { apiTokenRouter } from './api-token-router/router';
import { artistRouter } from './artist-router/router';
import { authRouter } from './auth-router/router';
import { contractsRouter } from './contracts-router/router';
import { distributionRouter } from './distributionStatement-router/router';
import { documentRouter } from './document-router/router';
import { embeddingPresignRouter } from './embedding-router/_router';
import { enterpriseRouter } from './enterprise-router/router';
import { fieldRouter } from './field-router/router';
import { filesRouter } from './files-router/router';
import { folderRouter } from './folder-router/router';
import { IsrcSongsRouter } from './isrcsong-router/router';
import { lpmRouter } from './lpm-router/router';
import { organisationRouter } from './organisation-router/router';
import { profileRouter } from './profile-router/router';
import { recipientRouter } from './recipient-router/router';
import { shareLinkRouter } from './share-link-router/router';
import { teamRouter } from './team-router/router';
import { templateRouter } from './template-router/router';
import { router } from './trpc';
import { tuStreamsRouter } from './tustreams-router/router';
import { webhookRouter } from './webhook-router/router';

export const appRouter = router({
  enterprise: enterpriseRouter,
  auth: authRouter,
  profile: profileRouter,
  document: documentRouter,
  field: fieldRouter,
  folder: folderRouter,
  recipient: recipientRouter,
  admin: adminRouter,
  organisation: organisationRouter,
  shareLink: shareLinkRouter,
  apiToken: apiTokenRouter,
  team: teamRouter,
  template: templateRouter,
  webhook: webhookRouter,
  embeddingPresign: embeddingPresignRouter,
  files: filesRouter,
  contracts: contractsRouter,
  lpm: lpmRouter,
  artist: artistRouter,
  tuStreams: tuStreamsRouter,
  distribution: distributionRouter,
  isrcSongs: IsrcSongsRouter,
});

export type AppRouter = typeof appRouter;
