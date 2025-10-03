import { useEffect, useRef, useState } from 'react';
import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { ExpandIcon } from 'lucide-react';

import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@documenso/ui/primitives/card';
import { Sidebar, SidebarContent, SidebarProvider } from '@documenso/ui/primitives/sidebar';

import { useIsActiveStore } from '~/storage/active-full-container';

import { MessageInput } from './chat/message-input';
import { SidebarHistory } from './chat/sidebar-history';

type ChartLineLabelProps = {
  className?: string;
  title: string;
  description?: string;
  Icon?: LucideIcon;
  children: React.ReactNode;
  noFullSizeChildren?: React.ReactNode;
  identifier: string;
  fullScreenButton?: boolean;
  cardContentClassName?: string;
  onChatChange: (chatId: string) => void;
  selectedChatId?: string;
  documentId: number;
  onNewChat: () => void;
};

export function FullSizeCard({
  title,
  description,
  Icon,
  children,
  identifier,
  className,
  cardContentClassName,
  fullScreenButton = true,
  selectedChatId,
  documentId,
  onChatChange,
  onNewChat,
}: ChartLineLabelProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { setIsActive } = useIsActiveStore();

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setActiveGame(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setIsActive(activeGame !== null);
  }, [activeGame, setIsActive]);

  return (
    <>
      <AnimatePresence>
        {activeGame ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overlay bg-[#F7F7F7] dark:bg-[#1f1e1e]"
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {activeGame ? (
          <div className="active-game fixed bottom-0 z-50 flex items-center justify-center">
            <SidebarProvider className="items-start">
              <motion.div
                layoutId={`card-${identifier || title}`}
                className="inner flex"
                style={{ borderRadius: 12 }}
                ref={ref}
              >
                <Card
                  style={{ containerType: 'size' }}
                  className="col-span-1 flex h-full w-full flex-col justify-between gap-6 px-2 py-0"
                >
                  <CardHeader className="flex max-h-8 flex-col items-start gap-0 px-2">
                    <motion.div
                      layoutId={`title-header-${title}`}
                      className="flex w-full items-center justify-between gap-2"
                    >
                      <div className="game-title flex items-center gap-2">
                        {Icon && <Icon className="text-primary h-5 w-5" />}
                        <CardTitle className="text-base font-bold md:text-xl">{title}</CardTitle>
                        {/* {chats && (
                          <Select
                            onValueChange={onChatChange}
                            defaultValue={chats[0]?.id.toString()}
                          >
                            <SelectTrigger className="w-full max-w-52">
                              <SelectValue placeholder="Select a chat" className="line-clamp-1" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {chats.map((chat) => (
                                  <SelectItem key={chat.id} value={chat.id.toString()}>
                                    {chat.title}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )} */}
                      </div>

                      <Button
                        onClick={() => setActiveGame(null)}
                        size={'icon'}
                        variant={'ghost'}
                        className="-mr-1 h-fit w-fit !p-1"
                      >
                        <ExpandIcon size={16} />
                      </Button>
                    </motion.div>

                    <motion.div layoutId={`description-${title}`}>
                      <CardDescription className="text-foreground text-base">
                        {description}
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="flex h-[90cqh] w-full flex-row gap-3 px-2">
                    <Sidebar
                      collapsible="none"
                      className="bg-backgroundDark mb-10 hidden h-full w-64 rounded-md pb-10 md:flex"
                    >
                      <SidebarContent className="h-full">
                        <SidebarHistory
                          documentId={documentId}
                          onNewChat={onNewChat}
                          onChatChange={onChatChange}
                          id={selectedChatId ? selectedChatId : ''}
                        />
                        {/* <SidebarGroup>
                          <SidebarGroupContent>
                            <SidebarMenu>
                              <ScrollArea className="h-[70vh] w-full">
                                {chats &&
                                  chats.map((item) => (
                                    <SidebarMenuItem key={item.id}>
                                      <SidebarMenuButton
                                        asChild
                                        isActive={selectedChatId === item.id}
                                        onClick={() => onChatChange?.(item.id)}
                                      >
                                        <span className="line-clamp-1">
                                          {item.title.length > 20
                                            ? `${item.title.slice(0, 20)}...`
                                            : item.title}
                                        </span>
                                      </SidebarMenuButton>
                                    </SidebarMenuItem>
                                  ))}
                                </ScrollArea>
                            </SidebarMenu>
                          </SidebarGroupContent>
                        </SidebarGroup> */}
                      </SidebarContent>
                    </Sidebar>
                    <motion.div layoutId={`content-${title}`} className="h-full w-full">
                      {children}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </SidebarProvider>
          </div>
        ) : null}
      </AnimatePresence>

      <motion.div
        layoutId={`card-${identifier || title}`}
        className={cn('h-full w-full', className)}
      >
        <Card className={cn('flex h-full w-full flex-col gap-0', className)}>
          <CardHeader className="flex flex-col items-start gap-0 p-4 pb-0">
            <motion.div
              layoutId={`title-header-${title}`}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="game-title flex w-full items-center gap-2">
                {Icon && <Icon className="text-primary h-5 w-5" />}
                <CardTitle className="text-base font-bold md:text-xl">Chat</CardTitle>
                {/* {chats && (
                  <Select onValueChange={onChatChange} defaultValue={chats[0]?.id.toString()}>
                    <SelectTrigger className="w-full max-w-52">
                      <SelectValue placeholder="Select a chat" className="line-clamp-1" />
                    </SelectTrigger>
                    <SelectContent aria-modal="true">
                      <SelectGroup>
                        {chats.map((chat) => (
                          <SelectItem key={chat.id} value={chat.id.toString()}>
                            {chat.title}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )} */}
              </div>

              {fullScreenButton && (
                <Button
                  onClick={() => setActiveGame(title)}
                  size={'icon'}
                  variant={'ghost'}
                  className="-mr-1 h-fit w-fit !p-1"
                >
                  <ExpandIcon size={16} />
                </Button>
              )}
            </motion.div>

            <motion.div layoutId={`description-${title}`}>
              <CardDescription className="text-foreground line-clamp-2 text-base">
                {description}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className={cn('p-4 pt-0', cardContentClassName)}>
            <motion.div layoutId={`content-${title}`} className="h-fit">
              <div onClick={() => setActiveGame(title)} className="z-10 h-fit w-full">
                <MessageInput className="" allowAttachments={false} value="" isGenerating />
              </div>
              <div className="h-0 overflow-hidden">{children}</div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
