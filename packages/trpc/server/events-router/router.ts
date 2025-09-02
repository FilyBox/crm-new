import { z } from 'zod';

import { deleteFile } from '@documenso/lib/server-only/document/DeleteObjectS3';
import { getFileUrl } from '@documenso/lib/universal/upload/get-file-url';
import { getPresignGetUrl } from '@documenso/lib/universal/upload/server-actions';
import { prisma } from '@documenso/prisma';
import type { Prisma } from '@documenso/prisma/client';
import { type FilterStructure, filterColumns } from '@documenso/ui/lib/filter-columns';

import { authenticatedProcedure, router } from '../trpc';

export type GetEventByIdOptions = {
  id: number;
  name: string;
  description?: string;
  image?: string;
  venue?: string;
  artists: string[];
  beginning: Date;
  end: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export const eventRouter = router({
  createEvent: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        venue: z.string().optional(),
        artists: z.array(z.string()).optional(),
        beginning: z.date().optional(),
        end: z.date().optional(),
        published: z.boolean().optional(),
        allDay: z.boolean().optional(),
        color: z.enum(['blue', 'orange', 'violet', 'rose', 'emerald', 'sky']).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { teamId, user } = ctx;
      if (!input.name) {
        throw new Error('El nombre del evento es obligatorio');
      }

      try {
        return await prisma.event.create({
          data: {
            userId: user?.id,
            teamId,
            name: input.name,
            description: input.description,
            image: input.image,
            venue: input.venue,
            artists: input.artists
              ? {
                  connect: input.artists.map((artistId) => ({ id: Number(artistId) })),
                }
              : undefined,
            beginning: input.beginning ?? new Date(),
            end: input.end ?? new Date(),
            published: input.published ?? false,
            allDay: input.allDay ?? false,
            color: input.color ?? 'blue',
          },
        });
      } catch (error) {
        console.error('Error creating event:', error);
        throw new Error('Error creating event');
      }
    }),

  findEvent: authenticatedProcedure.query(async () => {
    const events = await prisma.event.findMany({
      orderBy: {
        id: 'asc',
      },
    });
    return events;
  }),

  updateEventById: authenticatedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        image: z.string().nullable().optional(),
        published: z.boolean().optional(),
        venue: z.string().optional(),
        updateArtists: z.array(z.string()).optional(),
        beginning: z.date().optional(),
        end: z.date().optional(),
        allDay: z.boolean().optional(),
        color: z.enum(['blue', 'orange', 'violet', 'rose', 'emerald', 'sky']).optional(),
        tickets: z
          .array(
            z.object({
              id: z.string().optional(),
              name: z.string().nullable().optional(),
              price: z.number().nullable().optional(),
              quantity: z.number().nullable().optional(),
              maxQuantityPerUser: z.number().optional(),
              description: z.string().nullable().optional(),
              seatNumber: z.number().nullable().optional(),
            }),
          )
          .optional(),
        updateTickets: z
          .array(
            z.object({
              id: z.string().optional(),
              name: z.string().nullable().optional(),
              price: z.number().nullable().optional(),
              quantity: z.number().nullable().optional(),
              maxQuantityPerUser: z.number().optional(),
              description: z.string().nullable().optional(),
              seatNumber: z.number().nullable().optional(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, updateArtists, updateTickets, tickets, image, ...data } = input;

      console.log('Update tickets:', updateTickets);
      console.log('tickets:', tickets);
      if (!id) {
        throw new Error('El ID del evento es obligatorio');
      }

      // Get the current artists for this event to disconnect them all
      const currentEvent = await prisma.event.findUnique({
        where: { id },
        include: { artists: true },
      });

      console.log('Current event image:', currentEvent?.image);
      console.log('New image:', image);
      let deleteImage = false;

      if (
        (currentEvent?.image && image && image !== 'nochange') ||
        (currentEvent?.image && !image)
      ) {
        console.log('Deleting old image:', currentEvent.image);
        const { url } = await getPresignGetUrl(currentEvent.image);
        await deleteFile(url);
        deleteImage = true;
      }

      if (currentEvent?.artists.length) {
        await prisma.event.update({
          where: { id },
          data: {
            artists: {
              disconnect: currentEvent.artists.map((artist) => ({ id: artist.id })),
            },
          },
        });
      }

      console.log('deleteImage:', deleteImage);
      try {
        return await prisma.event.update({
          where: { id },
          data: {
            image: image && image !== 'nochange' ? image : deleteImage ? null : currentEvent?.image,
            ...data,
            artists: updateArtists
              ? {
                  connect: updateArtists.map((artistId) => ({ id: Number(artistId) })),
                }
              : undefined,
          },
        });
      } catch (error) {
        console.error('Error updating event:', error);
        throw new Error('Error updating event');
      }
    }),

  getAllEventsWithPagination: authenticatedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(1000).default(10), // Increased limit for calendar view
        query: z.string().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        orderBy: z.enum(['id']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z.enum(['id']).optional(),
        artistIds: z.array(z.number()).optional(),
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
      }),
    )
    .query(async ({ input, ctx }) => {
      const { page, limit } = input;
      const { teamId } = ctx;

      const whereInput: Prisma.EventWhereInput = {
        deletedAt: null,
      };
      whereInput.teamId = teamId;
      console.log('Team ID:', teamId);
      console.log('whereInput:', whereInput);
      console.log('whereInput:', whereInput);
      const offset = (page - 1) * limit;
      const [events, totalCount] = await Promise.all([
        prisma.event.findMany({
          skip: offset,
          take: limit,
          select: {
            artists: {
              select: {
                id: true,
                name: true,
              },
            },

            id: true,
            end: true,
            description: true,
            beginning: true,
            image: true,
            name: true,
            venue: true,
            deletedAt: true,
            published: true,
            updatedAt: true,
            createdAt: true,
            allDay: true,
            color: true,
          },
          where: whereInput,
          orderBy: {
            id: 'asc',
          },
        }),
        prisma.event.count(),
      ]);
      console.log('Events found:', events.length);
      const tickets = await prisma.ticketType.findMany({
        where: {
          eventId: {
            in: events.map((event) => event.id),
          },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          maxQuantityPerUser: true,
          description: true,
          seatNumber: true,
          eventId: true,
        },
      });

      const eventsWithTickets = events.map((event) => {
        const eventTickets = tickets.filter((ticket) => ticket.eventId === event.id);
        return { ...event, ticketTypes: eventTickets };
      });

      const eventsWithImages = await Promise.all(
        eventsWithTickets.map(async (event) => {
          if (event.image) {
            try {
              const url = await getFileUrl(event.image);
              return { ...event, image: url };
            } catch (error) {
              console.error(`Error loading image for event ${event.id}:`, error);
              return event;
            }
          }
          return event;
        }),
      );

      const artists = await prisma.artist.findMany({
        where: {
          teamId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      return {
        events: eventsWithImages,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        artists,
      };
    }),

  getAllEventsNoPagination: authenticatedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        perPage: z.number().optional(),
        period: z.enum(['7d', '14d', '30d']).optional(),
        orderBy: z.enum(['id']).optional(),
        orderByDirection: z.enum(['asc', 'desc']).optional().default('desc'),
        orderByColumn: z.enum(['id']).optional(),
        artistIds: z.array(z.number()).optional(),
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
      }),
    )
    .query(async ({ input, ctx }) => {
      const { teamId } = ctx;
      const { artistIds, joinOperator, filterStructure } = input;

      let whereInput: Prisma.EventWhereInput = {};

      if (filterStructure) {
        const advancedWhere = filterColumns({
          filters: filterStructure.filter(
            (filter): filter is FilterStructure => filter !== null && filter !== undefined,
          ),
          joinOperator: joinOperator,
        });
        whereInput = advancedWhere;
      }

      const [events, totalCount] = await Promise.all([
        prisma.event.findMany({
          select: {
            artists: {
              select: {
                id: true,
                name: true,
              },
            },

            id: true,
            end: true,
            description: true,
            beginning: true,
            image: true,
            name: true,
            venue: true,
            deletedAt: true,
            published: true,
            updatedAt: true,
            createdAt: true,
            allDay: true,
            color: true,
          },
          where: { ...whereInput, deletedAt: null, teamId },
          orderBy: {
            id: 'asc',
          },
        }),
        prisma.event.count(),
      ]);
      console.log('Events found:', events.length);
      const tickets = await prisma.ticketType.findMany({
        where: {
          eventId: {
            in: events.map((event) => event.id),
          },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          maxQuantityPerUser: true,
          description: true,
          seatNumber: true,
          eventId: true,
        },
      });

      const eventsWithTickets = events.map((event) => {
        const eventTickets = tickets.filter((ticket) => ticket.eventId === event.id);
        return { ...event, ticketTypes: eventTickets };
      });

      const eventsWithImages = await Promise.all(
        eventsWithTickets.map(async (event) => {
          if (event.image) {
            try {
              const url = await getFileUrl(event.image);
              return { ...event, image: url };
            } catch (error) {
              console.error(`Error loading image for event ${event.id}:`, error);
              return event;
            }
          }
          return event;
        }),
      );

      const artists = await prisma.artist.findMany({
        where: {
          teamId,
        },
        select: {
          id: true,
          name: true,
        },
      });

      return {
        events: eventsWithImages,
        totalCount,
        artists,
      };
    }),

  deleteEventById: authenticatedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id } = input;

      if (!id) {
        throw new Error('El ID del evento es obligatorio');
      }

      try {
        const currentEvent = await prisma.event.findUnique({
          where: { id },
          include: { artists: true },
        });

        if (!currentEvent) {
          throw new Error('Evento no encontrado');
        }
        let urlToDelete = '';
        if (currentEvent.image) {
          const { url } = await getPresignGetUrl(currentEvent.image);
          urlToDelete = url;
        }

        await Promise.allSettled([
          prisma.ticketType.deleteMany({
            where: { eventId: id },
          }),
          prisma.event.delete({
            where: { id },
          }),
          deleteFile(urlToDelete),
        ]);

        return;
      } catch (error) {
        console.error('Error deleting event:', error);
        throw new Error('Error deleting event');
      }
    }),
});
