import type { EventColor } from '@prisma/client';
import { TeamMemberRole } from '@prisma/client';
import { match } from 'ts-pattern';

export function canPerformAction({ teamMemberRole }: { teamMemberRole: TeamMemberRole }) {
  return match(teamMemberRole)
    .with(TeamMemberRole.ADMIN, () => true)
    .with(TeamMemberRole.MANAGER, () => true)
    .with(TeamMemberRole.MEMBER, () => false)
    .otherwise(() => true);
}

export function canPerformManagerAndAboveAction({
  teamMemberRole,
}: {
  teamMemberRole: TeamMemberRole;
}) {
  return match(teamMemberRole)
    .with(TeamMemberRole.ADMIN, () => true)
    .with(TeamMemberRole.MANAGER, () => true)
    .with(TeamMemberRole.MEMBER, () => false)
    .otherwise(() => true);
}

export function canPerformAdminAction({ teamMemberRole }: { teamMemberRole: TeamMemberRole }) {
  return match(teamMemberRole)
    .with(TeamMemberRole.ADMIN, () => true)
    .with(TeamMemberRole.MANAGER, () => false)
    .with(TeamMemberRole.MEMBER, () => false)
    .otherwise(() => true);
}

export const colorOptions: Array<{
  value: EventColor;
  label: string;
  bgClass: string;
  borderClass: string;
}> = [
  {
    value: 'blue',
    label: 'Blue',
    bgClass: 'bg-blue-400 data-[state=checked]:bg-blue-400',
    borderClass: 'border-blue-400 data-[state=checked]:border-blue-400',
  },
  {
    value: 'violet',
    label: 'Violet',
    bgClass: 'bg-violet-400 data-[state=checked]:bg-violet-400',
    borderClass: 'border-violet-400 data-[state=checked]:border-violet-400',
  },
  {
    value: 'rose',
    label: 'Rose',
    bgClass: 'bg-rose-400 data-[state=checked]:bg-rose-400',
    borderClass: 'border-rose-400 data-[state=checked]:border-rose-400',
  },
  {
    value: 'emerald',
    label: 'Emerald',
    bgClass: 'bg-emerald-400 data-[state=checked]:bg-emerald-400',
    borderClass: 'border-emerald-400 data-[state=checked]:border-emerald-400',
  },
  {
    value: 'orange',
    label: 'Orange',
    bgClass: 'bg-orange-400 data-[state=checked]:bg-orange-400',
    borderClass: 'border-orange-400 data-[state=checked]:border-orange-400',
  },
  {
    value: 'sky',
    label: 'Sky',
    bgClass: 'bg-sky-400 data-[state=checked]:bg-sky-400',
    borderClass: 'border-sky-400 data-[state=checked]:border-sky-400',
  },
];
