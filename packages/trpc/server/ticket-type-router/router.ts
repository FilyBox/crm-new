import { z } from 'zod';

import { stripe } from '@documenso/lib/server-only/stripe';
import { createProductFactura } from '@documenso/lib/universal/proxy-factura';
import { prisma } from '@documenso/prisma';

import { authenticatedProcedure, router } from '../trpc';

export type GetTicketTypeByIdOptions = {
  id: number;
  name?: string;
  eventId: number;
  price?: number;
  uid?: string;
  maxQuantityPerUser: number;
  quantity?: number;
  available?: number;
  description?: string;
  seatNumber?: string;
  stripeProductId?: string;
  stripePriceId?: string;
  imageUrl?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export const ticketTypeRouter = router({
  createTicketTemplate: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        price: z.number().optional(),
        maxQuantityPerUser: z.number().optional(),
        quantity: z.number().optional(),
        description: z.string().optional(),
        stripeProductId: z.string().optional(),
        stripePriceId: z.string().optional(),
        imageUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { teamId, user } = ctx;
      if (!input.name) {
        throw new Error('El nombre del tipo de ticket es obligatorio');
      }

      try {
        return await prisma.ticketTemplate.create({
          data: {
            name: input.name,
            ...(input.price !== undefined ? { price: input.price } : {}),
            maxQuantityPerUser: input.maxQuantityPerUser ?? 0,
            quantity: input.quantity ?? 0,
            ...(input.description !== undefined ? { description: input.description } : {}),
            ...(input.stripeProductId !== undefined
              ? { stripeProductId: input.stripeProductId }
              : {}),
            ...(input.stripePriceId !== undefined ? { stripePriceId: input.stripePriceId } : {}),
            ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
            createdAt: new Date(),
            updatedAt: new Date(),
            teamId: teamId,
            userId: user?.id,
          },
        });
      } catch (error) {
        console.error('Error creating ticket type:', error);
        throw new Error('Error creating ticket type');
      }
    }),

  getTicketTemplate: authenticatedProcedure.query(async ({ ctx }) => {
    const { teamId } = ctx;
    const ticketTemplate = await prisma.ticketTemplate.findMany({
      orderBy: {
        createdAt: 'asc',
      },
      where: { teamId: teamId, deletedAt: null },
    });
    return ticketTemplate;
  }),

  createTicketType: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        eventId: z.number(),
        price: z.number().optional(),
        uid: z.string().optional(),
        maxQuantityPerUser: z.number().optional(),
        quantity: z.number().optional(),
        available: z.number().optional(),
        description: z.string().optional(),
        // seatNumber: z.string().optional(),
        stripeProductId: z.string().optional(),
        stripePriceId: z.string().optional(),
        imageUrl: z.string().optional(),
        status: z.string().optional(),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
        deletedAt: z.date().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.name) {
        throw new Error('El nombre del tipo de ticket es obligatorio');
      }

      try {
        let externalUid: string | undefined = undefined;

        const productData = await createProductFactura({
          code: 'K001',
          name: `Boleto para ${input.name}`,
          price: input.price ? input.price : 0,
          clavePS: 90131504,
          unity: 'Unidad de servicio',
          claveUnity: 'E48',
        });

        console.log('Product data from Factura:', productData);

        if (productData?.data?.uid) {
          externalUid = productData.data.uid;
        }

        return await prisma.ticketType.create({
          data: {
            name: input.name,
            ...(input.price !== undefined ? { price: input.price } : {}),
            ...(input.uid !== undefined ? { uid: input.uid } : {}),
            maxQuantityPerUser: input.maxQuantityPerUser ?? 0,
            quantity: input.quantity ?? 0,
            available: input.available ?? 0,
            ...(input.description !== undefined ? { description: input.description } : {}),
            // ...(input.seatNumber !== undefined ? { seatNumber: input.seatNumber } : {}),
            ...(input.stripeProductId !== undefined
              ? { stripeProductId: input.stripeProductId }
              : {}),
            ...(input.stripePriceId !== undefined ? { stripePriceId: input.stripePriceId } : {}),
            ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
            status: input.status ?? 'active',
            createdAt: input.createdAt ?? new Date(),
            updatedAt: input.updatedAt ?? new Date(),
            eventId: input.eventId,
            uid: externalUid,
          },
        });
      } catch (error) {
        console.error('Error creating ticket type:', error);
        throw new Error('Error creating ticket type');
      }
    }),

  getTicketType: authenticatedProcedure
    .input(
      z.object({
        eventId: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const ticketType = await prisma.ticketType.findMany({
        orderBy: {
          createdAt: 'asc',
        },
        where: { eventId: input.eventId, deletedAt: null },
      });
      return ticketType;
    }),

  createMultipleTicketType: authenticatedProcedure
    .input(
      z.object({
        ticketTypes: z.array(
          z.object({
            name: z.string().nullable().optional(),
            price: z.number().nullable().optional(),
            uid: z.string().optional(),
            maxQuantityPerUser: z.number().optional(),
            quantity: z.number().nullable().optional(),
            available: z.number().optional(),
            description: z.string().nullable().optional(),
            imageUrl: z.string().optional(),
            status: z.string().optional(),
          }),
        ),
        eventId: z.number().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const { eventId, ...data } = input;

      console.log('Creating multiple ticket types for event:', eventId, data.ticketTypes);
      const tickets = Promise.all(
        data.ticketTypes.map(async (input) => {
          if (!input.name) {
            throw new Error('El nombre del tipo de ticket es obligatorio');
          }

          const product = await stripe.products.create({
            name: input.name,
            description: input.description || undefined,
            // images: newType.imageUrl ? [newType.imageUrl] : undefined,
          });
          const [priceStripe, productData] = await Promise.allSettled([
            stripe.prices.create({
              product: product.id,
              unit_amount: Math.round((input.price || 0) * 100), // Stripe usa centavos
              currency: 'usd', // Ajusta según tu moneda
            }),
            createProductFactura({
              code: 'K001',
              name: `Boleto para ${input.name}`,
              price: input.price ? input.price : 0,
              clavePS: 90131504,
              unity: 'Unidad de servicio',
              claveUnity: 'E48',
            }),
          ]);

          const price = priceStripe.status === 'fulfilled' ? priceStripe.value : null;
          console.log('Product data from Factura:', productData);
          let externalUid: string | undefined = undefined;
          if (productData.status === 'fulfilled' && productData.value?.data?.uid) {
            console.log('Factura product created successfully:', productData.value.data);
            externalUid = productData.value.data.uid;
          }

          try {
            return await prisma.ticketType.create({
              data: {
                name: input.name,
                ...(input.price !== undefined ? { price: input.price } : {}),
                ...(input.uid !== undefined ? { uid: input.uid } : {}),
                maxQuantityPerUser: input.maxQuantityPerUser ?? 0,
                quantity: input.quantity ?? 0,
                eventId,
                available: input.available ?? 0,
                ...(input.description !== undefined ? { description: input.description } : {}),
                // ...(input.seatNumber !== undefined ? { seatNumber: input.seatNumber } : {}),
                ...(product.id !== undefined ? { stripeProductId: product.id } : {}),
                ...(product.id !== undefined && price ? { stripePriceId: price.id } : {}),
                ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
                uid: externalUid,
              },
            });
          } catch (error) {
            console.error('Error creating ticket type:', error);
            throw new Error('Error creating ticket type');
          }
        }),
      );
      return tickets;
    }),

  updateTicketTypeById: authenticatedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        eventId: z.number().optional(),
        price: z.number().optional(),
        uid: z.string().optional(),
        maxQuantityPerUser: z.number().optional(),
        quantity: z.number().optional(),
        available: z.number().optional(),
        description: z.string().optional(),
        // seatNumber: z.string().optional(),
        // stripeProductId: z.string().optional(),
        // stripePriceId: z.string().optional(),
        imageUrl: z.string().optional(),
        status: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      try {
        return await prisma.ticketType.update({
          where: { id },
          data: {
            ...data,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error updating ticket type:', error);
        throw new Error('Error updating ticket type');
      }
    }),

  updateMultpleTicketTypeById: authenticatedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          name: z.string().nullable().optional(),
          price: z.number().nullable().optional(),
          uid: z.string().optional(),
          maxQuantityPerUser: z.number().optional(),
          quantity: z.number().nullable().optional(),
          available: z.number().optional(),
          description: z.string().nullable().optional(),
          imageUrl: z.string().optional(),
          status: z.string().optional(),
          deleted: z.boolean().optional(),
          modified: z.boolean().optional(),
        }),
      ),
    )
    .mutation(async ({ input }) => {
      const updateTicket = input;
      await Promise.all(
        updateTicket.map(async (data) => {
          const { id, deleted, modified, ...updateData } = data;
          if (deleted != true && modified === true) {
            try {
              return await prisma.ticketType.update({
                where: { id: Number(id) },
                data: {
                  ...updateData,
                  updatedAt: new Date(),
                },
              });
            } catch (error) {
              console.error('Error updating ticket type:', error);
              throw new Error('Error updating ticket type');
            }
          } else if (deleted && deleted === true) {
            try {
              return await prisma.ticketType.update({
                where: { id: Number(id) },
                data: {
                  deletedAt: new Date(),
                  updatedAt: new Date(),
                },
              });
            } catch (error) {
              console.error('Error updating ticket type:', error);
              throw new Error('Error updating ticket type');
            }
          } else {
            console.log('No changes detected for ticket type with id:', id);
          }
        }),
      );
      // return tickets;
    }),

  deleteTicketTypeById: authenticatedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { id } = input;
      try {
        return await prisma.ticketType.delete({
          where: { id },
        });
      } catch (error) {
        console.error('Error deleting ticket type:', error);
        throw new Error('Error deleting ticket type');
      }
    }),
});
