import { useEffect, useRef } from 'react';

import { useChat } from '@ai-sdk/react';
import { queryOptions } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { toast } from 'sonner';

import { queryClient, trpc } from '@documenso/trpc/react';
import { cn, convertToUIMessages, generateUUID } from '@documenso/ui/lib/utils';

import { Chat } from './chat';

type ChatDemoProps = {
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
  const { id, teamId, contractId, userId, body, selectedChatModel } = props;
  const utils = trpc.useUtils();
  const wasEmptyRef = useRef(false);

  const { data: messagesFromDb } = trpc.chat.getMessagesByChatId.useQuery(
    {
      id: id,
    },
    queryOptions({
      queryKey: ['chatMessages', id],
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // AGREGAR: Evitar refetch al montar
      refetchOnReconnect: false, // AGREGAR: Evitar refetch en reconexión
    }),
  );

  // CAMBIO: Optimizar el useEffect para evitar cambios innecesarios
  useEffect(() => {
    const isEmpty = !messagesFromDb || messagesFromDb.length === 0;
    if (wasEmptyRef.current !== isEmpty) {
      wasEmptyRef.current = isEmpty;
    }
  }, [messagesFromDb]);

  const { messages, input, handleInputChange, handleSubmit, append, stop, status, setMessages } =
    useChat({
      id,
      api: '/api/chat/chat',
      experimental_throttle: 100,
      sendExtraMessageFields: true,
      initialMessages: convertToUIMessages(messagesFromDb || []),
      body: { id, model: selectedChatModel, teamId, contractId, body, userId },
      generateId: generateUUID,
      onFinish: async () => {
        // CAMBIO: Usar requestIdleCallback para diferir las invalidaciones
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            queryClient.invalidateQueries({ queryKey: ['chatMessages', id] });

            if (wasEmptyRef.current) {
              console.log('New chat detected, invalidating chat history');

              utils.chat.getChatHistoryInfinite.invalidate({
                documentId: contractId,
              });

              wasEmptyRef.current = false;
            }
          });
        } else {
          // Fallback para navegadores que no soportan requestIdleCallback
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ['chatMessages', id] });

            if (wasEmptyRef.current) {
              console.log('New chat detected, invalidating chat history');

              utils.chat.getChatHistoryInfinite.invalidate({
                documentId: contractId,
              });

              wasEmptyRef.current = false;
            }
          }, 100);
        }
      },
      onError: () => {
        toast.error('An error occurred, please try again!');
      },
    });

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className={cn('flex', 'flex-col', 'h-full', 'w-full')}>
      <Chat
        className=""
        messages={messages}
        handleSubmit={handleSubmit}
        input={input}
        handleInputChange={handleInputChange}
        isGenerating={isLoading}
        stop={stop}
        append={append}
        setMessages={setMessages}
        suggestions={undefined}
      />
    </div>
  );
}
