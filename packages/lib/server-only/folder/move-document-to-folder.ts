import { TeamMemberRole } from '@prisma/client';
import { match } from 'ts-pattern';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import { DocumentVisibility } from '@documenso/lib/types/document-visibility';
import { FolderType, type TFolderType } from '@documenso/lib/types/folder-type';
import type { ApiRequestMetadata } from '@documenso/lib/universal/extract-request-metadata';
import { prisma } from '@documenso/prisma';

import { getTeamById } from '../team/get-team';

export interface MoveDocumentToFolderOptions {
  userId: number;
  teamId: number;
  documentId: number;
  folderId?: string | null;
  requestMetadata?: ApiRequestMetadata;
  type?: TFolderType;
}

export const moveDocumentToFolder = async ({
  userId,
  teamId,
  documentId,
  folderId,
  type,
}: MoveDocumentToFolderOptions) => {
  const team = await getTeamById({ userId, teamId });

  const visibilityFilters = match(team.currentTeamRole)
    .with(TeamMemberRole.ADMIN, () => ({
      visibility: {
        in: [
          DocumentVisibility.EVERYONE,
          DocumentVisibility.MANAGER_AND_ABOVE,
          DocumentVisibility.ADMIN,
        ],
      },
    }))
    .with(TeamMemberRole.MANAGER, () => ({
      visibility: {
        in: [DocumentVisibility.EVERYONE, DocumentVisibility.MANAGER_AND_ABOVE],
      },
    }))
    .otherwise(() => ({ visibility: DocumentVisibility.EVERYONE }));

  const documentWhereClause = {
    id: documentId,
    OR: [
      { teamId, ...visibilityFilters },
      { userId, teamId },
    ],
  };

  const generalWhereClause = {
    id: documentId,
    OR: [{ teamId }, { userId, teamId }],
  };

  const folderType = type ?? FolderType.DOCUMENT;
  let document;

  switch (folderType) {
    case FolderType.DOCUMENT:
      document = await prisma.document.findFirst({
        where: documentWhereClause,
      });
      break;
    case FolderType.TEMPLATE:
      document = await prisma.template.findFirst({
        where: documentWhereClause,
      });
      break;
    case FolderType.CHAT:
      document = await prisma.document.findFirst({
        where: documentWhereClause,
      });
      break;
    case FolderType.CONTRACT:
      document = await prisma.contract.findFirst({
        where: generalWhereClause,
      });
      break;
    case FolderType.FILE:
      document = await prisma.files.findFirst({
        where: generalWhereClause,
      });
      break;
  }

  // document = await prisma.document.findFirst({
  //   where: documentWhereClause,
  // });

  if (!document) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Document not found',
    });
  }

  if (folderId) {
    const folderWhereClause = {
      id: folderId,
      type: type ?? FolderType.DOCUMENT,
      OR: [
        { teamId, ...visibilityFilters },
        { userId, teamId },
      ],
    };

    const folder = await prisma.folder.findFirst({
      where: folderWhereClause,
    });

    if (!folder) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: 'Folder not found',
      });
    }
  }

  switch (folderType) {
    case FolderType.DOCUMENT:
      return await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          folderId,
        },
      });
    case FolderType.TEMPLATE:
      return await prisma.template.update({
        where: {
          id: documentId,
        },
        data: {
          folderId,
        },
      });
    case FolderType.CHAT:
      return await prisma.document.update({
        where: {
          id: documentId,
        },
        data: {
          folderId,
        },
      });
    case FolderType.CONTRACT:
      return await prisma.contract.update({
        where: {
          id: documentId,
        },
        data: {
          folderId,
        },
      });
    case FolderType.FILE:
      return await prisma.files.update({
        where: {
          id: documentId,
        },
        data: {
          folderId,
        },
      });
  }

  // return await prisma.document.update({
  //   where: {
  //     id: documentId,
  //   },
  //   data: {
  //     folderId,
  //   },
  // });
};
