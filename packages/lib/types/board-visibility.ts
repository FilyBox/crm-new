import { BoardVisibility as BoardVisibilityEnum } from '@prisma/client';
import { z } from 'zod';

export const ZBoardVisibilitySchema = z.nativeEnum(BoardVisibilityEnum);
export const BoardVisibility = ZBoardVisibilitySchema.enum;
export type TBoardVisibility = z.infer<typeof ZBoardVisibilitySchema>;
