// import { Novu } from '@novu/api';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';

import { findTasks } from '@documenso/lib/server-only/document/find-tasks';
import { type GetStatsInput, getStats } from '@documenso/lib/server-only/document/get-priority';
import { createNovuTask } from '@documenso/lib/server-only/novu/create-novu-task';
import { getTeamById } from '@documenso/lib/server-only/team/get-team';
import { getTeamMembers } from '@documenso/lib/server-only/team/get-team-members';
import { ZBoardVisibilitySchema } from '@documenso/lib/types/board-visibility';
import { type TTask } from '@documenso/lib/types/task';
import { prisma } from '@documenso/prisma';
import { ExtendedTaskPriority } from '@documenso/prisma/types/extended-task-priority';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';

export type GetTaskByIdOptions = {
  id: number;
  userId: number;
  teamId?: number;
  folderId?: string | null;
};

export const taskRouter = router({
  createTask: authenticatedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        dueDate: z.date().optional(),
        tags: z.array(z.string()).optional().default([]),
        // userId: z.number(),
        // teamId: z.number().optional(),
        taskRootPath: z.string(),
        assignees: z
          .array(
            z.object({
              email: z.string(),
              name: z.string().nullable(),
              userId: z.number(),
            }),
          )
          .optional()
          .default([]),
        projectId: z.number().optional(),
        parentTaskId: z.number().optional(),
        listId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      // const novu = new Novu({ secretKey: env('NOVU_SECRET_KEY') });
      // Desestructuración correcta que incluye projectId
      const { projectId, taskRootPath, parentTaskId, listId, assignees, ...data } = input;
      console.log('assignees in create', assignees);

      const userId = user.id;
      // Verificar permisos si es tarea de equipo
      if (teamId && ctx.teamId !== teamId) {
        throw new Error('No tienes permisos para crear tareas en este equipo');
      }

      const team = await getTeamById({ userId, teamId });
      if (!team) {
        throw new Error('Team not found');
      }

      const tasksCount = await prisma.task.count({
        where: { listId, teamId },
      });

      const taskCreated = await prisma.task.create({
        data: {
          ...data,
          status: 'PENDING',
          userId,
          teamId: team.id,
          listId,
          ...(projectId && { projectId }),
          ...(parentTaskId && { parentTaskId }),
          position: tasksCount,
        },
      });
      // Create a TaskAssignee entry for each user
      if (assignees.length > 0) {
        console.log('Creating task assignees...');
        await Promise.allSettled(
          assignees.map(async (assignee, index) => {
            if (assignee) {
              if (index >= 2) {
                await new Promise<void>((resolve) => {
                  setTimeout(() => resolve(), 500);
                });
              }
              await prisma.taskAssignee.create({
                data: {
                  taskId: taskCreated.id,
                  assignedBy: userId,
                  userId: assignee.userId,
                },
              });
              await createNovuTask({
                user: { id: assignee.userId, name: assignee.name || '', email: assignee.email },
                task: { id: taskCreated.id, title: taskCreated.title },
                title: `New Task Assigned!`,
                message: `You have been assigned to the task "${taskCreated.title}"`,
                taskRootPath,
              });
            }
          }),
        );
      }

      return taskCreated;
    }),

  updateTaskColumn: authenticatedProcedure
    .input(
      z.object({
        taskId: z.number(),
        newListId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { taskId, newListId } = input;
      const { teamId } = ctx;

      const list = await prisma.list.findFirst({
        where: { id: newListId, teamId },
      });

      if (!list) {
        throw new Error('List not found or you do not have permission to move tasks to it');
      }

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: { listId: newListId },
      });

      return updatedTask;
    }),

  findTaskById: authenticatedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ input }: { input: { taskId: string } }) => {
      const { taskId } = input;
      return await prisma.task.findUnique({
        where: { id: Number(taskId) },
        include: {
          user: true,
          team: true,
          parentTask: true,
          subtasks: true,
          // tags: true, // Removed because 'tags' is not a valid property in 'TaskInclude<DefaultArgs>'
        },
      });
    }),

  findLists: authenticatedProcedure
    .input(
      z.object({
        filterStructure: z
          .array(
            z
              .custom<FilterStructure>(
                (val) => val === null || val === undefined || typeof val === 'object',
              )
              .optional()
              .nullable(),
          )
          .optional(),
        joinOperator: z.enum(['and', 'or']).optional().default('and'),
        assigneeIds: z.array(z.number()).optional(),
        boardId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { filterStructure, joinOperator, assigneeIds, boardId } = input;
      const { teamId } = ctx;

      let where: Prisma.TaskWhereInput = {};
      where.teamId = teamId;

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        where = advancedWhere;
      }

      const lists = await prisma.list.findMany({
        where: { teamId, boardId },
        orderBy: { position: 'asc' }, // Ordenar por posición
        include: {
          tasks: {
            orderBy: { position: 'asc' }, // Ordenar tareas por posición
            include: {
              assignees: { include: { user: true } },
              comments: true,
            },
            where: {
              deletedAt: null,
              ...(assigneeIds && assigneeIds.length > 0
                ? { assignees: { some: { userId: { in: assigneeIds } } } }
                : {}),
              ...where,
            },
          },
        },
      });

      // Formato correcto para columnas
      const columns = lists.map((list) => ({
        id: list.id,
        name: list.name,
        color: list.color || 'gray',
      }));

      // Formato correcto para data - todas las tareas con su columna asignada
      const data = lists.flatMap((list) =>
        list.tasks.map((task) => {
          const { assignees: rawAssignees, ...taskData } = task;
          return {
            ...taskData,
            id: task.id.toString(),
            name: task.title,
            column: list.id,
            assignees: rawAssignees.map((assignee) => ({
              id: assignee.id,
              userId: assignee.userId,
              taskId: assignee.taskId,
              assignedAt: assignee.assignedAt,
              assignedBy: assignee.assignedBy,
              user: {
                id: assignee.user.id,
                name: assignee.user.name || '',
                email: assignee.user.email,
              },
            })),
            enhancedAssignees:
              rawAssignees?.map((assignee) => ({
                name: assignee.user.name || '',
                email: assignee.user.email,
              })) || [],
          };
        }),
      );

      return {
        tasks: lists.flatMap((list) => list.tasks),
        lists,
        columns,
        data,
        // Mantener formato anterior para compatibilidad
        boardsFormated: lists.reduce(
          (acc, list) => {
            acc[list.id] = list.tasks.map((task) => {
              const { assignees: rawAssignees, ...taskData } = task;
              return {
                ...taskData,
                assignees: rawAssignees.map((assignee) => ({
                  id: assignee.id,
                  userId: assignee.userId,
                  taskId: assignee.taskId,
                  assignedAt: assignee.assignedAt,
                  assignedBy: assignee.assignedBy,
                  user: {
                    id: assignee.user.id,
                    name: assignee.user.name || '',
                    email: assignee.user.email,
                  },
                })),
                enhancedAssignees:
                  rawAssignees?.map((assignee) => ({
                    name: assignee.user.name || '',
                    email: assignee.user.email,
                  })) || [],
              };
            });
            return acc;
          },
          {} as Record<string, TTask[]>,
        ),
      };
    }),

  updateList: authenticatedProcedure
    .input(
      z.object({
        listId: z.string(),
        name: z.string().min(1),
        color: z.enum(['blue', 'orange', 'violet', 'rose', 'emerald', 'sky']).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { listId, name, color } = input;
      const { teamId, user } = ctx;
      const userId = user.id;

      const existingList = await prisma.list.findFirst({
        where: { id: listId, teamId },
      });

      if (!existingList) {
        throw new Error('List not found or you do not have permission to update it');
      }

      const updatedList = await prisma.list.update({
        where: { id: listId },
        data: {
          name,
          ...(color && { color }),
        },
      });

      return updatedList;
    }),

  createBoard: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.enum(['blue', 'orange', 'violet', 'rose', 'emerald', 'sky']).optional(),
        image: z.string().optional(),
        visibility: ZBoardVisibilitySchema.optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const { name, color, image, visibility } = input;
      const userId = user.id;

      const teamMembers = await getTeamMembers({ userId, teamId });
      const currentTeamMember = teamMembers.find((member) => member.userId === userId);

      if (
        currentTeamMember &&
        currentTeamMember.teamRole === 'MEMBER' &&
        visibility !== 'EVERYONE' &&
        visibility !== 'ONLY_ME'
      ) {
        throw new Error('You do not have permission to change the visibility');
      }

      const board = await prisma.board.create({
        data: {
          name,
          color,
          image,
          teamId,
          userId,
          visibility,
        },
      });

      const defaultLists = ['To Do', 'In Progress', 'Done'];
      await Promise.allSettled(
        defaultLists.map(async (listName, index) =>
          prisma.list.create({
            data: {
              color: 'blue',
              teamId,
              userId,
              name: listName,
              boardId: board.id,
              position: index,
            },
          }),
        ),
      );

      return board;
    }),

  findBoards: authenticatedProcedure.query(async ({ ctx }) => {
    const { teamId, user } = ctx;
    const userId = user.id;

    const teamMembers = await getTeamMembers({ userId, teamId });
    const currentTeamMember = teamMembers.find((member) => member.userId === userId);
    console.log('currentTeamMember', currentTeamMember);

    const visibilityConditions: Prisma.BoardWhereInput['OR'] = [];

    visibilityConditions.push({ visibility: 'EVERYONE' });

    visibilityConditions.push({
      visibility: 'ONLY_ME',
      userId: userId,
    });

    if (
      currentTeamMember?.teamRole === 'ADMIN' ||
      currentTeamMember?.organisationRole === 'ADMIN'
    ) {
      visibilityConditions.push({ visibility: 'ADMIN' });
      visibilityConditions.push({ visibility: 'MANAGER_AND_ABOVE' });
    } else if (
      currentTeamMember?.teamRole === 'MANAGER' ||
      currentTeamMember?.organisationRole === 'MANAGER'
    ) {
      visibilityConditions.push({ visibility: 'MANAGER_AND_ABOVE' });
    }

    const whereClause: Prisma.BoardWhereInput = {
      teamId,
      OR: visibilityConditions,
    };

    const boards = await prisma.board.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return boards;
  }),
  updateBoard: authenticatedProcedure
    .input(
      z.object({
        boardId: z.string(),
        name: z.string().min(1),
        color: z.enum(['blue', 'orange', 'violet', 'rose', 'emerald', 'sky']).optional(),
        image: z.string().optional(),
        visibility: ZBoardVisibilitySchema.optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { boardId, name, color, image, visibility } = input;
      const { teamId, user } = ctx;
      const userId = user.id;

      const teamMembers = await getTeamMembers({ userId, teamId });
      const currentTeamMember = teamMembers.find((member) => member.userId === userId);

      if (
        currentTeamMember &&
        currentTeamMember.teamRole === 'MEMBER' &&
        visibility !== 'EVERYONE' &&
        visibility !== 'ONLY_ME'
      ) {
        throw new Error('You do not have permission to change the visibility');
      }

      const existingBoard = await prisma.board.findFirst({
        where: { id: boardId, teamId },
      });

      if (!existingBoard) {
        throw new Error('Board not found or you do not have permission to update it');
      }

      const updatedBoard = await prisma.board.update({
        where: { id: boardId },
        data: {
          name,
          ...(visibility && { visibility }),
          ...(color && { color }),
          ...(image && { image }),
        },
      });

      return updatedBoard;
    }),

  deleteBoard: authenticatedProcedure
    .input(z.object({ boardId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { boardId } = input;
      const { teamId, user } = ctx;
      const userId = user.id;
      const board = await prisma.board.findFirst({
        where: { id: boardId, teamId },
      });
      if (!board) {
        throw new Error('Board not found or you do not have permission to delete it');
      }
      const teamMembers = await getTeamMembers({ userId, teamId });
      const currentTeamMember = teamMembers.find((member) => member.userId === userId);

      if (
        currentTeamMember &&
        currentTeamMember.teamRole === 'MEMBER' &&
        board?.visibility !== 'ONLY_ME' &&
        board?.userId !== userId
      ) {
        throw new Error('You do not have permission to delete this board');
      }

      await prisma.$transaction([
        prisma.task.deleteMany({
          where: {
            list: {
              boardId: boardId,
            },
          },
        }),
        prisma.list.deleteMany({
          where: { boardId: boardId },
        }),
        prisma.board.delete({
          where: { id: boardId },
        }),
      ]);

      return { success: true };
    }),

  createList: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        color: z.enum(['blue', 'orange', 'violet', 'rose', 'emerald', 'sky']).optional(),
        boardId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { user, teamId } = ctx;
      const { name, color, boardId } = input;

      const userId = user.id;

      const listsCount = await prisma.list.count({
        where: { boardId: boardId, teamId: teamId },
      });

      const board = await prisma.list.create({
        data: {
          name,
          color,
          teamId,
          userId,
          boardId,
          position: listsCount,
        },
      });
      return board;
    }),

  findTasks: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        teamId: z.number().optional(),
        projectId: z.number().optional(),
        folderId: z.number().optional(),
        page: z.number().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        priority: z.nativeEnum(ExtendedTaskPriority).optional(),
        status: z.enum(['PENDING', 'COMPLETED']).optional(),
        orderBy: z.enum(['createdAt', 'updatedAt']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z
          .enum([
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
          ])
          .optional(),
        filterStructure: z
          .array(
            z
              .custom<FilterStructure>(
                (val) => val === null || val === undefined || typeof val === 'object',
              )
              .optional()
              .nullable(),
          )
          .optional(),
        joinOperator: z.enum(['and', 'or']).optional().default('and'),

        assigneeIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const {
        projectId,
        query,
        priority,
        page,
        perPage,
        filterStructure,
        joinOperator,
        assigneeIds,
        period,
        orderBy = 'createdAt',
        orderByColumn,
        orderByDirection = 'desc',
      } = input;
      const { user, teamId } = ctx;
      const userId = user.id;
      // Construir el objeto where para los filtros
      let where: Prisma.TaskWhereInput = {};

      where.teamId = teamId;

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        where = advancedWhere;
      }
      if (priority && priority !== ExtendedTaskPriority.ALL) {
        where.priority = priority;
      }

      const getStatOptions: GetStatsInput = {
        period,
        search: '',
        user: ctx.user,
        teamId,
      };

      const [stats] = await Promise.all([getStats(getStatOptions)]);
      // const tasks = await prisma.task.findMany({
      //   where,
      //   include: {
      //     assignees: true,
      //     comments: true,
      //   },
      //   orderBy: {
      //     [orderBy]: orderByDirection,
      //   },
      // });

      // const taskAssignees = await prisma.taskAssignee.findMany({
      //   where: {
      //     taskId: { in: tasks.map((task) => task.id) },
      //   },
      //   select: {
      //     userId: false,
      //     taskId: true,
      //     assignedBy: false,
      //     user: {
      //       select: {
      //         name: true,
      //         email: true,
      //       },
      //     },
      //   },
      //   // include: {
      //   //   user: {
      //   //     select: {
      //   //       name: true,
      //   //       email: true,
      //   //     },
      //   //   },
      //   // },
      // });
      // const tasksWithAssignees = tasks.map((task) => {
      //   const assignees = taskAssignees
      //     .filter((assignee) => assignee.taskId === task.id)
      //     .map((assignee) => assignee.user);
      //   return {
      //     ...task,
      //     enhancedAssignees: assignees.length > 0 ? assignees : [],
      //   };
      // });

      const [data] = await Promise.all([
        findTasks({
          query,
          page,
          perPage,
          assigneeIds,
          userId,
          teamId,
          period,
          where,
          orderBy: orderByColumn
            ? { column: orderByColumn, direction: orderByDirection }
            : undefined,
        }),
      ]);

      return { data: data, stats };
    }),

  updateTaskPosition: authenticatedProcedure
    .input(
      z.object({
        taskId: z.number(),
        newListId: z.string(),
        newPosition: z.number(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { taskId, newListId, newPosition } = input;
      const { teamId } = ctx;

      // Obtener la tarea actual
      const currentTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: { list: true },
      });

      if (!currentTask) {
        throw new Error('Task not found');
      }

      // Verificar que la lista pertenece al equipo
      const list = await prisma.list.findFirst({
        where: { id: newListId, teamId },
      });

      if (!list) {
        throw new Error('List not found or you do not have permission to move tasks to it');
      }

      // Si cambió de lista, necesitamos reordenar ambas listas
      if (currentTask.listId !== newListId) {
        // Decrementar posiciones en la lista anterior
        await prisma.task.updateMany({
          where: {
            listId: currentTask.listId,
            position: { gt: currentTask.position },
          },
          data: {
            position: { decrement: 1 },
          },
        });

        // Incrementar posiciones en la nueva lista
        await prisma.task.updateMany({
          where: {
            listId: newListId,
            position: { gte: newPosition },
          },
          data: {
            position: { increment: 1 },
          },
        });
      } else {
        // Reordenar dentro de la misma lista
        if (newPosition > currentTask.position) {
          // Mover hacia abajo
          await prisma.task.updateMany({
            where: {
              listId: newListId,
              position: {
                gt: currentTask.position,
                lte: newPosition,
              },
            },
            data: {
              position: { decrement: 1 },
            },
          });
        } else if (newPosition < currentTask.position) {
          // Mover hacia arriba
          await prisma.task.updateMany({
            where: {
              listId: newListId,
              position: {
                gte: newPosition,
                lt: currentTask.position,
              },
            },
            data: {
              position: { increment: 1 },
            },
          });
        }
      }

      // Actualizar la tarea
      return await prisma.task.update({
        where: { id: taskId },
        data: {
          listId: newListId,
          position: newPosition,
        },
      });
    }),

  updateListPosition: authenticatedProcedure
    .input(
      z.object({
        listId: z.string(),
        newPosition: z.number(),
        boardId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { listId, newPosition, boardId } = input;
      const { teamId } = ctx;

      // Obtener la lista actual
      const currentList = await prisma.list.findUnique({
        where: { id: listId },
      });

      if (!currentList || currentList.teamId !== teamId) {
        throw new Error('List not found or you do not have permission to update it');
      }

      // Reordenar listas
      if (newPosition > currentList.position) {
        // Mover hacia la derecha
        await prisma.list.updateMany({
          where: {
            boardId: boardId,
            teamId: teamId,
            position: {
              gt: currentList.position,
              lte: newPosition,
            },
          },
          data: {
            position: { decrement: 1 },
          },
        });
      } else if (newPosition < currentList.position) {
        // Mover hacia la izquierda
        await prisma.list.updateMany({
          where: {
            boardId: boardId,
            teamId: teamId,
            position: {
              gte: newPosition,
              lt: currentList.position,
            },
          },
          data: {
            position: { increment: 1 },
          },
        });
      }

      // Actualizar la lista
      return await prisma.list.update({
        where: { id: listId },
        data: {
          position: newPosition,
        },
      });
    }),

  updateTask: authenticatedProcedure
    .input(
      z.object({
        taskId: z.number().min(1),
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
        dueDate: z.date().optional(),
        tags: z.array(z.string()).optional().default([]),
        userId: z.number(),
        teamId: z.number().optional(),
        projectId: z.number().optional(),
        parentTaskId: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { userId, teamId, projectId, parentTaskId, ...data } = input;

      // Verificar permisos si es tarea de equipo
      if (teamId && ctx.teamId !== teamId) {
        throw new Error('No tienes permisos para actualizar tareas en este equipo');
      }

      return await prisma.task.update({
        where: { id: Number(input.taskId) },
        data: {
          ...data,
          ...(teamId && { team: { connect: { id: teamId } } }),
          ...(projectId && { project: { connect: { id: projectId } } }),
          ...(parentTaskId && { parentTask: { connect: { id: parentTaskId } } }),
        },
      });
    }),

  deleteTask: authenticatedProcedure
    .input(z.object({ taskId: z.number().min(1) }))
    .mutation(async ({ input }) => {
      const { taskId } = input;
      // Eliminar la tarea y sus subtareas
      await prisma.task.deleteMany({
        where: {
          id: taskId,
          OR: [
            { parentTaskId: taskId }, // Subtareas
            { id: taskId }, // Tarea principal
          ],
        },
      });
      return { success: true };
    }),

  deleteMultipleByIds: authenticatedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const { ids } = input;
      const deleted = await prisma.task.deleteMany({
        where: { id: { in: ids } },
      });

      return deleted;
    }),

  // uploadTemplate: authenticatedProcedure

  // uploadBulkSend: authenticatedProcedure
  //   .input(
  //     z.object({
  //       taskId: z.number(),
  //       teamId: z.number().optional(),
  //       csv: z.string().min(1),
  //       sendImmediately: z.boolean(),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const { taskId, teamId, csv, sendImmediately } = input;
  //     const { user } = ctx;

  //     if (csv.length > 4 * 1024 * 1024) {
  //       throw new TRPCError({
  //         code: 'BAD_REQUEST',
  //         message: 'File size exceeds 4MB limit',
  //       });
  //     }

  //     const task = await getTemplateById({
  //       id: taskId,
  //       teamId,
  //       userId: user.id,
  //     });

  //     if (!task) {
  //       throw new TRPCError({
  //         code: 'NOT_FOUND',
  //         message: 'Template not found',
  //       });
  //     }

  //     await jobs.triggerJob({
  //       name: 'internal.bulk-send-template',
  //       payload: {
  //         userId: user.id,
  //         teamId,
  //         taskId,
  //         csvContent: csv,
  //         sendImmediately,
  //         requestMetadata: ctx.metadata.requestMetadata,
  //       },
  //     });

  //     return { success: true };
  //   }),
});
