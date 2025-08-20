import type { ApiRequestMetadata } from '@documenso/lib/universal/extract-request-metadata';
import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';
import { DOCUMENT_AUDIT_LOG_TYPE } from '../../types/document-audit-logs';
import { createDocumentAuditLogData } from '../../utils/document-audit-logs';
import { getTeamById } from '../team/get-team';

export type MoveDocumentToTeamOptions = {
  documentId: number;
  teamId: number;
  userId: number;
  requestMetadata: ApiRequestMetadata;
};

export const moveDocumentToTeam = async ({
  documentId,
  teamId,
  userId,
  requestMetadata,
}: MoveDocumentToTeamOptions) => {
  return await prisma.$transaction(async (tx) => {
    const document = await tx.document.findFirst({
      where: {
        id: documentId,
        userId,
        teamId: teamId,
      },
    });

    if (!document) {
      throw new AppError(AppErrorCode.NOT_FOUND, {
        message: 'Document not found or already associated with a team.',
      });
    }

    const team = await getTeamById({ userId, teamId });

    if (!team) {
      throw new AppError(AppErrorCode.UNAUTHORIZED, {
        message: 'This team does not exist, or you are not a member of this team.',
      });
    }

    const updatedDocument = await tx.document.update({
      where: { id: documentId },
      data: { teamId },
    });

    await tx.documentAuditLog.create({
      data: createDocumentAuditLogData({
        type: DOCUMENT_AUDIT_LOG_TYPE.DOCUMENT_MOVED_TO_TEAM,
        documentId: updatedDocument.id,
        metadata: requestMetadata,
        data: {
          movedByUserId: userId,
          fromPersonalAccount: true,
          toTeamId: teamId,
        },
      }),
    });

    return updatedDocument;
  });
};
