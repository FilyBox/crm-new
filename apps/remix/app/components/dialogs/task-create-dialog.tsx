import { useState } from 'react';
import React from 'react';

import { Trans, useLingui } from '@lingui/react/macro';
import { PlusIcon, X } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@documenso/lib/client-only/providers/session';
import { trpc } from '@documenso/trpc/react';
import { queryClient } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
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
import { Label } from '@documenso/ui/primitives/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Textarea } from '@documenso/ui/primitives/textarea';

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
  const { user } = useSession();
  const { t } = useLingui();

  const { mutateAsync: createTask } = trpc.task.createTask.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['listTasks'] });
    },
    onError: () => {
      toast.error(t`Error creating task`, {
        className: '',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(t`Task created successfully`, {
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

    try {
      if (selectedTeamMember && selectedTeamMember.length > 0) {
        const assignees = teamMembers?.filter((member) =>
          selectedTeamMember.includes(member.name || member.email),
        );

        await createTask({
          ...taskData,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          assignees: assignees,
          taskRootPath,
          listId,
          parentTaskId,
        });
      } else {
        await createTask({
          ...taskData,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          listId,
          parentTaskId,
          taskRootPath,
        });
      }

      setShowTaskCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error creating task:', error);

      let errorDescription = t`Please try again later.`;

      if (error.data?.code === 'P2025') {
        if (error.data?.meta?.modelName === 'User') {
          errorDescription = t`User session is invalid. Please log in again.`;
        } else if (error.data?.meta?.modelName === 'Team') {
          errorDescription = t`The specified team does not exist or you don't have access.`;
        }
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  const resetForm = () => {
    setTaskData({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: '',
      tags: [],
    });
    setSelectedUsers([]);
    setSelectedTeamMember([]);
  };

  const canCreateTask = Boolean(user.id) && !isCreatingTask && taskData.title.trim();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'text-green-600 bg-green-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100';
      case 'CRITICAL':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-foreground bg-gray-100';
    }
  };

  return (
    <Dialog open={showTaskCreateDialog} onOpenChange={setShowTaskCreateDialog}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:bg-muted-foreground/20 hover:text-primary-foreground flex h-8 w-full items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white"
        >
          <PlusIcon className="h-4 w-4" />
          <Trans>Add a card</Trans>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0">
        <DialogHeader className="space-y-0 p-4 pb-2">
          <DialogTitle className="text-foreground text-sm font-medium">
            <Trans>Add a card</Trans>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-4 pt-0">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground text-xs font-medium">
              <Trans>Title</Trans>
            </Label>
            <Textarea
              id="title"
              name="title"
              value={taskData.title}
              onChange={handleInputChange}
              placeholder="Enter a title for this card..."
              className="min-h-[60px] resize-none border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground text-xs font-medium">
              <Trans>Description</Trans>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={taskData.description}
              onChange={handleInputChange}
              placeholder="Add a more detailed description..."
              className="min-h-[80px] resize-none border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Assignees */}
          {teamMembers && teamMembers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-medium">
                <Trans>Assignees</Trans>
              </Label>
              <Faceted
                value={selectedTeamMember}
                onValueChange={(value) => setSelectedTeamMember(value)}
                multiple={true}
              >
                <FacetedTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-foreground w-full justify-start border-gray-300 text-sm font-normal hover:border-gray-400"
                  >
                    <FacetedBadgeList
                      max={3}
                      options={teamMembers?.map((member) => ({
                        label: member.name || member.email,
                        value: member.name || member.email,
                      }))}
                      placeholder="Select members..."
                    />
                  </Button>
                </FacetedTrigger>
                <FacetedContent className="z-9999 w-full">
                  <FacetedInput
                    aria-label="Search members"
                    placeholder="Search members..."
                    className="text-sm"
                  />
                  <FacetedList>
                    <FacetedEmpty>No members found.</FacetedEmpty>
                    <FacetedGroup>
                      {teamMembers?.map((member) => (
                        <FacetedItem key={member.email} value={member.name || member.email}>
                          <div className="flex items-center space-x-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                              {(member.name || member.email).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm">{member.name || member.email}</span>
                          </div>
                        </FacetedItem>
                      ))}
                    </FacetedGroup>
                  </FacetedList>
                </FacetedContent>
              </Faceted>
            </div>
          )}

          {/* Priority and Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-foreground text-xs font-medium">
                <Trans>Priority</Trans>
              </Label>
              <Select value={taskData.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue>
                    <div
                      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${getPriorityColor(taskData.priority)}`}
                    >
                      {taskData.priority}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Low</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CRITICAL">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <span>Critical</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-foreground text-xs font-medium">
                <Trans>Due Date</Trans>
              </Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={taskData.dueDate}
                onChange={handleInputChange}
                className="border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 pt-2">
            <Button
              type="button"
              onClick={onCreateTask}
              disabled={!canCreateTask}
              loading={isCreatingTask}
              className="bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Trans>Add card</Trans>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowTaskCreateDialog(false)}
              disabled={isCreatingTask}
              className="text-foreground text-sm hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
