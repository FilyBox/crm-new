import { useCallback, useRef } from 'react';

interface TaskChange {
  taskId: number;
  newListId: string;
  newPosition: number;
}

interface ListChange {
  listId: string;
  newPosition: number;
  boardId: string;
}

export function useDebounceQueue() {
  const taskTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const taskQueueRef = useRef<Map<number, TaskChange>>(new Map());
  const listQueueRef = useRef<Map<string, ListChange>>(new Map());

  const debouncedTaskUpdate = useCallback(
    (
      taskChange: TaskChange,
      updateFunction: (changes: TaskChange[]) => Promise<void>,
      delay: number = 300,
    ) => {
      taskQueueRef.current.set(taskChange.taskId, taskChange);

      // Limpiar timeout anterior
      if (taskTimeoutRef.current) {
        clearTimeout(taskTimeoutRef.current);
      }

      // Crear nuevo timeout
      taskTimeoutRef.current = setTimeout(async () => {
        const changes = Array.from(taskQueueRef.current.values());

        taskQueueRef.current.clear();

        if (changes.length > 0) {
          await updateFunction(changes);
        }
      }, delay);
    },
    [],
  );

  const debouncedListUpdate = useCallback(
    (
      listChange: ListChange,
      updateFunction: (changes: ListChange[]) => Promise<void>,
      delay: number = 300,
    ) => {
      const previousChange = listQueueRef.current.get(listChange.listId);

      listQueueRef.current.set(listChange.listId, listChange);

      // Limpiar timeout anterior
      if (listTimeoutRef.current) {
        clearTimeout(listTimeoutRef.current);
      }

      // Crear nuevo timeout
      listTimeoutRef.current = setTimeout(async () => {
        const changes = Array.from(listQueueRef.current.values());

        listQueueRef.current.clear();

        if (changes.length > 0) {
          await updateFunction(changes);
        }
      }, delay);
    },
    [],
  );

  const clearQueues = useCallback(() => {
    if (taskTimeoutRef.current) {
      clearTimeout(taskTimeoutRef.current);
      taskTimeoutRef.current = null;
    }
    if (listTimeoutRef.current) {
      clearTimeout(listTimeoutRef.current);
      listTimeoutRef.current = null;
    }
    taskQueueRef.current.clear();
    listQueueRef.current.clear();
    console.log('Colas de debounce limpiadas');
  }, []);

  return {
    debouncedTaskUpdate,
    debouncedListUpdate,
    clearQueues,
  };
}
