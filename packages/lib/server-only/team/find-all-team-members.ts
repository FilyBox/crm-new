import { Prisma } from '@prisma/client';

import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';
import { getHighestOrganisationRoleInGroup } from '../../utils/organisations';
import { getHighestTeamRoleInGroup } from '../../utils/teams';

export interface FindTeamMembersOptions {
  userId: number;
  teamId: number;
}

export const findAllTeamMembers = async ({ userId, teamId }: FindTeamMembersOptions) => {
  const orderByColumn = 'name';
  const orderByDirection = 'desc';

  // Check that the user belongs to the team they are trying to find members in.
  const userTeam = await prisma.organisationMember.findFirst({
    where: {
      userId,
      organisationGroupMembers: {
        some: {
          group: {
            teamGroups: {
              some: {
                teamId,
              },
            },
          },
        },
      },
    },
  });

  if (!userTeam) {
    throw new AppError(AppErrorCode.UNAUTHORIZED);
  }

  const whereClause: Prisma.OrganisationMemberWhereInput = {
    organisationGroupMembers: {
      some: {
        group: {
          teamGroups: {
            some: {
              teamId,
            },
          },
        },
      },
    },
  };

  let orderByClause: Prisma.OrganisationMemberOrderByWithRelationInput = {};

  // Name field is nested in the user so we have to handle it differently.
  if (orderByColumn === 'name') {
    orderByClause = {
      user: {
        name: orderByDirection,
      },
    };
  }

  const [data, count] = await Promise.all([
    prisma.organisationMember.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarImageId: true,
          },
        },
        organisationGroupMembers: {
          include: {
            group: {
              include: {
                teamGroups: true,
              },
            },
          },
        },
      },
    }),
    prisma.organisationMember.count({
      where: whereClause,
    }),
  ]);

  // same as get-team-members.
  const mappedData = data.map((member) => ({
    id: member.id,
    userId: member.userId,
    createdAt: member.createdAt,
    email: member.user.email,
    name: member.user.name,
    avatarImageId: member.user.avatarImageId,
    // Filter teamGroups to only include the current team
    teamRole: getHighestTeamRoleInGroup(
      member.organisationGroupMembers.flatMap(({ group }) =>
        group.teamGroups.filter((tg) => tg.teamId === teamId),
      ),
    ),
    teamRoleGroupType: member.organisationGroupMembers[0].group.type,
    organisationRole: getHighestOrganisationRoleInGroup(
      member.organisationGroupMembers.flatMap(({ group }) => group),
    ),
  }));

  return {
    data: mappedData,
    count,
  };
};
