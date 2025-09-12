import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { type Message as DBMessage } from '@prisma/client';
import { type Message, generateText } from 'ai';
import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from 'ai';

import { prisma } from '@documenso/prisma';

export async function saveMessages({ messages }: { messages: Array<DBMessage> }) {
  try {
    return await prisma.message.createMany({
      data: messages,
    });
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

export const myProvider = customProvider({
  languageModels: {
    'chat-model': google('gemini-2.0-flash-lite'),
    'chat-model-reasoning': wrapLanguageModel({
      model: google('gemini-2.0-flash-lite'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
    'title-model': google('gemini-2.0-flash-lite'),
    'artifact-model': google('gemini-2.0-flash-lite'),
  },
});

export async function getChatById({ id }: { id: string }) {
  try {
    const selectedChat = await prisma.chat.findUnique({
      where: { id },
    });
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function singleDocumentById(documentId: number) {
  const documents = await prisma.document.findFirst({
    where: {
      id: documentId,
    },
    include: {
      documentBodyExtracted: {
        select: {
          body: true,
        },
      },
    },
  });
  return documents;
}

export async function generateTitleFromUserMessage({ message }: { message: Message }) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title in the lenguage the user wrote the message, based on the "Nombre del contrato" and the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function saveChat({
  id,
  userId,
  title,
  teamId,
  contractId,
}: {
  id: string;
  teamId: number;
  contractId: number;
  userId: number;
  title: string;
}) {
  try {
    return await prisma.chat.create({
      data: {
        id,
        teamId: teamId,
        documentId: contractId,
        createdAt: new Date(),
        userId: userId,
        title,
        crmChatCreatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}
