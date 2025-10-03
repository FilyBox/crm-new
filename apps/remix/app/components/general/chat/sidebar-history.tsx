import { useState } from 'react';
import React from 'react';

import type { Chat } from '@prisma/client';
import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import { motion } from 'framer-motion';
import { LoaderIcon, PlusIcon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { trpc } from '@documenso/trpc/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@documenso/ui/primitives/alert-dialog';
import { Button } from '@documenso/ui/primitives/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@documenso/ui/primitives/sidebar';

import { ChatItem } from './sidebar-history-item';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats,
  );
};

export function SidebarHistory({
  id,
  documentId,
  onChatChange,
  onNewChat,
}: {
  id: string;
  documentId: number;
  onChatChange: (chatId: string) => void;
  onNewChat: () => void;
}) {
  const { setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const {
    data: paginatedChatHistories,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = trpc.chat.getChatHistoryInfinite.useInfiniteQuery(
    {
      documentId,
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
    },
  );

  const deleteChatMutation = trpc.chat.deleteChatById.useMutation({
    onSuccess: () => {
      // Invalidar la query del historial de chats
      utils.chat.getChatHistoryInfinite.invalidate({ documentId });
      toast.success('Chat Eliminado!');
    },
    onError: () => {
      toast.error('Error al eliminar el chat');
    },
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Flatten all pages into a single array of chats
  const allChats = paginatedChatHistories?.pages.flatMap((page) => page.chats) || [];
  const hasEmptyChatHistory = allChats.length === 0;

  const handleDelete = async () => {
    if (!deleteId) return;

    setShowDeleteDialog(false);

    await deleteChatMutation.mutateAsync({ id: deleteId });

    if (deleteId === id) {
      await navigate('/');
    }
  };

  if (isLoading) {
    return (
      <SidebarGroup>
        <div className="text-sidebar-foreground/50 px-2 py-1 text-xs">Hoy</div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[44, 32, 28, 64, 52].map((item) => (
              <div key={item} className="flex h-8 items-center gap-2 rounded-md px-2">
                <div
                  className="bg-sidebar-accent-foreground/10 h-4 max-w-[--skeleton-width] flex-1 rounded-md"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="flex w-full flex-col items-center justify-center gap-6">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onNewChat();
                setOpenMobile(false);
              }}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Nuevo Chat
            </Button>
            <span className="px-2 text-sm text-zinc-500">
              Aqui es donde apareceran tus conversaciones una vez que comiences a chatear!
            </span>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupedChats = groupChatsByDate(allChats);

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <div className="flex w-full flex-col gap-6">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  onNewChat();
                  setOpenMobile(false);
                }}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Nuevo Chat
              </Button>

              {groupedChats.today.length > 0 && (
                <div>
                  <div className="text-sidebar-foreground/50 px-2 py-1 text-xs">Hoy</div>
                  {groupedChats.today.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onChatChange={onChatChange}
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                    />
                  ))}
                </div>
              )}

              {groupedChats.yesterday.length > 0 && (
                <div>
                  <div className="text-sidebar-foreground/50 px-2 py-1 text-xs">Ayer</div>
                  {groupedChats.yesterday.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                      onChatChange={onChatChange}
                    />
                  ))}
                </div>
              )}

              {groupedChats.lastWeek.length > 0 && (
                <div>
                  <div className="text-sidebar-foreground/50 px-2 py-1 text-xs">Ultimos 7 dias</div>
                  {groupedChats.lastWeek.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                      onChatChange={onChatChange}
                    />
                  ))}
                </div>
              )}

              {groupedChats.lastMonth.length > 0 && (
                <div>
                  <div className="text-sidebar-foreground/50 px-2 py-1 text-xs">
                    ultimos 30 dias
                  </div>
                  {groupedChats.lastMonth.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                      onChatChange={onChatChange}
                    />
                  ))}
                </div>
              )}

              {groupedChats.older.length > 0 && (
                <div>
                  <div className="text-sidebar-foreground/50 px-2 py-1 text-xs">
                    Antes de este mes
                  </div>
                  {groupedChats.older.map((chat) => (
                    <ChatItem
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === id}
                      onDelete={(chatId) => {
                        setDeleteId(chatId);
                        setShowDeleteDialog(true);
                      }}
                      setOpenMobile={setOpenMobile}
                      onChatChange={onChatChange}
                    />
                  ))}
                </div>
              )}
            </div>
          </SidebarMenu>

          <motion.div
            onViewportEnter={() => {
              if (!isFetchingNextPage && hasNextPage) {
                fetchNextPage();
              }
            }}
          />

          {!hasNextPage ? (
            <div className="mt-8 flex w-full flex-row items-center justify-center gap-2 px-2 text-sm text-zinc-500">
              Has llegado al final de tu historial de chats
            </div>
          ) : (
            <div className="mt-8 flex flex-row items-center gap-2 p-2 text-zinc-500 dark:text-zinc-400">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div>Cargando Chats...</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="z-9999">
          <AlertDialogHeader>
            <AlertDialogTitle>Estas completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este chat? Esto
              eliminará permanentemente el chat de tu historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
