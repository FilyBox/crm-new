import { TRPCError } from '@trpc/server';
import { DateTime } from 'luxon';
import { z } from 'zod';

import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';
import { AppError } from '@documenso/lib/errors/app-error';
import { encryptSecondaryData } from '@documenso/lib/server-only/crypto/encrypt';
import { deleteFile } from '@documenso/lib/server-only/document/DeleteObjectS3';
import { duplicateDocument } from '@documenso/lib/server-only/document/duplicate-document-by-id';
import { findDocumentAuditLogs } from '@documenso/lib/server-only/document/find-document-audit-logs';
import { findFiles } from '@documenso/lib/server-only/document/find-files';
import { getDocumentAndSenderByToken } from '@documenso/lib/server-only/document/get-document-by-token';
import { getFilesById } from '@documenso/lib/server-only/document/get-file-by-id';
import { getMultipleFilesById } from '@documenso/lib/server-only/document/get-multiple-files-by-id';
import type { GetStatsInput } from '@documenso/lib/server-only/document/get-stats';
import { moveDocumentToTeam } from '@documenso/lib/server-only/document/move-document-to-team';
import { searchDocumentsWithKeyword } from '@documenso/lib/server-only/document/search-documents-with-keyword';
import { createFiles } from '@documenso/lib/server-only/files/create-files';
import { getTeamById } from '@documenso/lib/server-only/team/get-team';
import {
  getContractInfoTask,
  getExtractBodyContractTask,
} from '@documenso/lib/server-only/trigger';
import {
  generateChartConfig,
  generateQuery,
  runGenerateSQLQuery,
} from '@documenso/lib/universal/ai/queries-proccessing';
import { getPresignGetUrl } from '@documenso/lib/universal/upload/server-actions';
import { isDocumentCompleted } from '@documenso/lib/utils/document';
import { prisma } from '@documenso/prisma';

import { authenticatedProcedure, procedure, router } from '../trpc';
import {
  ZCreateDocumentRequestSchema,
  ZDeleteDocumentMutationSchema,
  ZDownloadAuditLogsMutationSchema,
  ZDownloadCertificateMutationSchema,
  ZDuplicateDocumentRequestSchema,
  ZDuplicateDocumentResponseSchema,
  ZFindDocumentAuditLogsQuerySchema,
  ZFindDocumentsInternalRequestSchema,
  ZFindDocumentsRequestSchema,
  ZGenericSuccessResponse,
  ZGetDocumentByIdQuerySchema,
  ZGetDocumentByTokenQuerySchema,
  ZMoveDocumentToTeamSchema,
  ZSearchDocumentsMutationSchema,
  ZSuccessResponseSchema,
} from './schema';

export const filesRouter = router({
  /**
   * @private
   */
  getDocumentById: authenticatedProcedure
    .input(ZGetDocumentByIdQuerySchema)
    .query(async ({ input, ctx }) => {
      const { teamId } = ctx;
      const { documentId } = input;

      return await getFilesById({
        userId: ctx.user.id,
        teamId,
        documentId,
      });
    }),

  getMultipleDocumentById: authenticatedProcedure
    .input(z.object({ fileIds: z.array(z.number()) }))
    .mutation(async ({ input, ctx }) => {
      const { teamId } = ctx;
      const { fileIds } = input;

      const files = await getMultipleFilesById({
        userId: ctx.user.id,
        teamId,
        documentsId: fileIds,
      });
      return files;
    }),

  /**
   * @private
   */
  getDocumentByToken: procedure
    .input(ZGetDocumentByTokenQuerySchema)
    .query(async ({ input, ctx }) => {
      const { token } = input;

      return await getDocumentAndSenderByToken({
        token,
        userId: ctx.user?.id,
      });
    }),

  /**
   * @public
   */
  findDocuments: authenticatedProcedure

    .input(ZFindDocumentsRequestSchema)
    // .output(ZFindDocumentsResponseSchema)
    .query(async ({ input, ctx }) => {
      const { user, teamId } = ctx;

      const {
        query,
        page,
        perPage,
        orderByDirection,
        orderByColumn,

        folderId,
      } = input;

      const documents = await findFiles({
        userId: user.id,
        teamId,
        query,
        page,
        perPage,
        folderId,
        orderBy: orderByColumn ? { column: orderByColumn, direction: orderByDirection } : undefined,
      });

      return documents;
    }),

  /**
   * Internal endpoint for /documents page to additionally return getStats.
   *
   * @private
   */
  findFilesInternal: authenticatedProcedure
    .input(ZFindDocumentsInternalRequestSchema)
    // .output(ZFindDocumentsInternalResponseSchema)
    .query(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const { query, page, perPage, orderByDirection, orderByColumn, period, folderId } = input;

      const getStatOptions: GetStatsInput = {
        user,
        period,
        search: query,
        folderId,
      };

      if (teamId) {
        const team = await getTeamById({ userId: user.id, teamId });

        getStatOptions.team = {
          teamId: team.id,
          teamEmail: team.teamEmail?.email,
          currentTeamMemberRole: team.currentTeamRole,
          currentUserEmail: user.email,
          userId: user.id,
        };
      }

      const [documents] = await Promise.all([
        findFiles({
          userId: user.id,
          teamId,
          query,
          page,
          perPage,
          period,
          folderId,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);
      return documents;
    }),

  /**
   * @public
   *
   * Todo: Refactor to getDocumentById.
   */

  createFile: authenticatedProcedure

    .input(ZCreateDocumentRequestSchema)
    .mutation(async ({ input, ctx }) => {
      const { teamId } = ctx;
      const { title, documentDataId, timezone, folderId, useToChat, source } = input;

      // const { remaining } = await getServerLimits({ email: ctx.user.email, teamId });

      // if (remaining.documents <= 0) {
      //   throw new AppError(AppErrorCode.LIMIT_EXCEEDED, {
      //     message: 'You have reached your document limit for this month. Please upgrade your plan.',
      //     statusCode: 400,
      //   });
      // }

      return await createFiles({
        userId: ctx.user.id,
        teamId,
        title,
        documentDataId,
        normalizePdf: true,
        timezone,
        requestMetadata: ctx.metadata,
        folderId,
        useToChat,
        source,
      });
    }),

  /**
   * @public
   */
  deleteDocument: authenticatedProcedure

    .input(ZDeleteDocumentMutationSchema)
    .output(ZSuccessResponseSchema)
    .mutation(async ({ input, ctx }) => {
      const { documentId } = input;

      await prisma.files.update({
        where: { id: documentId },
        data: { deletedAt: new Date() },
      });

      // await deleteFiles({
      //   id: documentId,
      //   userId,
      //   teamId,
      //   requestMetadata: ctx.metadata,
      // });

      return ZGenericSuccessResponse;
    }),

  deleteSoftMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;

      await prisma.files.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });
    }),

  deleteHardMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;

      for (const id of ids) {
        const file = await prisma.files.findUnique({
          where: { id },
          select: { fileDataId: true },
        });

        try {
          if (file) {
            const documentData = await prisma.documentData.findUnique({
              where: { id: file.fileDataId },
              select: { data: true, id: true },
            });

            if (documentData && documentData.data) {
              const { url } = await getPresignGetUrl(documentData.data);
              await Promise.all([
                deleteFile(url),
                prisma.documentData.delete({
                  where: { id: documentData.id },
                }),
              ]);
            } else {
              await prisma.files.delete({
                where: { id },
              });
            }
          }
        } catch (error) {
          console.error('Error deleting file:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while deleting the files.',
          });
        }
      }
    }),

  /**
   * @public
   */
  moveDocumentToTeam: authenticatedProcedure

    .input(ZMoveDocumentToTeamSchema)
    // .output(ZMoveDocumentToTeamResponseSchema)
    .mutation(async ({ input, ctx }) => {
      const { documentId, teamId } = input;
      const userId = ctx.user.id;

      return await moveDocumentToTeam({
        documentId,
        teamId,
        userId,
        requestMetadata: ctx.metadata,
      });
    }),

  duplicateDocument: authenticatedProcedure

    .input(ZDuplicateDocumentRequestSchema)
    .output(ZDuplicateDocumentResponseSchema)
    .mutation(async ({ input, ctx }) => {
      const { teamId, user } = ctx;
      const { documentId } = input;

      return await duplicateDocument({
        userId: user.id,
        teamId,
        documentId,
      });
    }),

  /**
   * @private
   */
  searchDocuments: authenticatedProcedure
    .input(ZSearchDocumentsMutationSchema)
    .query(async ({ input, ctx }) => {
      const { query } = input;

      const documents = await searchDocumentsWithKeyword({
        query,
        userId: ctx.user.id,
      });

      return documents;
    }),

  retryChatDocument: authenticatedProcedure
    .input(z.object({ documenDataId: z.string().optional(), documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { documenDataId, documentId } = input;
      const { teamId, user } = ctx;
      const userId = user.id;
      console.log('documenDataId', documenDataId, 'documentId', documentId);

      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          documentDataId: true,
        },
      });
      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found.',
        });
      }

      const documentData = await prisma.documentData.findUnique({
        where: {
          id: document.documentDataId ?? documenDataId,
        },
      });
      if (documentData) {
        const { url } = await getPresignGetUrl(documentData.data || '');
        await getExtractBodyContractTask(userId, documentId, url, teamId);

        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'PENDING' },
        });
        // const url = await getURL({ type: documentData.type, data: documentData.data });
      }

      return documentData;
    }),

  retryContractData: authenticatedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { documentId } = input;
      const { teamId, user } = ctx;
      const userId = user.id;

      let newPulicAccessToken = '';
      let newId = '';

      const document = await prisma.document.findUnique({
        where: { id: documentId },
        select: {
          documentDataId: true,
        },
      });
      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found.',
        });
      }

      const documentData = await prisma.documentData.findUnique({
        where: {
          id: document.documentDataId,
        },
      });
      if (documentData) {
        const { url } = await getPresignGetUrl(documentData.data || '');
        const { publicAccessToken, id } = await getContractInfoTask(
          userId,
          documentId,
          url,
          teamId,
        );
        newPulicAccessToken = publicAccessToken;
        newId = id;
        await prisma.document.update({
          where: { id: documentId },
          data: { status: 'PENDING' },
        });
        // const url = await getURL({ type: documentData.type, data: documentData.data });
      }
      // const { publicAccessToken, id } = await getContractInfoTask(userId, documentId, teamId);

      return { publicAccessToken: newPulicAccessToken, id: newId };
    }),

  aiConnection: authenticatedProcedure
    .input(
      z.object({
        question: z.string(),
        folderId: z.number().optional(),
        tableToConsult: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { teamId, user } = ctx;
      const userId = user.id;
      const { question, folderId, tableToConsult } = input;
      try {
        const query = await generateQuery(question, userId, teamId, folderId, tableToConsult);

        const companies = await runGenerateSQLQuery(query);

        const generation = await generateChartConfig(companies, question);
        return { query, companies, generation };
      } catch (e) {
        return { query: '', companies: [], generation: undefined };
      }
    }),
  /**
   * @private
   */
  findDocumentAuditLogs: authenticatedProcedure
    .input(ZFindDocumentAuditLogsQuerySchema)
    .query(async ({ input, ctx }) => {
      const { teamId } = ctx;

      const {
        page,
        perPage,
        documentId,
        cursor,
        filterForRecentActivity,
        orderByColumn,
        orderByDirection,
      } = input;

      return await findDocumentAuditLogs({
        userId: ctx.user.id,
        teamId,
        page,
        perPage,
        documentId,
        cursor,
        filterForRecentActivity,
        orderBy: orderByColumn ? { column: orderByColumn, direction: orderByDirection } : undefined,
      });
    }),

  /**
   * @private
   */
  downloadAuditLogs: authenticatedProcedure
    .input(ZDownloadAuditLogsMutationSchema)
    .mutation(async ({ input, ctx }) => {
      const { teamId } = ctx;
      const { documentId } = input;

      const document = await getFilesById({
        documentId,
        userId: ctx.user.id,
        teamId,
      }).catch(() => null);

      if (!document || (teamId && document.teamId !== teamId)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this document.',
        });
      }

      const encrypted = encryptSecondaryData({
        data: document.id.toString(),
        expiresAt: DateTime.now().plus({ minutes: 5 }).toJSDate().valueOf(),
      });

      return {
        url: `${NEXT_PUBLIC_WEBAPP_URL()}/__htmltopdf/audit-log?d=${encrypted}`,
      };
    }),

  /**
   * @private
   */
  downloadCertificate: authenticatedProcedure
    .input(ZDownloadCertificateMutationSchema)
    .mutation(async ({ input, ctx }) => {
      const { teamId } = ctx;
      const { documentId } = input;

      const document = await getFilesById({
        documentId,
        userId: ctx.user.id,
        teamId,
      });

      if (!isDocumentCompleted(document.status)) {
        throw new AppError('DOCUMENT_NOT_COMPLETE');
      }

      const encrypted = encryptSecondaryData({
        data: document.id.toString(),
        expiresAt: DateTime.now().plus({ minutes: 5 }).toJSDate().valueOf(),
      });

      return {
        url: `${NEXT_PUBLIC_WEBAPP_URL()}/__htmltopdf/certificate?d=${encrypted}`,
      };
    }),
});
