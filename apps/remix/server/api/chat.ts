import { sValidator } from '@hono/standard-validator';
import {
  type UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { Hono } from 'hono';

import { AppError, AppErrorCode } from '@documenso/lib/errors/app-error';
import {
  generateTitleFromUserMessage,
  getChatById,
  myProvider,
  saveChat,
  saveMessages,
  singleDocumentById,
} from '@documenso/lib/server-only/chat/chat-actions';
import {
  getPresignGetUrl,
  getPresignPostUrl,
} from '@documenso/lib/universal/upload/server-actions';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@documenso/ui/lib/utils';

import type { HonoEnv } from '../router';
import {
  type TGetPresignedGetUrlResponse,
  type TGetPresignedPostUrlResponse,
  ZChatRequestSchema,
  ZGetPresignedGetUrlRequestSchema,
  ZGetPresignedPostUrlRequestSchema,
} from './files.types';

export const ChatRoute = new Hono<HonoEnv>()
  /**
   * Uploads a document file to the appropriate storage location and creates
   * a document data record.
   */
  .post('/chat', sValidator('json', ZChatRequestSchema), async (c) => {
    try {
      const { contractId, body, model, messages, id, teamId, userId } = c.req.valid('json');
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

      if (!chat) {
        const title = await generateTitleFromUserMessage({
          message: userMessage,
        });

        await saveChat({ id, contractId, userId, title, teamId });
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
        onError: () => {
          return 'Oops, an error occurred!';
        },
      });
    } catch (error) {
      console.error('Upload failed:', error);
      return c.json({ error: 'Upload failed' }, 500);
    }
  })

  .post('/presigned-get-url', sValidator('json', ZGetPresignedGetUrlRequestSchema), async (c) => {
    const { key } = await c.req.json();

    try {
      const { url } = await getPresignGetUrl(key || '');
      return c.json({ url } satisfies TGetPresignedGetUrlResponse);
    } catch (err) {
      console.error(err);

      throw new AppError(AppErrorCode.UNKNOWN_ERROR);
    }
  })
  .post('/presigned-post-url', sValidator('json', ZGetPresignedPostUrlRequestSchema), async (c) => {
    const { fileName, contentType } = c.req.valid('json');

    try {
      const { key, url } = await getPresignPostUrl(fileName, contentType);

      return c.json({ key, url } satisfies TGetPresignedPostUrlResponse);
    } catch (err) {
      console.error(err);

      throw new AppError(AppErrorCode.UNKNOWN_ERROR);
    }
  });
