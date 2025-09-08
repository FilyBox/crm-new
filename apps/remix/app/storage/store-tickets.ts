import { create } from 'zustand/react';

import { type TTicketTypeLite } from '@documenso/lib/types/ticketType';

export type TTicketTypeLiteStore = TTicketTypeLite & {
  id: string;
  deleted?: boolean;
  modified?: boolean;
};

export const useRegistrationFormStore = create<RegistrationFormStore>((set) => ({
  newType: [
    {
      id: crypto.randomUUID(),
      name: '',
      price: 1,
      quantity: 1,
      maxQuantityPerUser: 5,
      seatNumber: 1,
      description: '',
    },
  ],

  addNewTicket: (ticket) =>
    set((state) => ({
      newType: [...state.newType, ticket],
    })),

  removeNewTicket: (id) =>
    set((state) => ({
      newType: state.newType.filter((m) => m.id !== id),
    })),

  updateNewTicket: (id, updates) =>
    set((state) => ({
      newType: state.newType.map((m) => (m.id === id ? { ...m, ...updates, modified: true } : m)),
    })),

  reset: () =>
    set(() => ({
      newType: [
        {
          id: crypto.randomUUID(),
          name: '',
          price: 5,
          quantity: 5,
          maxQuantityPerUser: 5,
          seatNumber: 5,
          description: '',
        },
      ],
    })),
}));

export const useUpdateFormStore = create<UpdateRegistrationFormStore>((set) => ({
  type: [
    {
      id: crypto.randomUUID(),
      name: '',
      price: 1,
      quantity: 1,
      maxQuantityPerUser: 5,
      seatNumber: 1,
      description: '',
      deleted: false,
      modified: false,
    },
  ],

  addMember: (ticket) =>
    set((state) => ({
      type: [...state.type, ticket],
    })),

  removeTicketEdit: (id) =>
    set((state) => ({
      type: state.type.filter((m) => m.id !== id),
    })),

  updateTicketEdit: (id, updates) =>
    set((state) => ({
      type: state.type.map((m) => (m.id === id ? { ...m, ...updates, modified: true } : m)),
    })),

  reset: () =>
    set(() => ({
      type: [
        {
          id: crypto.randomUUID(),
          name: '',
          price: 1,
          quantity: 1,
          maxQuantityPerUser: 5,
          seatNumber: 1,
          description: '',
          deleted: false,
          modified: false,
        },
      ],
    })),
}));

interface UpdateRegistrationFormStore {
  type: TTicketTypeLiteStore[];
  addMember: (ticket: TTicketTypeLiteStore) => void;
  removeTicketEdit: (id: string) => void;
  updateTicketEdit: (id: string, updates: Partial<TTicketTypeLiteStore>) => void;
}

interface RegistrationFormStore {
  newType: TTicketTypeLiteStore[];
  addNewTicket: (ticket: TTicketTypeLiteStore) => void;
  removeNewTicket: (id: string) => void;
  updateNewTicket: (id: string, updates: Partial<TTicketTypeLiteStore>) => void;
}
