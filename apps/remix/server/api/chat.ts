import { sValidator } from '@hono/standard-validator';
import { appendResponseMessages, createDataStreamResponse, smoothStream, streamText } from 'ai';
import { Hono } from 'hono';
import { mutate } from 'swr';

import { getSession } from '@documenso/auth/server/lib/utils/get-session';
import {
  generateTitleFromUserMessage,
  getChatById,
  getChatsByTeamId,
  myProvider,
  saveChat,
  saveMessages,
  singleDocumentById,
} from '@documenso/lib/server-only/chat/chat-actions';
import { getMemberRoles } from '@documenso/lib/server-only/team/get-member-roles';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@documenso/ui/lib/utils';

import type { HonoEnv } from '../router';
import { ZChatRequestSchema } from './files.types';

export const ChatRoute = new Hono<HonoEnv>().post(
  '/chat',
  sValidator('json', ZChatRequestSchema),

  async (c) => {
    try {
      const { session, user } = await getSession(c);
      const { contractId, model, messages, id, teamId, userId } = c.req.valid('json');
      if (!session || !user || session.userId !== userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      const { teamRole } = await getMemberRoles({
        teamId: teamId,
        reference: {
          type: 'User',
          id: userId,
        },
      });

      if (!teamRole) {
        return new Response('Unauthorized', { status: 401 });
      }

      const userMessage = getMostRecentUserMessage(messages);
      if (!userMessage) {
        return new Response('No user message found', { status: 400 });
      }

      const chat = await getChatById({ id });
      const contract = await singleDocumentById(Number(contractId));

      if (!contract) {
        return new Response('Invalid contract', { status: 400 });
      }

      const MessageContent = userMessage.content;
      const messageAndContractName = `Nombre del contrato: ${contract.title} contenido del mensaje: ${MessageContent}`;

      userMessage.content = messageAndContractName;
      let isNewChat = false;

      if (!chat) {
        isNewChat = true;
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });

        await saveChat({ id, contractId, userId, title, teamId });

        console.log('newchat', isNewChat);

        c.header('X-Chat-Created', 'true');
        c.header('X-Document-Id', contractId.toString());
      } else {
        if (Number(chat.userId) !== Number(userId)) {
          return new Response('Unauthorized', { status: 401 });
        }
      }
      const prompt = `El siguiente texto es el contrato del cual se te preguntara o pedira que realizes resumenes, respondas preguntas, generes documentos, reportes, etc.
      Cuando se te pregunte con algo relacionado a un contrato, "el contrato", o demas maneras que aludan a un contrato es referente a este contexto que se te esta proporcionando.
      No respondas nada que no este relacionado a este contrato. Además, responde en el mismo idioma en el que se te pregunte.
      Si no sabes la respuesta, di que no lo sabes. No intentes inventar una respuesta.
      Si la pregunta o solicitud no esta relacionada con el contrato, responde que no puedes ayudar con eso.
      Si el usuario te pide un resumen, asegurate de que sea breve y conciso.
      No olvides que siempre debes referirte al contrato proporcionado.
      Si la pregunta o solicitud es sobre algo que no esta en el contrato, responde que no lo sabes o no puedes hacerlo.
      el contenido del contrato es el siguiente:`;

      const modelAndContex = prompt + contract.documentBodyExtracted?.body;
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: userMessage.id,
            role: 'user',
            parts: userMessage.parts,
            attachments: userMessage.experimental_attachments ?? [],
            createdAt: new Date(),
          },
        ],
      });

      return createDataStreamResponse({
        execute: (dataStream) => {
          const result = streamText({
            model: myProvider.languageModel(model),
            system: modelAndContex,
            messages,
            maxSteps: 5,
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            onFinish: async ({ response }) => {
              if (userId) {
                try {
                  const assistantId = getTrailingMessageId({
                    messages: response.messages.filter((message) => message.role === 'assistant'),
                  });

                  if (!assistantId) {
                    throw new Error('No assistant message found!');
                  }

                  const [, assistantMessage] = appendResponseMessages({
                    messages: [userMessage],
                    responseMessages: response.messages,
                  });

                  await saveMessages({
                    messages: [
                      {
                        id: assistantId,
                        chatId: id,
                        role: assistantMessage.role,
                        parts: assistantMessage.parts,
                        attachments: assistantMessage.experimental_attachments ?? [],
                        createdAt: new Date(),
                      },
                    ],
                  });
                } catch (_) {
                  console.error('Failed to save chat');
                }
              }
            },
            experimental_telemetry: {
              isEnabled: false,
              functionId: 'stream-text',
            },
          });

          result.consumeStream();

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
        },
        onError: (error) => {
          console.error('Chat generation error:', error);
          return 'Oops, an error occurred!';
        },
      });
    } catch (error) {
      console.error('Upload failed:', error);
      return c.json({ error: 'Upload failed' }, 500);
    }
  },
);

export const HistoryRoute = new Hono<HonoEnv>().get('/history', async (c) => {
  try {
    const teamId = c.req.query('teamId');
    const userId = c.req.query('userId');
    const limit = Number(c.req.query('limit') || '10');
    const documentId = c.req.query('documentId');
    const startingAfter = c.req.query('starting_after');
    const endingBefore = c.req.query('ending_before');

    if (startingAfter && endingBefore) {
      return Response.json('Only one of starting_after or ending_before can be provided!', {
        status: 400,
      });
    }

    const { session, user } = await getSession(c);

    if (!session || !user || session.userId !== Number(userId)) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { teamRole } = await getMemberRoles({
      teamId: Number(teamId),
      reference: {
        type: 'User',
        id: Number(userId),
      },
    });
    if (!teamRole) {
      return new Response('Unauthorized', { status: 401 });
    }

    const chats = await getChatsByTeamId({
      teamId: Number(teamId),
      limit,
      startingAfter: startingAfter || null,
      endingBefore: endingBefore || null,
      documentId: Number(documentId),
    });

    return c.json({ chats });
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return c.json({ error: 'Failed to fetch history' }, 500);
  }
});
