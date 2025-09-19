import { useCallback, useEffect } from 'react';
import React from 'react';

import type { List } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GripVertical, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { getSession } from '@documenso/auth/server/lib/utils/get-session';
import { getBoardById } from '@documenso/lib/server-only/document/get-board-by-id';
import { getTeamByUrl } from '@documenso/lib/server-only/team/get-team';
import { getTeamMembers } from '@documenso/lib/server-only/team/get-team-members';
import { type TTask } from '@documenso/lib/types/task';
import { formTasksPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent, CardHeader } from '@documenso/ui/primitives/card';
import * as Kanban from '@documenso/ui/primitives/kanban-prev';
import { ScrollArea, ScrollBar } from '@documenso/ui/primitives/scroll-area';

import { ListDialog } from '~/components/dialogs/list-dialog';
import { TaskCreateDialog } from '~/components/dialogs/task-create-dialog';
import {
  getEventColorClasses,
  getEventColorClassesGradient,
} from '~/components/general/event-calendar';
import { ListPopover } from '~/components/general/list-popover';
import { StackAvatarsTasksWithTooltip } from '~/components/general/stack-avatars-tasks-with-tooltip';
import { useDebounceQueue } from '~/hooks/use-debounce-queue';
import { useKanbanState } from '~/hooks/use-kanban-state';
import { useCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';
import { superLoaderJson, useSuperLoaderData } from '~/utils/super-json-loader';

import type { Route } from './+types/tasks.b.$boardId._index';

export function meta() {
  return appMetaTags('Tasks');
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const { boardId } = params;
  const { user } = await getSession(request);
  const team = await getTeamByUrl({ userId: user.id, teamUrl: params.teamUrl });

  const [teamMembers, board] = await Promise.all([
    getTeamMembers({ userId: user.id, teamId: team.id }),
    getBoardById({ boardId }),
  ]);
  const currentTeamMember = teamMembers.find((member) => member.userId === user.id);

  if (!board) {
    throw new Response('Not Found', { status: 404 });
  }

  if (
    currentTeamMember &&
    currentTeamMember.teamRole === 'MEMBER' &&
    board.visibility !== 'EVERYONE' &&
    board.visibility !== 'ONLY_ME'
  ) {
    throw new Response('Not Found', { status: 404 });
  }

  return superLoaderJson({
    boardId,
    board,
  });
}

export default function TasksPage() {
  const { boardId, board } = useSuperLoaderData<typeof loader>();
  const { filters, joinOperator } = useSortParams({ sortColumns: z.enum(['createdAt']) });
  const team = useCurrentTeam();
  const taskRootPath = formTasksPath(team.url);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectetList, setSelectedList] = React.useState<Pick<
    List,
    'id' | 'name' | 'color'
  > | null>(null);
  const [openEditDialogs, setOpenEditDialogs] = React.useState<Record<string, boolean>>({});

  const { data, isLoading, refetch } = trpc.task.findLists.useQuery(
    {
      filterStructure: filters,
      joinOperator: joinOperator,
      boardId: boardId,
    },
    queryOptions({
      queryKey: ['listTasks', filters, joinOperator, boardId],
      staleTime: Infinity,
      refetchOnWindowFocus: true,
      refetchOnReconnect: false,
      refetchOnMount: true,
    }),
  );

  const { data: teamMembers, isLoading: isTeamMembersLoading } = trpc.team.member.getMany.useQuery(
    {
      teamId: team.id,
    },
    {
      placeholderData: (previousData) => previousData,
    },
  );

  // Todo el estado y lógica del Kanban está en el hook
  const {
    columns,
    columnOrder,
    pendingTaskUpdates,
    pendingListUpdates,
    hasPendingOperations,
    handleKanbanChange,
    handleMove,
  } = useKanbanState({
    data,
    boardId,
  });

  const handleEditList = (list: { id: string; name: string; color: string | null }) => {
    setSelectedList({
      id: list.id,
      name: list.name,
      color: (list.color as List['color']) ?? null,
    });
    setOpenEditDialogs((prev) => ({ ...prev, [list.id]: true }));
  };

  const handleCloseEditDialog = (listId: string) => {
    setOpenEditDialogs((prev) => ({ ...prev, [listId]: false }));
  };

  if (isLoading || isTeamMembersLoading) {
    return <div className="bg-muted h-full w-full animate-pulse" />;
  }

  return (
    <div className="mx-auto h-[90dvh] max-w-screen-xl gap-y-8 px-4 md:px-8">
      <Card
        className={cn(
          'h-full w-full overflow-hidden px-0',
          getEventColorClassesGradient(board.color || 'blue'),
        )}
      >
        <CardContent className="max-w-screen-x h-full w-full px-0">
          <CardHeader className="py-2 pt-6">
            <h3 className="text-foreground text-xl font-semibold">
              {board.name.charAt(0).toUpperCase() + board.name.slice(1)}
            </h3>
            <div className="h-5">
              {hasPendingOperations && (
                <div className="text-muted-foreground text-xs">Saving changes...</div>
              )}
            </div>
          </CardHeader>
          <ScrollArea
            style={{ containerType: 'size' }}
            className="h-[calc(100%-86px)] w-full max-w-screen-xl"
          >
            <section className="flex !h-full justify-start gap-6 px-4">
              <Kanban.Root
                value={columns}
                onValueChange={handleKanbanChange}
                onMove={handleMove}
                getItemValue={(item) => item.id}
              >
                <Kanban.Board className="flex !h-full w-fit justify-start gap-6">
                  {columnOrder.map((listId) => {
                    const list = data?.lists.find((l) => l.id === listId);
                    const tasks = columns[listId] || [];

                    if (!list) return null;

                    return (
                      <TaskColumn
                        key={listId}
                        value={listId}
                        list={list}
                        tasks={tasks}
                        boardId={boardId}
                        teamMembers={teamMembers}
                        taskRootPath={taskRootPath}
                        onEditList={handleEditList}
                        openEditDialogs={openEditDialogs}
                        onCloseEditDialog={handleCloseEditDialog}
                        selectetList={selectetList}
                        isPending={pendingListUpdates.has(listId)}
                        pendingTaskIds={pendingTaskUpdates}
                      />
                    );
                  })}
                </Kanban.Board>
                <Kanban.Overlay>
                  {({ value, variant }) => {
                    if (variant === 'column') {
                      const list = data?.lists.find((l) => l.id === value);
                      const tasks = columns[value] ?? [];

                      if (!list) return null;

                      return (
                        <TaskColumn
                          value={value}
                          list={list}
                          onSave={() => {
                            void refetch();
                          }}
                          tasks={tasks}
                          boardId={boardId}
                          teamMembers={teamMembers}
                          taskRootPath={taskRootPath}
                          onEditList={handleEditList}
                          openEditDialogs={openEditDialogs}
                          onCloseEditDialog={handleCloseEditDialog}
                          selectetList={selectetList}
                          isPending={false}
                          pendingTaskIds={new Set()}
                        />
                      );
                    }

                    const task = Object.values(columns)
                      .flat()
                      .find((task) => task.id === value);

                    if (!task) return null;

                    return <TaskCard task={task} isPending={pendingTaskUpdates.has(task.id)} />;
                  }}
                </Kanban.Overlay>
              </Kanban.Root>

              <ListDialog
                onSave={() => {
                  void refetch();
                }}
                isOpen={isSheetOpen}
                boardId={boardId}
                setIsSheetOpen={setIsSheetOpen}
                onClose={() => {}}
                board={null}
              />
            </section>
            <ScrollBar orientation="horizontal" className="bottom-1" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

interface TaskCardProps extends Omit<React.ComponentProps<typeof Kanban.Item>, 'value'> {
  task: TTask;
  isPending?: boolean;
}

function TaskCard({ task, isPending = false, ...props }: TaskCardProps) {
  const date = task.dueDate ? new Date(task.dueDate) : undefined;

  return (
    <Kanban.Item key={task.id} value={task.id} asChild {...props}>
      <div className={cn('bg-card shadow-xs rounded-md p-3 transition-opacity')}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {date ? format(date, 'MMMM dd, yyyy', { locale: es }) : 'No due date'}
            </p>
            <div className="flex items-center gap-1">
              <Badge
                variant={
                  task.priority === 'CRITICAL'
                    ? 'destructive'
                    : task.priority === 'MEDIUM'
                      ? 'default'
                      : 'secondary'
                }
                size={'small'}
                className="pointer-events-none h-5 rounded-sm px-1.5 text-[11px] capitalize"
              >
                {task.priority}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="line-clamp-1 text-sm font-medium">{task.title}</span>
          </div>

          <div className="text-muted-foreground flex items-center justify-between text-xs">
            {task.enhancedAssignees && task.enhancedAssignees.length > 0 ? (
              <div className="flex items-center gap-1">
                <StackAvatarsTasksWithTooltip
                  enhancedAssignees={task.enhancedAssignees.map((a) => ({
                    name: a.name ?? null,
                    email: a.email,
                  }))}
                />
              </div>
            ) : (
              <span className="text-muted-foreground">No assignees</span>
            )}
          </div>
        </div>
      </div>
    </Kanban.Item>
  );
}

interface TaskColumnProps extends Omit<React.ComponentProps<typeof Kanban.Column>, 'children'> {
  tasks: TTask[];
  list: List;
  boardId: string;
  teamMembers: any;
  taskRootPath: string;
  onEditList: (list: { id: string; name: string; color: string | null }) => void;
  openEditDialogs: Record<string, boolean>;
  onCloseEditDialog: (listId: string) => void;
  selectetList: Pick<List, 'id' | 'name' | 'color'> | null;
  isPending?: boolean;
  pendingTaskIds: Set<number>;
  onSave?: () => void;
}

function TaskColumn({
  value,
  tasks,
  list,
  boardId,
  teamMembers,
  taskRootPath,
  onEditList,
  openEditDialogs,
  onCloseEditDialog,
  selectetList,
  isPending = false,
  onSave,
  pendingTaskIds,
  ...props
}: TaskColumnProps) {
  return (
    <Kanban.Column
      value={value}
      className={cn(
        'h-full min-w-60 max-w-60 !rounded-xl !border-none transition-opacity',
        getEventColorClasses(list.color || 'blue'),
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-6 pt-4">
        <div className="flex items-center gap-2">
          <span className="line-clamp-1 whitespace-nowrap break-keep text-sm font-semibold">
            {list.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="pointer-events-none rounded-sm">
            {tasks.length}
          </Badge>
          <ListPopover
            onSave={onSave}
            boardId={boardId}
            list={selectetList}
            isOpen={openEditDialogs[list.id] || false}
            setIsSheetOpen={(isOpen) => {
              if (!isOpen) {
                onCloseEditDialog(list.id);
              }
            }}
          >
            <Button
              onClick={() => {
                onEditList(list);
              }}
              variant="ghost"
              size="icon"
              className="h-fit w-fit p-1"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </ListPopover>
          <Kanban.ColumnHandle asChild>
            <Button variant="ghost" size="icon" className="h-fit w-fit p-1">
              <GripVertical className="h-4 w-4" />
            </Button>
          </Kanban.ColumnHandle>
        </div>
      </div>
      <div className="flex h-fit max-h-[80cqh] min-h-36 flex-col gap-2 overflow-y-auto p-0.5 px-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} asHandle isPending={pendingTaskIds.has(task.id)} />
        ))}
      </div>
      <div className="w-full p-2">
        <TaskCreateDialog
          onSave={() => {
            void onSave?.();
          }}
          taskRootPath={taskRootPath}
          listId={list.id}
          teamMembers={teamMembers}
        />
      </div>
    </Kanban.Column>
  );
}
