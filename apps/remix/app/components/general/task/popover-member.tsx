import React from 'react';

import { Check } from 'lucide-react';

import { Avatar, AvatarFallback } from '@documenso/ui/primitives/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@documenso/ui/primitives/command';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';

const users = [
  {
    name: 'Olivia Martin',
    email: 'm@example.com',
    avatar: '/avatars/01.png',
  },
] as const;
type TeamMember = {
  name: string | null;
  email: string;
};
interface PopoverMembersProps {
  selectedUsers: TeamMember[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
}

interface PopoverMembersProps {
  selectedUsers: TeamMember[];
  setSelectedUsers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  userArray: readonly {
    readonly name: string | null;
    readonly email: string;
  }[];
}

export const PopoverMembers = ({
  selectedUsers,
  userArray,
  setSelectedUsers,
}: PopoverMembersProps) => {
  return (
    <Command className="z-9999 rounded-t-none border-t bg-transparent">
      <CommandInput placeholder="Search user..." />
      <CommandList className="!h-fit">
        <CommandEmpty>No hay historial de miembros</CommandEmpty>
        <CommandGroup className="p-2">
          <ScrollArea className="h-56">
            {userArray.map((user) => (
              <CommandItem
                key={user.email}
                className="relative flex items-center px-2"
                onSelect={() => {
                  if (selectedUsers.some((selectedUser) => selectedUser.email === user.email)) {
                    // Si el usuario ya está seleccionado, lo quitamos
                    setSelectedUsers(
                      selectedUsers.filter((selectedUser) => selectedUser.email !== user.email),
                    );
                  } else {
                    // Si no está seleccionado, lo añadimos a la lista actual
                    setSelectedUsers([...selectedUsers, user]);
                  }
                }}
              >
                <Avatar
                  key={user.email}
                  className="border-background inline-block border-2 bg-gray-200"
                >
                  {user.name && <AvatarFallback>{user.name[0]}</AvatarFallback>}
                </Avatar>
                <div className="">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                </div>
                {selectedUsers.some((selectedUser) => selectedUser.email === user.email) ? (
                  <Check className="text-primary bg-foreground absolute right-2 ml-auto flex h-6 w-6 rounded-full p-1" />
                ) : null}
              </CommandItem>
            ))}
          </ScrollArea>
        </CommandGroup>
      </CommandList>
    </Command>
  );
};
