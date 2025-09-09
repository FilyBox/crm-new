import { prisma } from '@documenso/prisma';

export const getChatDocumentById = async ({ id }: { id: string }) => {
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
};

export const getSuggestionsByDocumentId = async ({ documentId }: { documentId: string }) => {
  try {
    return await prisma.suggestion.findMany({
      where: { documentId },
    });
  } catch (error) {
    console.error('Failed to get suggestions by document id from database');
    throw error;
  }
};
