import { prisma } from '@documenso/prisma';

import { AppError, AppErrorCode } from '../../errors/app-error';

export type GetBoardtByIdOptions = {
  boardId: string;
};

export const getBoardById = async ({ boardId }: GetBoardtByIdOptions) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
    },
  });

  if (!board) {
    throw new AppError(AppErrorCode.NOT_FOUND, {
      message: 'Board could not be found',
    });
  }

  return board;
};
