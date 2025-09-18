import { useEffect } from 'react';
import React from 'react';

import type { Board } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@documenso/ui/primitives/kanban';
import { ScrollArea, ScrollBar } from '@documenso/ui/primitives/scroll-area';

import { ListDialog } from '~/components/dialogs/list-dialog';
import { TaskCreateDialog } from '~/components/dialogs/task-create-dialog';
import { getEventColorClasses } from '~/components/general/event-calendar';
import { StackAvatarsTasksWithTooltip } from '~/components/general/stack-avatars-tasks-with-tooltip';
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
  });
}

export default function TasksPage() {
  const { boardId } = useSuperLoaderData<typeof loader>();

  const { filters, joinOperator } = useSortParams({ sortColumns: z.enum(['createdAt']) });
  const team = useCurrentTeam();
  const [editingTask, setEditingTask] = React.useState<TTask | null>(null);
  const [editingBoard, setEditingBoard] = React.useState<Board | null>(null);
  const taskRootPath = formTasksPath(team.url);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const { data, refetch, isLoading } = trpc.task.findLists.useQuery(
    {
      filterStructure: filters,
      joinOperator: joinOperator,
      boardId: boardId,
    },
    queryOptions({
      queryKey: ['listTasks', filters, joinOperator],
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }),
  );

  const [kanbanData, setKanbanData] = React.useState<any[]>([]);

  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      setKanbanData(data.data);
    } else {
      setKanbanData([]);
    }
  }, [data?.data]);

  const {
    data: teamMembers,
    isLoading: isTeamMembersLoading,
    isLoadingError,
  } = trpc.team.member.getMany.useQuery(
    {
      teamId: team.id,
    },
    {
      placeholderData: (previousData) => previousData,
    },
  );

  if (isLoading || isTeamMembersLoading) {
    return <div className="bg-muted h-full w-full animate-pulse" />;
  }

  return (
    <div className="mx-auto max-w-screen-xl gap-y-8 px-4 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8">
        <ListDialog
          isOpen={isSheetOpen}
          boardId={boardId}
          setIsSheetOpen={setIsSheetOpen}
          setInitialData={setEditingBoard}
          onSave={() => {
            void refetch();
          }}
          onClose={() => {}}
          onDelete={() => {
            void refetch();
          }}
          board={null}
        />
        <ScrollArea className="h-fit w-full max-w-screen-xl">
          {data && data.columns && data.columns.length > 0 && (
            <KanbanProvider columns={data.columns} data={kanbanData} onDataChange={setKanbanData}>
              {(column) => (
                <KanbanBoard
                  className={cn('', getEventColorClasses(column.color))}
                  id={column.id}
                  key={column.id}
                >
                  <KanbanHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn('h-2 w-2 rounded-full', getEventColorClasses(column.color))}
                        />
                        <span className="text-sm font-semibold">{column.name}</span>
                        <Badge variant="secondary" className="pointer-events-none rounded-sm">
                          {kanbanData.filter((task) => task.column === column.id).length}
                        </Badge>
                      </div>
                      <TaskCreateDialog
                        taskRootPath={taskRootPath}
                        listId={column.id}
                        teamMembers={teamMembers}
                      />
                    </div>
                  </KanbanHeader>
                  <KanbanCards id={column.id}>
                    {(task: any) => (
                      <KanbanCard key={task.id} id={task.id} name={task.name} column={task.column}>
                        <TaskCardContent task={task} />
                      </KanbanCard>
                    )}
                  </KanbanCards>
                </KanbanBoard>
              )}
            </KanbanProvider>
          )}
          <ScrollBar orientation="horizontal" className="bottom-1" />
        </ScrollArea>
      </div>
    </div>
  );
}

function TaskCardContent({ task }: { task: any }) {
  const date = task.dueDate ? new Date(task.dueDate) : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs">
          {date ? format(date, 'MMMM dd, yyyy', { locale: es }) : 'No due date'}
        </p>
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

      <div className="flex items-center justify-between gap-2">
        <span className="line-clamp-1 text-sm font-medium">{task.title || task.name}</span>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        {task.enhancedAssignees && task.enhancedAssignees.length > 0 ? (
          <div className="flex items-center gap-1">
            <StackAvatarsTasksWithTooltip enhancedAssignees={task.enhancedAssignees} />
          </div>
        ) : (
          <span className="text-muted-foreground">No assignees</span>
        )}
      </div>
    </div>
  );
}
