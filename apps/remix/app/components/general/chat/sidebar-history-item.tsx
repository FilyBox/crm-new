import { memo } from 'react';

import type { Chat } from '@prisma/client';
import { MoreHorizontalIcon, Trash2Icon as TrashIcon } from 'lucide-react';

import { buttonVariants } from '@documenso/ui/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@documenso/ui/primitives/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@documenso/ui/primitives/tooltip';

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
  onChatChange,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
  onChatChange: (chatId: string) => void;
}) => {
  return (
    <SidebarMenuItem className="flex w-full justify-between gap-4">
      <SidebarMenuButton asChild isActive={isActive}>
        <Tooltip disableHoverableContent={true}>
          <TooltipTrigger asChild>
            <button
              className={buttonVariants({
                variant: 'ghost',
                size: 'sm',
                className: `relative block w-full overflow-hidden ${!isActive ? 'pr-14' : ''}`,
              })}
              onClick={() => {
                setOpenMobile(false);
                onChatChange(chat.id);
              }}
            >
              <span
                className="line-clamp-1 block w-full whitespace-nowrap break-keep text-start"
                style={{ WebkitMaskImage: 'linear-gradient(90deg, black 70%, transparent)' }}
              >
                {chat.title}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent className="pointer-events-none" align="start">
            {chat.title}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuButton>
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground top-2 mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" className="z-9999" align="end">
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/15 focus:text-destructive cursor-pointer dark:text-red-500"
            onSelect={() => onDelete(chat.id)}
          >
            <TrashIcon />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});
