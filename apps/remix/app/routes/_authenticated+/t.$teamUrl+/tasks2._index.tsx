import { useEffect } from 'react';
import React from 'react';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GripVertical, PlusIcon } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { z } from 'zod';

import { type TTask } from '@documenso/lib/types/task';
import { formTasksPath } from '@documenso/lib/utils/teams';
import { type Team } from '@documenso/prisma/client';
import { ExtendedTaskPriority } from '@documenso/prisma/types/extended-task-priority';
import { trpc } from '@documenso/trpc/react';
import { Badge } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import * as Kanban from '@documenso/ui/primitives/kanban-prev';

import { useOptionalCurrentTeam } from '~/providers/team';
import { appMetaTags } from '~/utils/meta';
import { useSortParams } from '~/utils/searchParams';

export function meta() {
  return appMetaTags('Tasks');
}

const sortColumns = z.enum([
  'id',
  'externalId',
  'userId',
  'description',
  'priority',
  'status',
  'dueDate',
  'tags',
  'projectId',
  'parentTaskId',
  'title',
  'createdAt',
  'updatedAt',
  'completedAt',
  'deletedAt',
  'teamId',
]);

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: Date;
  enhancedAssignees?: Array<{
    name?: string;
    email: string;
  }>;
}

const COLUMN_TITLES: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export default function TasksPage() {
  const [searchParams] = useSearchParams();

  const { filters, applyFilters, perPage, query, page, joinOperator, columnDirection } =
    useSortParams({ sortColumns });

  const navigate = useNavigate();
  const team = useOptionalCurrentTeam();
  const taskRootPath = formTasksPath(team?.url);

  const { data, refetch } = trpc.task.findTasks.useQuery({
    query: query,
    // type: findDocumentSearchParams.type,
    // release: findDocumentSearchParams.release,
    page: page,
    perPage: perPage,
    // artistIds: findDocumentSearchParams.artistIds,
    orderByDirection: columnDirection as 'asc' | 'desc',
    filterStructure: applyFilters ? filters : [],
    joinOperator: joinOperator,
  });

  const [columns, setColumns] = React.useState<Record<string, TTask[]>>({});
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);

  useEffect(() => {
    // Inicializar todas las columnas vacías primero
    const initialColumns = Object.keys(COLUMN_TITLES).reduce(
      (acc, status) => {
        acc[status] = [];
        return acc;
      },
      {} as Record<string, TTask[]>,
    );

    // Establecer el orden inicial de las columnas
    const initialOrder = Object.keys(COLUMN_TITLES);
    setColumnOrder(initialOrder);

    if (data?.data?.data) {
      const groupedTasks = data.data.data.reduce((acc, task) => {
        const priority = task.priority;

        if (acc[priority]) {
          acc[priority].push(task as unknown as TTask);
        }

        return acc;
      }, initialColumns);
      setColumns(groupedTasks);
    } else {
      setColumns(initialColumns);
    }
  }, [data?.data?.data]);

  // Función para detectar cambios de tareas
  function detectTaskChanges(
    oldColumns: Record<string, TTask[]>,
    newColumns: Record<string, TTask[]>,
  ) {
    const changes: Array<{
      taskId: number;
      fromColumn: string | null;
      toColumn: string;
      fromIndex: number;
      toIndex: number;
    }> = [];

    Object.entries(newColumns).forEach(([columnKey, tasks]) => {
      tasks.forEach((task, newIndex) => {
        let oldColumn: string | null = null;
        let oldIndex = -1;

        Object.entries(oldColumns).forEach(([oldColumnKey, oldTasks]) => {
          const taskIndex = oldTasks.findIndex((t) => t.id === task.id);
          if (taskIndex !== -1) {
            oldColumn = oldColumnKey;
            oldIndex = taskIndex;
          }
        });

        if (oldColumn !== columnKey || oldIndex !== newIndex) {
          changes.push({
            taskId: task.id,
            fromColumn: oldColumn,
            toColumn: columnKey,
            fromIndex: oldIndex,
            toIndex: newIndex,
          });
        }
      });
    });

    return changes;
  }

  // Función para detectar cambios de orden de columnas
  function detectColumnChanges(oldOrder: string[], newOrder: string[]) {
    const changes: Array<{
      columnId: string;
      fromIndex: number;
      toIndex: number;
    }> = [];

    newOrder.forEach((columnId, newIndex) => {
      const oldIndex = oldOrder.indexOf(columnId);
      if (oldIndex !== newIndex && oldIndex !== -1) {
        changes.push({
          columnId,
          fromIndex: oldIndex,
          toIndex: newIndex,
        });
      }
    });

    return changes;
  }

  // Handler para cambios de tareas
  const handleKanbanChange = (newColumns: Record<string, TTask[]>) => {
    const taskChanges = detectTaskChanges(columns, newColumns);
    setColumns(newColumns);

    for (const change of taskChanges) {
      console.log('Cambio de tarea:', {
        tarea: change.taskId,
        de: change.fromColumn || 'nueva',
        hacia: change.toColumn,
        posicionAnterior: change.fromIndex,
        posicionNueva: change.toIndex,
      });
    }
  };

  // Handler para el evento onMove (captura tanto tareas como columnas)
  const handleMove = (event: any) => {
    const { active, over, activeIndex, overIndex } = event;

    // Verificar si es una columna la que se está moviendo
    if (active.id in columns && over?.id in columns) {
      console.log('Movimiento de columna detectado:', {
        columna: active.id,
        deIndice: activeIndex,
        aIndice: overIndex,
        dePosicion: columnOrder.indexOf(active.id as string),
        aPosicion: columnOrder.indexOf(over.id as string),
      });

      // Actualizar el orden de las columnas
      const newOrder = [...columnOrder];
      const draggedColumnId = active.id as string;
      const targetColumnId = over.id as string;

      const draggedIndex = newOrder.indexOf(draggedColumnId);
      const targetIndex = newOrder.indexOf(targetColumnId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Remover la columna de su posición actual
        newOrder.splice(draggedIndex, 1);
        // Insertarla en la nueva posición
        newOrder.splice(targetIndex, 0, draggedColumnId);

        setColumnOrder(newOrder);

        console.log('Nuevo orden de columnas:', newOrder);

        // Aquí puedes hacer la llamada a la API para guardar el nuevo orden
        // await updateColumnOrder(newOrder);
      }
    } else {
      // Es un movimiento de tarea
      console.log('Movimiento de tarea:', {
        tarea: active.id,
        deIndice: activeIndex,
        aIndice: overIndex,
      });
    }
  };

  return (
    <div className="mx-auto max-w-screen-xl gap-y-8 px-4 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-8">
        <Kanban.Root
          value={columns}
          onValueChange={handleKanbanChange}
          onMove={handleMove}
          getItemValue={(item) => item.id}
        >
          <Kanban.Board className="grid auto-rows-fr grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Usar el orden de columnas para renderizar */}
            {columnOrder.map((columnValue) => {
              const tasks = columns[columnValue] || [];
              return <TaskColumn key={columnValue} value={columnValue} tasks={tasks} />;
            })}
          </Kanban.Board>
          <Kanban.Overlay>
            {({ value, variant }) => {
              if (variant === 'column') {
                const tasks = columns[value] ?? [];
                return <TaskColumn value={value} tasks={tasks} />;
              }

              const task = Object.values(columns)
                .flat()
                .find((task) => task.id === value);

              if (!task) return null;

              return <TaskCard task={task} />;
            }}
          </Kanban.Overlay>
        </Kanban.Root>
      </div>
    </div>
  );
}

interface TaskCardProps extends Omit<React.ComponentProps<typeof Kanban.Item>, 'value'> {
  task: TTask;
}
function TaskCard({ task, ...props }: TaskCardProps) {
  let progress = 0;
  switch (task.status) {
    case 'PENDING':
      progress = 0;
      break;
    case 'IN_PROGRESS':
      progress = 50;
      break;
    case 'COMPLETED':
      progress = 100;
      break;
    case 'CANCELLED':
      progress = 100; // Cancelled tasks are considered "complete" for progress bar
      break;
    case 'BLOCKED':
      progress = 25; // Blocked tasks show some progress but clearly not complete
      break;
    default:
      progress = 0;
  }

  const date = task.dueDate ? new Date(task.dueDate) : undefined;
  return (
    <Kanban.Item key={task.id} value={task.id} asChild {...props}>
      <div className="bg-card shadow-xs rounded-md border p-3">
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
            <span className="line-clamp-1 text-sm font-medium">{task.title}</span>
          </div>
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            {task.enhancedAssignees && task.enhancedAssignees.length > 0 ? (
              <div className="flex items-center gap-1">
                {/* <StackAvatarsTasksWithTooltip
                  enhancedAssignees={
                    task.enhancedAssignees?.map((assignee) => ({
                      name: assignee.name || null,
                      email: assignee.email,
                    })) || []
                  }
                /> */}
              </div>
            ) : (
              <>
                <span className="text-muted-foreground">No assignees</span>
              </>
            )}
            {/* {task.dueDate && <time className="text-[10px] tabular-nums">{task.dueDate}</time>} */}
          </div>
        </div>
      </div>
    </Kanban.Item>
  );
}

interface TaskColumnProps extends Omit<React.ComponentProps<typeof Kanban.Column>, 'children'> {
  tasks: TTask[];
}

function TaskColumn({ value, tasks, ...props }: TaskColumnProps) {
  return (
    <Kanban.Column
      onDragEnd={(event) => {
        console.log('event', event);
      }}
      onDropCapture={(event) => {
        console.log('event', event);
      }}
      value={value}
      {...props}
    >
      <div className="bg-card flex items-center justify-between rounded border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <PlusIcon className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold">{COLUMN_TITLES[value]}</span>
          <Badge variant="secondary" className="pointer-events-none rounded-sm">
            {tasks.length}
          </Badge>
        </div>
        <Kanban.ColumnHandle
          onDragEnd={(event) => {
            console.log('event', event);
          }}
          asChild
        >
          <Button variant="ghost" size="icon">
            <GripVertical className="h-4 w-4" />
          </Button>
        </Kanban.ColumnHandle>
      </div>
      <div className="flex flex-col gap-2 p-0.5">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} asHandle />
        ))}
      </div>
    </Kanban.Column>
  );
}
