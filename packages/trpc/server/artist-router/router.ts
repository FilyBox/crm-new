import type { Prisma } from '@prisma/client';
import { Role } from '@prisma/client';
import { z } from 'zod';

import { prisma } from '@documenso/prisma';

import { authenticatedProcedure, router } from '../trpc';

export type GetArtistByIdOptions = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  teamId?: number;
  avatarImageId?: string | null;
  disabled: boolean;
  event?: string[];
  url: string;
  song?: string[];
};

export const artistRouter = router({
  createArtist: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        role: z.nativeEnum(Role).array().optional(),
        // event: z.array(z.string()).optional(),
        url: z.string().optional(),
        disabled: z.boolean().optional(),
        avatarImageId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { ...data } = input;

      const { teamId, user } = ctx;
      const userId = user.id;
      const artistInfo = {
        ...data,
        teamId,
      };

      const whereClause: Prisma.ArtistWhereInput = {};
      whereClause.name = input.name;

      whereClause.teamId = teamId;

      const existingArtist = await prisma.artist.findFirst({
        where: whereClause,
      });

      if (existingArtist) {
        console.error('Artist already exists:', existingArtist);
        return Promise.reject(new Error('Artist already exists'));
      }

      try {
        return await prisma.artist.create({
          data: { ...artistInfo },
          // data: {
          //   name: input.name,
          //   roles: input.role ?? [],
          //   event: input.event
          //     ? {
          //         connect: input.event.map((eventId) => ({ id: Number(eventId) })),
          //       }
          //     : undefined,
          //   songs: input.song
          //     ? {
          //         connect: input.song.map((songId) => ({ id: Number(songId) })),
          //       }
          //     : undefined,
          //   url: input.url,
          //   disabled: input.disabled ?? false,
          //   createdAt: input.createdAt ?? new Date(),
          //   updatedAt: input.updatedAt ?? new Date(),
          //   userId: userId,
          //   avatarImageId: input.avatarImageId,
          //   ...(teamId ? { teamId: teamId } : {}),
          // },
        });
      } catch (error) {
        console.error('Error al crear artista:', error);
        throw error;
      }
    }),

  findArtistById: authenticatedProcedure
    .input(z.object({ artistId: z.string() }))
    .query(async ({ input }) => {
      const { artistId } = input;
      try {
        return await prisma.artist.findUnique({
          where: { id: Number(artistId) },
          include: {
            team: true,
            event: true,
            songs: true,
            ArtistProfile: true,
          },
        });
      } catch (error) {
        console.error('Error al buscar artista por ID:', error);
        throw error;
      }
    }),

  findArtists: authenticatedProcedure
    .input(
      z.object({
        teamId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const { teamId } = input;
      try {
        return await prisma.artist.findMany({
          where: {
            teamId: teamId,
          },
          include: {
            team: true,
            event: true,
            songs: true,
            ArtistProfile: true,
          },
        });
      } catch (error) {
        console.error('Error al buscar artistas:', error);
        throw error;
      }
    }),

  updateArtist: authenticatedProcedure
    .input(
      z.object({
        ArtistId: z.number(),
        name: z.string().min(1).optional(),
        role: z.nativeEnum(Role).array().optional(),
        event: z.array(z.string()).optional(),
        song: z.array(z.string()).optional(),
        url: z.string().optional(),
        disabled: z.boolean().optional(),
        teamId: z.number().optional(),
        avatarImageId: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { ArtistId, teamId, ...data } = input;

      if (teamId && ctx.teamId !== teamId) {
        console.error('Permiso denegado para actualizar artista en este equipo', {
          ctxTeamId: ctx.teamId,
          inputTeamId: teamId,
        });
        throw new Error('No tienes permisos para actualizar artistas en este equipo');
      }

      try {
        return await prisma.artist.update({
          where: { id: Number(ArtistId) },
          data: {
            ...data,
            name: input.name,
            roles: input.role ?? [],
            event: input.event
              ? {
                  set: [],
                  connect: input.event.map((eventId) => ({ id: Number(eventId) })),
                }
              : undefined,
            songs: input.song
              ? {
                  set: [],
                  connect: input.song.map((songId) => ({ id: Number(songId) })),
                }
              : undefined,
            url: input.url,
            disabled: input.disabled,
            updatedAt: new Date(),
            team: teamId ? { connect: { id: teamId } } : undefined,
            avatarImageId: input.avatarImageId,
          },
        });
      } catch (error) {
        console.error('Error al actualizar artista:', error);
        throw error;
      }
    }),
  findArtistsAll: authenticatedProcedure.query(async () => {
    const artists = await prisma.artist.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return artists;
  }),

  deleteArtist: authenticatedProcedure
    .input(z.object({ artistId: z.number() }))
    .mutation(async ({ input }) => {
      const { artistId } = input;
      try {
        return await prisma.artist.delete({
          where: { id: Number(artistId) },
        });
      } catch (error) {
        console.error('Error al eliminar artista:', error);
        throw error;
      }
    }),
});
