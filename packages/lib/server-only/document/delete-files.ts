import type { Files, Team, TeamGlobalSettings, User } from '@prisma/client';

import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';
import type { ApiRequestMetadata } from '../../universal/extract-request-metadata';
import { getPresignGetUrl } from '../../universal/upload/server-actions';
import { getMemberRoles } from '../team/get-member-roles';
import { deleteFile } from './DeleteObjectS3';

export type DeleteFilesOptions = {
  id: number;
  userId: number;
  teamId?: number;
  requestMetadata: ApiRequestMetadata;
};

export const deleteFiles = async ({ id, userId, teamId, requestMetadata }: DeleteFilesOptions) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'User not found',
    });
  }

  const document = await prisma.files.findUnique({
    where: {
      id,
    },
  });

  if (!document || (teamId !== undefined && teamId !== document.teamId)) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'file not found',
    });
  }

  const fileData = await prisma.documentData.findUnique({
    where: {
      id: document.fileDataId,
    },
  });

  if (!fileData) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'File data not found',
    });
  }

  try {
    const { url } = await getPresignGetUrl(fileData?.data);
    await deleteFile(url);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Failed to delete file from storage',
    });
  }

  const isUserOwner = document.userId === userId;
  const isUserTeamMember = await getMemberRoles({
    teamId: document.teamId,
    reference: {
      type: 'User',
      id: userId,
    },
  })
    .then(() => true)
    .catch(() => false);
  if (!isUserOwner && !isUserTeamMember) {
    throw new AppError(AppErrorCode.UNAUTHORIZED, {
      message: 'Not allowed',
    });
  }

  // Handle hard or soft deleting the actual document if user has permission.
  if (isUserOwner || isUserTeamMember) {
    await handleDocumentOwnerDelete({
      document,
      user,
      requestMetadata,
    });
  }

  // Return partial document for API v1 response.
  return {
    id: document.id,
    userId: document.userId,
    teamId: document.teamId,
    title: document.title,
    status: document.status,
    documentDataId: document.fileDataId,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    completedAt: document.completedAt,
  };
};

type HandleDocumentOwnerDeleteOptions = {
  document: Files;
  team?:
    | (Team & {
        teamGlobalSettings?: TeamGlobalSettings | null;
      })
    | null;
  user: User;
  requestMetadata: ApiRequestMetadata;
};

const handleDocumentOwnerDelete = async ({
  document,
  user,
  team,
  requestMetadata,
}: HandleDocumentOwnerDeleteOptions) => {
  if (document.deletedAt) {
    return;
  }

  // // Soft delete completed documents.
  // if (isDocumentCompleted(document.status)) {
  //   return await prisma.$transaction(async (tx) => {

  //     return await tx.document.update({
  //       where: {
  //         id: document.id,
  //       },
  //       data: {
  //         deletedAt: new Date().toISOString(),
  //       },
  //     });
  //   });
  // }

  const deletedDocument = await prisma.$transaction(async (tx) => {
    return await tx.files.delete({
      where: {
        id: document.id,
      },
    });
  });

  return deletedDocument;
};
