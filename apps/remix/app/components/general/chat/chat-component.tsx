import { useState } from 'react';

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { type UseChatOptions, useChat } from '@ai-sdk/react';
import { queryOptions } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { toast } from 'sonner';

import { queryClient, trpc } from '@documenso/trpc/react';
import { cn, convertToUIMessages, generateUUID } from '@documenso/ui/lib/utils';

import { Chat } from './chat';

const google = createGoogleGenerativeAI({
  apiKey: 'AIzaSyABLg4odoWpJX7VpZVSNWLfhsJ07hH5KAE',
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

const MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'Deepseek R1 70B' },
];

type ChatDemoProps = {
  // initialMessages?: UseChatOptions['initialMessages'];
  id: string;
  body?: string;
  teamId: number;
  contractId: number;
  contractName: string;
  userId: number;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  isReadonly: boolean;
};

export function ChatDemo(props: ChatDemoProps) {
  const {
    id,
    teamId,
    contractId,
    userId,
    contractName,
    body,
    selectedChatModel,
    isReadonly,
    initialMessages,
  } = props;

  const { data: messagesFromDb } = trpc.chat.getMessagesByChatId.useQuery(
    {
      id: id,
    },
    queryOptions({
      queryKey: ['chatMessages', id],
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }),
  );

  const { messages, input, handleInputChange, handleSubmit, append, stop, status, setMessages } =
    useChat({
      id,
      api: '/api/chat/chat',
      experimental_throttle: 100,
      sendExtraMessageFields: true,
      initialMessages: initialMessages.length
        ? initialMessages
        : convertToUIMessages(messagesFromDb || []),
      body: { id, model: selectedChatModel, teamId, contractId, body, userId },
      generateId: generateUUID,
      onFinish: async () => {
        await queryClient.invalidateQueries({ queryKey: ['chatMessages', id] });
      },
      onError: () => {
        toast.error('An error occurred, please try again!');
      },
    });

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className={cn('flex', 'flex-col', 'h-full max-h-[90%]', 'w-full')}>
      <Chat
        className="grow"
        messages={messages}
        handleSubmit={handleSubmit}
        input={input}
        handleInputChange={handleInputChange}
        isGenerating={isLoading}
        stop={stop}
        append={append}
        setMessages={setMessages}
        suggestions={[
          'What is the weather in San Francisco?',
          'Explain step-by-step how to solve this math problem: If x² + 6x + 9 = 25, what is x?',
          'Design a simple algorithm to find the longest palindrome in a string.',
        ]}
      />
    </div>
  );
}
