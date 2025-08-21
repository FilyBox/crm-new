import { TeamMemberRole } from '@prisma/client';
import { match } from 'ts-pattern';

export function canPerformAction({ teamMemberRole }: { teamMemberRole: TeamMemberRole }) {
  return match(teamMemberRole)
    .with(TeamMemberRole.ADMIN, () => true)
    .with(TeamMemberRole.MANAGER, () => true)
    .with(TeamMemberRole.MEMBER, () => false)
    .otherwise(() => true);
}
