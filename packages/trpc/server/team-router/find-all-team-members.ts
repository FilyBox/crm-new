import { findAllTeamMembers } from '@documenso/lib/server-only/team/find-all-team-members';

import { authenticatedProcedure } from '../trpc';
import { ZFindTeamMembersRequestSchema } from './find-team-members.types';

export const findAllTeamMembersRoute = authenticatedProcedure
  .input(ZFindTeamMembersRequestSchema)
  .query(async ({ input, ctx }) => {
    const { teamId } = input;
    const { user } = ctx;

    ctx.logger.info({
      input: {
        teamId,
      },
    });

    return await findAllTeamMembers({
      userId: user.id,
      teamId,
    });
  });
