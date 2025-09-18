import { useState } from 'react';
import React from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { FilePlus, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@documenso/lib/client-only/providers/session';
import { trpc } from '@documenso/trpc/react';
import { queryClient } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTrigger,
} from '@documenso/ui/primitives/drawer';
import {
  Faceted,
  FacetedBadgeList,
  FacetedContent,
  FacetedEmpty,
  FacetedGroup,
  FacetedInput,
  FacetedItem,
  FacetedList,
  FacetedTrigger,
} from '@documenso/ui/primitives/faceted';
import { Input } from '@documenso/ui/primitives/input';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';

type TeamMember = {
  name: string | null;
  email: string;
  userId: number;
};
type TaskCreateDialogProps = {
  taskRootPath: string;
  teamMembers?: TeamMember[];
  listId: string;
  parentTaskId?: number;
  isLoading?: boolean;
};

export const TaskCreateDialog = ({
  teamMembers,
  isLoading,
  listId,
  parentTaskId,
  taskRootPath,
}: TaskCreateDialogProps) => {
  const { user } = useSession(); // Obtenemos el usuario de la sesión
  const { t } = useLingui();

  const { mutateAsync: createTask } = trpc.task.createTask.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['boardsTasks'] });
    },
    onError: () => {
      toast.error(t`Error creating board`, {
        className: '',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(t`Record updated successfully`, {
          className: '',
          position: 'bottom-center',
        });
      }
    },
  });
  const [selectedUsers, setSelectedUsers] = React.useState<TeamMember[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = React.useState<string[] | undefined>([]);

  const [showTaskCreateDialog, setShowTaskCreateDialog] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskData, setTaskData] = useState<{
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dueDate: string;
    tags: string[];
  }>({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    tags: [],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTaskData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (value: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    setTaskData((prev) => ({ ...prev, priority: value }));
  };

  const onCreateTask = async () => {
    if (isCreatingTask || !user.id) {
      return;
    }

    setIsCreatingTask(true);
    console.log('Selected users:', selectedUsers);

    try {
      if (selectedTeamMember && selectedTeamMember.length > 0) {
        const assignees = teamMembers?.filter((member) =>
          selectedTeamMember.includes(member.name || member.email),
        );
        console.log('assignees to assign', assignees);
        const { id } = await createTask({
          ...taskData,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          assignees: assignees,
          taskRootPath,
          listId,
          parentTaskId,
        });
      } else {
        const { id } = await createTask({
          ...taskData,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          listId,
          parentTaskId,
          taskRootPath,
        });
      }

      setShowTaskCreateDialog(false);
      // await navigate(`${taskRootPath}/${id}`);
    } catch (error) {
      console.error('Error creating task:', error);

      let errorDescription = t`Please try again later.`;

      if (error.data?.code === 'P2025') {
        if (error.data?.meta?.modelName === 'User') {
          errorDescription = t`User session is invalid. Please log in again.`;
        } else if (error.data?.meta?.modelName === 'Team') {
          errorDescription = t`The specified team does not exist or you don't have access.`;
        } else if (error.data?.meta?.modelName === 'Project') {
          errorDescription = t`The specified project does not exist or you don't have access.`;
        }
      }
    } finally {
      setIsCreatingTask(false);
      setTaskData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        tags: [],
      });
      setSelectedUsers([]);
      setShowTaskCreateDialog(false);
    }
  };

  const canCreateTask = Boolean(user.id) && !isCreatingTask && taskData.title;

  return (
    <Drawer
      open={showTaskCreateDialog}
      onOpenChange={(value) => !isCreatingTask && setShowTaskCreateDialog(value)}
    >
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon">
          <PlusIcon className="h-4 w-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[90vh] !max-h-screen w-full">
        <DrawerHeader>
          {/* <DrawerTitle>
            <Trans>Create New Task</Trans>
          </DrawerTitle> */}
          {/* <DrawerDescription>
            <Trans>
              Create a new task with details like title, description, priority and due date.
            </Trans>
          </DrawerDescription> */}
          <div>
            <Trans>Title</Trans>
            <Input
              id="title"
              name="title"
              value={taskData.title}
              onChange={handleInputChange}
              className="mt-1"
              required
            />
          </div>
          <Faceted
            value={selectedTeamMember}
            onValueChange={(value) => {
              setSelectedTeamMember(value);
            }}
            multiple={true}
          >
            <FacetedTrigger asChild>
              <Button variant="outline" size="sm" className="w-full rounded font-normal">
                <FacetedBadgeList
                  max={10}
                  options={teamMembers?.map((member) => ({
                    label: member.name || member.email,
                    value: member.name || member.email,
                  }))}
                  placeholder={`Select team members...`}
                />
              </Button>
            </FacetedTrigger>
            <FacetedContent className="w-full origin-[var(--radix-popover-content-transform-origin)]">
              <FacetedInput aria-label={`Search options`} placeholder={'Search options...'} />
              <FacetedList>
                <FacetedEmpty>No options found.</FacetedEmpty>
                <FacetedGroup>
                  {teamMembers?.map((option) => (
                    <FacetedItem key={option.email} value={option.name || option.email}>
                      {/* {option.icon && <option.icon />} */}
                      <span>{option.name}</span>
                      {/* {option.count && (
                                    <span className="ml-auto font-mono text-xs">{option.count}</span>
                                  )} */}
                    </FacetedItem>
                  ))}
                </FacetedGroup>
              </FacetedList>
            </FacetedContent>
          </Faceted>
        </DrawerHeader>

        <div className="flex w-full flex-col space-y-4 px-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Trans>Priority</Trans>
              <Select value={taskData.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Trans>Due Date</Trans>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={taskData.dueDate}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>
          </div>

          <ScrollArea className="h-52 w-full max-w-full">{/* <BlockEditorClient /> */}</ScrollArea>

          {/* {teamMembers && teamMembers.length > 0 && (
            <div className="flex flex-col gap-2">
              <Popover modal={true}>
                <PopoverTrigger asChild className="w-fit">
                  <Button className="min-h-9 min-w-9">
                    <PlusIcon width="25" height="25" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="z-9999 w-fit">
                  <PopoverMembers
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                    userArray={teamMembers}
                  />
                </PopoverContent>
              </Popover>

              {selectedUsers.length > 0 ? (
                <div className="flex -space-x-2 overflow-hidden">
                  {selectedUsers.map((user) => (
                    <Avatar key={user.email} className="border-background inline-block border-2">
                      {user.name && <AvatarFallback>{user.name[0]}</AvatarFallback>}
                    </Avatar>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground h-10 text-sm">
                  Select users to add to this thread.
                </p>
              )}
            </div>
          )} */}
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button" size={'sm'} variant="secondary" disabled={isCreatingTask}>
              <Trans>Cancel</Trans>
            </Button>
          </DrawerClose>
          <Button
            type="button"
            size={'sm'}
            onClick={onCreateTask}
            disabled={!canCreateTask || isCreatingTask}
            loading={isCreatingTask}
          >
            <Trans>Create Task</Trans>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
