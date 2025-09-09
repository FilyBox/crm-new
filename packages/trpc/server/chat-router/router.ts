import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import { type Chat, ZChatSchema } from '@documenso/lib/types/chat';
import { ZMessageSchema } from '@documenso/lib/types/messages';
import { prisma } from '@documenso/prisma';

import { authenticatedProcedure, router } from '../trpc';

export type GetArtistByIdOptions = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  teamId?: number;
  avatarImageId?: string | null;
  disabled: boolean;
  event?: string[];
  url: string;
  song?: string[];
};

export const chatRouter = router({
  singleDocumentById: authenticatedProcedure
    .input(z.object({ documentId: z.number() }))
    .query(async ({ input }) => {
      const { documentId } = input;
      const document = await prisma.document.findFirst({
        where: { id: documentId },
      });

      if (!document) return null;

      return document;
    }),

  singleDocumentDataById: authenticatedProcedure
    .input(z.object({ documentDataId: z.string() }))
    .query(async ({ input }) => {
      const { documentDataId } = input;
      const document = await prisma.documentData.findFirst({
        where: { id: documentDataId },
      });

      if (!document) return null;

      return document;
    }),

  getDocumentBody: authenticatedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input }) => {
      const { documentId } = input;
      const body = await prisma.documentBodyExtracted.findFirst({
        where: { id: documentId },
      });

      if (!body) return null;

      return body;
    }),

  saveChat: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        contractId: z.number(),
        visibility: z.enum(['private', 'public']).default('private'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const { id, title, contractId, visibility } = input;
      try {
        const validUserId = Number(user.id);
        const validTeamId = teamId;
        return await prisma.chat.create({
          data: {
            id,
            teamId: validTeamId,
            documentId: contractId,
            createdAt: new Date(),
            userId: validUserId,
            title,
            visibility,
          },
        });
      } catch (error) {
        console.error('Failed to save chat in database');
        throw error;
      }
    }),

  deleteChatById: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id } = input;
      try {
        await prisma.vote.deleteMany({
          where: { chatId: id },
        });
        await prisma.message.deleteMany({
          where: { chatId: id },
        });

        return await prisma.chat.deleteMany({
          where: { id },
        });
      } catch (error) {
        console.error('Failed to delete chat by id from database');
        throw error;
      }
    }),

  getChatsByUserId: authenticatedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/history',
        summary: 'Find history',
        description: 'Find history',
        tags: ['Chat'],
      },
    })
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        startingAfter: z.string().nullable().optional(),
        endingBefore: z.string().nullable().optional(),
      }),
    )
    .output(z.object({ chats: z.array(ZChatSchema), hasMore: z.boolean() }))
    .query(async ({ input, ctx }) => {
      const { user } = ctx;
      const validId = user.id;
      const { limit, startingAfter, endingBefore } = input;
      try {
        const extendedLimit = limit + 1;

        const whereCondition: Prisma.ChatWhereInput = {
          userId: validId,
        };

        if (startingAfter) {
          const selectedChat = await prisma.chat.findUnique({
            where: { id: startingAfter },
          });

          if (!selectedChat) {
            throw new Error(`Chat with id ${startingAfter} not found`);
          }

          whereCondition.createdAt = { gt: selectedChat.createdAt };
        } else if (endingBefore) {
          const selectedChat = await prisma.chat.findUnique({
            where: { id: endingBefore },
          });

          if (!selectedChat) {
            throw new Error(`Chat with id ${endingBefore} not found`);
          }

          whereCondition.createdAt = { lt: selectedChat.createdAt };
        }

        const filteredChats = await prisma.chat.findMany({
          where: whereCondition,
          orderBy: { createdAt: 'desc' },
          take: extendedLimit,
        });

        const hasMore = filteredChats.length > limit;
        const chats = hasMore ? filteredChats.slice(0, limit) : filteredChats;

        return {
          chats,
          hasMore,
        };
      } catch (error) {
        console.error('Failed to get chats by user from database');
        console.error(error);
        throw error;
      }
    }),

  getChatById: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      try {
        const chat = await prisma.chat.findUnique({
          where: { id },
        });
        return chat;
      } catch (error) {
        console.error('Failed to get chat by id from database');
        throw error;
      }
    }),

  getChatByIdAndWorkspceId: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      try {
        const chat = await prisma.chat.findUnique({
          where: { id },
        });
        return chat;
      } catch (error) {
        console.error('Failed to get chat by id from database');
        throw error;
      }
    }),

  saveMessages: authenticatedProcedure
    .input(z.object({ messages: z.array(ZMessageSchema) }))
    .mutation(async ({ input }) => {
      const { messages } = input;
      try {
        return await prisma.message.createMany({
          data: messages,
        });
      } catch (error) {
        console.error('Failed to save messages in database', error);
        throw error;
      }
    }),

  getMessagesByChatId: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      try {
        return await prisma.message.findMany({
          where: { chatId: id },
          orderBy: { createdAt: 'asc' },
        });
      } catch (error) {
        console.error('Failed to get messages by chat id from database', error);
        throw error;
      }
    }),

  voteMessage: authenticatedProcedure
    .input(z.object({ chatId: z.string(), messageId: z.string(), type: z.enum(['up', 'down']) }))
    .mutation(async ({ input }) => {
      const { chatId, messageId, type } = input;
      try {
        const existingVote = await prisma.vote.findFirst({
          where: { messageId, chatId },
        });

        if (existingVote) {
          return await prisma.vote.updateMany({
            where: { messageId, chatId },
            data: { isUpvoted: type === 'up' },
          });
        }
        return await prisma.vote.create({
          data: {
            chatId,
            messageId,
            isUpvoted: type === 'up',
          },
        });
      } catch (error) {
        console.error('Failed to upvote message in database', error);
        throw error;
      }
    }),

  getVotesByChatId: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      try {
        return await prisma.vote.findMany({
          where: { chatId: id },
        });
      } catch (error) {
        console.error('Failed to get votes by chat id from database');
        throw error;
      }
    }),
  saveDocument: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        kind: z.enum(['text', 'pdf', 'docx', 'pptx', 'xlsx', 'url', 'code', 'image']),
        content: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, title, kind, content } = input;
      const { user } = ctx;
      try {
        const validUserId = user.id;
        return await prisma.chatDocument.create({
          data: {
            id,
            title,
            kind,
            content,
            userId: validUserId,
            createdAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Failed to save document in database');
        console.log(error);
        throw error;
      }
    }),

  getDocumentsById: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      try {
        const chatDocuments = await prisma.chatDocument.findMany({
          where: { id },
          orderBy: { createdAt: 'desc' },
        });
        return chatDocuments;
      } catch (error) {
        console.error('Failed to get document by id from database');
        throw error;
      }
    }),

  getChatDocumentById: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      try {
        const chatDocument = await prisma.chatDocument.findFirst({
          where: { id },
          orderBy: { createdAt: 'desc' },
        });
        return chatDocument;
      } catch (error) {
        console.error('Failed to get document by id from database');
        throw error;
      }
    }),

  getDocumentById: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      try {
        const chatDocument = await prisma.chatDocument.findFirst({
          where: { id },
          orderBy: { createdAt: 'desc' },
        });
        return chatDocument;
      } catch (error) {
        console.error('Failed to get document by id from database');
        throw error;
      }
    }),

  deleteDocumentsByIdAfterTimestamp: authenticatedProcedure
    .input(
      z.object({
        id: z.string(),
        timestamp: z.date(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, timestamp } = input;
      try {
        await prisma.suggestion.deleteMany({
          where: {
            documentId: id,
            documentCreatedAt: {
              gt: timestamp,
            },
          },
        });

        return await prisma.chatDocument.deleteMany({
          where: {
            id,
            createdAt: {
              gt: timestamp,
            },
          },
        });
      } catch (error) {
        console.error('Failed to delete documents by id after timestamp from database');
        throw error;
      }
    }),

  saveSuggestions: authenticatedProcedure
    .input(z.object({ suggestions: z.array(z.any()) }))
    .mutation(async ({ input, ctx }) => {
      const { suggestions } = input;
      const { user } = ctx;
      const validUserId = Number(user.id);
      const suggestionsWithUserId = suggestions.map((suggestion) => ({
        ...suggestion,
        userId: validUserId,
      }));
      try {
        return await prisma.suggestion.createMany({
          data: suggestionsWithUserId,
        });
      } catch (error) {
        console.error('Failed to save suggestions in database');
        throw error;
      }
    }),

  getSuggestionsByDocumentId: authenticatedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ input }) => {
      const { documentId } = input;
      try {
        return await prisma.suggestion.findMany({
          where: { documentId },
        });
      } catch (error) {
        console.error('Failed to get suggestions by document version from database');
        throw error;
      }
    }),
  getMessageById: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const { id } = input;
      try {
        return await prisma.message.findUnique({
          where: { id },
        });
      } catch (error) {
        console.error('Failed to get message by id from database');
        throw error;
      }
    }),

  deleteMessagesByChatIdAfterTimestamp: authenticatedProcedure
    .input(
      z.object({
        chatId: z.string(),
        timestamp: z.date(),
      }),
    )
    .mutation(async ({ input }) => {
      const { chatId, timestamp } = input;
      try {
        const messagesToDelete = await prisma.message.findMany({
          where: {
            chatId,
            createdAt: {
              gte: timestamp,
            },
          },
          select: { id: true },
        });

        const messageIds = messagesToDelete.map((message) => message.id);

        if (messageIds.length > 0) {
          await prisma.vote.deleteMany({
            where: {
              chatId,
              messageId: {
                in: messageIds,
              },
            },
          });

          return await prisma.message.deleteMany({
            where: {
              chatId,
              id: {
                in: messageIds,
              },
            },
          });
        }
      } catch (error) {
        console.error('Failed to delete messages by id after timestamp from database');
        throw error;
      }
    }),

  updateChatVisibility: authenticatedProcedure
    .input(z.object({ chatId: z.string(), visibility: z.enum(['private', 'public']) }))
    .mutation(async ({ input }) => {
      const { chatId, visibility } = input;
      try {
        return await prisma.chat.update({
          where: { id: chatId },
          data: { visibility },
        });
      } catch (error) {
        console.error('Error al actualizar la visibilidad del chat:', error);
        throw error;
      }
    }),
});
