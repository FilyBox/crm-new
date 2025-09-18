import { useEffect, useState } from 'react';

import { Trans } from '@lingui/react/macro';
import type { Board } from '@prisma/client';
import { AnimatePresence, motion } from 'framer-motion';
import { PencilIcon, PlusIcon, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { useSession } from '@documenso/lib/client-only/providers/session';
import { formatAvatarUrl } from '@documenso/lib/utils/avatars';
import { formTasksPath } from '@documenso/lib/utils/teams';
import { trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@documenso/ui/primitives/avatar';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent, CardTitle } from '@documenso/ui/primitives/card';

import { BoardPopover } from '~/components/general/board-popover';
import { getEventColorClassesGradient } from '~/components/general/event-calendar';
import { useCurrentTeam } from '~/providers/team';
import { canPerformManagerAndAboveAction } from '~/utils/constants';
import { appMetaTags } from '~/utils/meta';

export function meta() {
  return appMetaTags('Boards');
}

export default function TasksPage() {
  const team = useCurrentTeam();
  const { user } = useSession();

  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [prevBoardsLength, setPrevBoardsLength] = useState(0);
  const taskRootPath = formTasksPath(team?.url);

  const [openEditDialogs, setOpenEditDialogs] = useState<Record<string, boolean>>({});
  const canAdminAbove = canPerformManagerAndAboveAction({ teamMemberRole: team?.currentTeamRole });

  const {
    data: boards,
    refetch,
    isLoading,
  } = trpc.task.findBoards.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (boards && boards.length > prevBoardsLength) {
      setPrevBoardsLength(boards.length);
    } else if (boards) {
      setPrevBoardsLength(boards.length);
    }
  }, [boards, prevBoardsLength]);

  const deleteBoard = trpc.task.deleteBoard.useMutation({
    onSuccess: () => {
      toast.success('Tablero eliminado correctamente');
      void refetch();
    },
    onError: (error) => {
      toast.error('Error al eliminar el tablero: ' + error.message);
    },
  });

  const handleEditBoard = (board: Board) => {
    setSelectedBoard(board);
    setOpenEditDialogs((prev) => ({ ...prev, [board.id]: true }));
  };

  const handleCloseEditDialog = (boardId: string) => {
    setOpenEditDialogs((prev) => ({ ...prev, [boardId]: false }));
  };

  const handleDeleteBoard = (boardId: string) => {
    toast.warning('El tablero será eliminado', {
      description: '¿Estás seguro de que quieres eliminar este tablero?',
      position: 'bottom-center',
      closeButton: true,
      action: {
        label: 'Eliminar',
        onClick: () => {
          deleteBoard.mutate({ boardId });
        },
      },
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="mx-auto mt-12 flex max-w-screen-xl flex-col gap-y-8 px-4 md:px-8">
        <div className="flex animate-pulse flex-col gap-y-8">
          <div className="flex flex-row items-center">
            {team && (
              <Avatar className="dark:border-border mr-3 h-12 w-12 border-2 border-solid border-white">
                {team.avatarImageId && <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />}
                <AvatarFallback className="text-muted-foreground text-xs">
                  {team.name.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
            )}

            <h2 className="text-4xl font-semibold">
              <Trans>Boards from {team.name}</Trans>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 rounded-lg bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-12 flex max-w-screen-xl flex-col gap-y-8 px-4 md:px-8">
      <div className="flex flex-row items-center">
        {team && (
          <Avatar className="dark:border-border mr-3 h-12 w-12 border-2 border-solid border-white">
            {team.avatarImageId && <AvatarImage src={formatAvatarUrl(team.avatarImageId)} />}
            <AvatarFallback className="text-muted-foreground text-xs">
              {team.name.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
        )}

        <h2 className="text-4xl font-semibold">
          <Trans>Boards from {team.name}</Trans>
        </h2>
      </div>

      {/* Boards Grid */}
      <motion.div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {boards?.map((board) => (
            <div key={board.id} className="relative">
              <Link className="z-10" to={`${taskRootPath}/b/${board.id}`}>
                <motion.div
                  key={board.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  layoutId={board.id}
                >
                  <Card className="group h-36 cursor-pointer transition-shadow hover:shadow-lg">
                    <div
                      className={cn(
                        'relative h-24 rounded-t-md',
                        getEventColorClassesGradient(board.color || 'blue'),
                      )}
                    >
                      <div className="flex w-full items-center justify-end">
                        {/* Espacios reservados para los botones */}
                        <div className="z-20 size-8" />
                        <div className="z-20 size-8" />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <CardTitle className="text-foreground truncate text-sm font-medium">
                        {board.name}
                      </CardTitle>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>

              {/* Botones posicionados absolutamente fuera del Link */}
              {(canAdminAbove || (board.userId === user.id && board.visibility === 'ONLY_ME')) && (
                <div className="absolute right-0 top-0 z-30 flex items-center justify-end p-1">
                  <BoardPopover
                    canAdminAbove={canAdminAbove}
                    board={selectedBoard}
                    isOpen={openEditDialogs[board.id] || false}
                    setIsSheetOpen={(isOpen) => {
                      if (!isOpen) {
                        handleCloseEditDialog(board.id);
                      }
                    }}
                  >
                    <Button
                      variant="ghost"
                      className="hover:bg-foreground/20 z-20 size-8 max-h-8 min-w-8 max-w-8 p-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditBoard(board);
                      }}
                    >
                      <PencilIcon size={16} />
                    </Button>
                  </BoardPopover>

                  <Button
                    className="hover:bg-foreground/20 z-20 size-8 max-h-8 min-w-8 max-w-8 p-0 group-hover:opacity-100"
                    variant="ghost"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteBoard(board.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Create New Board Card */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" layout>
            <BoardPopover
              canAdminAbove={canAdminAbove}
              board={null}
              isOpen={isDialogOpen}
              setIsSheetOpen={setIsDialogOpen}
            >
              <Card
                onClick={() => setSelectedBoard(null)}
                className="text-muted-foreground flex h-36 cursor-pointer flex-col items-center justify-center border-2 border-dashed transition-all hover:border-solid hover:shadow-md"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center"
                >
                  <PlusIcon className="mb-2 h-8 w-8" />
                  <span className="text-sm font-medium">Crear un tablero nuevo</span>
                </motion.div>
              </Card>
            </BoardPopover>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
