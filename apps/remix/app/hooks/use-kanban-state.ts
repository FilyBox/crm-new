import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { type TTask } from '@documenso/lib/types/task';
import { trpc } from '@documenso/trpc/react';

import { useDebounceQueue } from './use-debounce-queue';

interface UseKanbanStateProps {
  data?: {
    boardsFormated?: Record<string, TTask[]>;
    lists: Array<{ id: string; position: number }>;
    totalTasks?: number;
    totalLists?: number;
  };
  boardId: string;
}

export function useKanbanState({ data, boardId }: UseKanbanStateProps) {
  const [columns, setColumns] = useState<Record<string, TTask[]>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingTaskUpdates, setPendingTaskUpdates] = useState<Set<number>>(new Set());
  const [pendingListUpdates, setPendingListUpdates] = useState<Set<string>>(new Set());

  const { debouncedTaskUpdate, debouncedListUpdate, clearQueues } = useDebounceQueue();

  // Mutaciones
  const updateTaskPositionMutation = trpc.task.updateTaskPosition.useMutation({
    onError: (error) => {
      console.error('Error updating task position:', error);
      toast.error('Error updating task position: ' + error.message);
    },
  });

  const updateListPositionMutation = trpc.task.updateListPosition.useMutation({
    onError: (error) => {
      console.error('Error updating list position:', error);
      toast.error('Error updating list position: ' + error.message);
    },
  });

  // Estado derivado
  const hasPendingOperations = pendingTaskUpdates.size > 0 || pendingListUpdates.size > 0;
  const currentTaskCount = Object.values(columns).flat().length;
  const currentListCount = columnOrder.length;

  // Inicialización única
  useEffect(() => {
    if (data?.boardsFormated && !isInitialized) {
      const order = data.lists.sort((a, b) => a.position - b.position).map((list) => list.id);

      setColumns(data.boardsFormated);
      setColumnOrder(order);
      setIsInitialized(true);
    }
  }, [data?.boardsFormated, isInitialized]);

  // Sincronización con servidor cuando no hay operaciones pendientes
  useEffect(() => {
    if (
      isInitialized &&
      data?.boardsFormated &&
      !hasPendingOperations &&
      (currentTaskCount !== (data.totalTasks || 0) || currentListCount !== (data.totalLists || 0))
    ) {
      const order = data.lists.sort((a, b) => a.position - b.position).map((list) => list.id);

      setColumns(data.boardsFormated);
      setColumnOrder(order);
    }
  }, [
    data?.boardsFormated,
    data?.totalTasks,
    data?.totalLists,
    hasPendingOperations,
    isInitialized,
    currentTaskCount,
    currentListCount,
  ]);

  // Limpiar colas al desmontar
  useEffect(() => {
    return () => {
      clearQueues();
    };
  }, [clearQueues]);

  // Función para detectar cambios de tareas
  const detectTaskChanges = useCallback(
    (oldColumns: Record<string, TTask[]>, newColumns: Record<string, TTask[]>) => {
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
    },
    [],
  );

  // Procesar actualizaciones de tareas
  const processTaskUpdates = useCallback(
    async (taskChanges: Array<{ taskId: number; newListId: string; newPosition: number }>) => {
      const taskIds = new Set(taskChanges.map((change) => change.taskId));
      setPendingTaskUpdates((prev) => new Set([...prev, ...taskIds]));

      try {
        await Promise.all(
          taskChanges.map((change) =>
            updateTaskPositionMutation.mutateAsync({
              taskId: change.taskId,
              newListId: change.newListId,
              newPosition: change.newPosition,
            }),
          ),
        );
      } catch (error) {
        console.error('Error in batch task update:', error);
        toast.error('Failed to update some task positions');
      } finally {
        setPendingTaskUpdates((prev) => {
          const newSet = new Set(prev);
          taskIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }
    },
    [updateTaskPositionMutation],
  );

  // Procesar actualizaciones de listas
  const processListUpdates = useCallback(
    async (listChanges: Array<{ listId: string; newPosition: number; boardId: string }>) => {
      const listIds = new Set(listChanges.map((change) => change.listId));
      setPendingListUpdates((prev) => new Set([...prev, ...listIds]));

      try {
        await Promise.all(
          listChanges.map((change) =>
            updateListPositionMutation.mutateAsync({
              listId: change.listId,
              newPosition: change.newPosition,
              boardId: change.boardId,
            }),
          ),
        );
      } catch (error) {
        console.error('Error in batch list update:', error);
        toast.error('Failed to update some list positions');
      } finally {
        setPendingListUpdates((prev) => {
          const newSet = new Set(prev);
          listIds.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }
    },
    [updateListPositionMutation],
  );

  // Handler para cambios de Kanban
  const handleKanbanChange = useCallback(
    (newColumns: Record<string, TTask[]>) => {
      const taskChanges = detectTaskChanges(columns, newColumns);

      // Optimistic update
      setColumns(newColumns);

      // Procesar cambios con debounce
      if (taskChanges.length > 0) {
        taskChanges.forEach((change) => {
          debouncedTaskUpdate(
            {
              taskId: change.taskId,
              newListId: change.toColumn,
              newPosition: change.toIndex,
            },
            processTaskUpdates,
            500,
          );
        });
      }
    },
    [columns, debouncedTaskUpdate, processTaskUpdates, detectTaskChanges],
  );

  // Handler para movimientos de columnas
  const handleMove = useCallback(
    (event: any) => {
      const { active, over } = event;

      if (active.id in columns && over?.id in columns) {
        const newOrder = [...columnOrder];
        const draggedColumnId = active.id as string;
        const targetColumnId = over.id as string;

        const draggedIndex = newOrder.indexOf(draggedColumnId);
        const targetIndex = newOrder.indexOf(targetColumnId);

        if (draggedIndex !== -1 && targetIndex !== -1) {
          newOrder.splice(draggedIndex, 1);
          newOrder.splice(targetIndex, 0, draggedColumnId);

          // Optimistic update
          setColumnOrder(newOrder);

          // Procesar con debounce
          debouncedListUpdate(
            {
              listId: draggedColumnId,
              newPosition: targetIndex,
              boardId: boardId,
            },
            processListUpdates,
            500,
          );
        }
      }
    },
    [columns, columnOrder, boardId, debouncedListUpdate, processListUpdates],
  );

  return {
    columns,
    columnOrder,
    isInitialized,
    pendingTaskUpdates,
    pendingListUpdates,
    hasPendingOperations,
    handleKanbanChange,
    handleMove,
  };
}
