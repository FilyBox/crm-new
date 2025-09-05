import { Trans } from '@lingui/react/macro';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon, Trash2Icon } from 'lucide-react';

import { cn } from '@documenso/ui/lib/utils';
import { badgeVariants } from '@documenso/ui/primitives/badge';
import { Button } from '@documenso/ui/primitives/button';
import { Card } from '@documenso/ui/primitives/card';
import { Input } from '@documenso/ui/primitives/input';
import { Label } from '@documenso/ui/primitives/label';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';
import { Textarea } from '@documenso/ui/primitives/textarea';

import { useRegistrationFormStore, useUpdateFormStore } from '~/storage/store-tickets';

export default function TicketsAdd({ isLoading, editar }: { isLoading: boolean; editar: boolean }) {
  const { newType, addNewTicket, removeNewTicket, updateNewTicket } = useRegistrationFormStore();
  const { type, updateTicketEdit } = useUpdateFormStore();
  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={
            newType.length > 0
              ? cn(
                  badgeVariants({
                    variant: 'secondary',
                    size: 'default',
                    className: 'min-w-20 max-w-20 hover:!bg-blue-100 hover:dark:!bg-blue-400/20',
                  }),
                )
              : `bg-background ${editar ? 'w-full' : 'min-w-10 max-w-10'} p-1`
          }
        >
          {type.length > 0 ? (
            <div className="flex items-center gap-2">
              <Trans>Edit</Trans>
              {type.length > 0 && <span>{type.length} </span>}
              <span>
                <Trans>ticket</Trans>
                {type.length > 1 ? 's' : ''}
              </span>
            </div>
          ) : newType.length > 0 ? (
            <div className="flex items-center gap-2">
              {newType.length > 0 && <span>{newType.length} </span>}
              <span>
                <Trans>ticket</Trans>
                {newType.length > 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <PlusIcon size={16} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-9999 flex h-full min-h-[50vh] w-full flex-col-reverse overflow-hidden sm:min-w-[50cqw]"
      >
        <Button
          type="button"
          variant="default"
          onClick={() =>
            addNewTicket({
              id: crypto.randomUUID(),
              name: '',
              description: '',
              price: 1,
              quantity: 1,
              maxQuantityPerUser: 5,
              seatNumber: 1,
            })
          }
          className="mt-2 w-full"
          disabled={isLoading}
        >
          Agregar boleto <PlusIcon />
        </Button>

        <ScrollArea className="h-[50cqh] !max-h-[50cqh] !w-full pr-4">
          <div className="flex w-full flex-col">
            <AnimatePresence mode="popLayout">
              {type.map((ticketData, index) => (
                <motion.div
                  key={ticketData.id}
                  initial={{ opacity: 0, y: -20, scale: 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                    delay: index * 0.05,
                  }}
                  layout
                >
                  {ticketData.deleted != true ? (
                    <Card className="dark:bg-backgroundDark relative mt-4 flex w-full flex-col items-start justify-start gap-1 bg-gray-200 p-3">
                      <div className="flex w-full flex-col items-end gap-2">
                        <div className="flex w-full flex-col gap-2">
                          <Label htmlFor={`member-${ticketData.id}`}>Tipo de boleto</Label>
                          <Input
                            type="text"
                            id={`type-${ticketData.id}`}
                            value={ticketData.name ?? ''}
                            onChange={(e) =>
                              updateTicketEdit(ticketData.id, { name: e.target.value })
                            }
                            placeholder="VIP"
                            required
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex w-full flex-col gap-2">
                          <Label htmlFor={`member-${ticketData.id}`}>Descripción</Label>
                          <Textarea
                            id={`type-${ticketData.id}`}
                            value={ticketData.description ?? ''}
                            onChange={(e) =>
                              updateTicketEdit(ticketData.id, { description: e.target.value })
                            }
                            placeholder="VIP"
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex w-full flex-col gap-2">
                          <Label htmlFor={`price-${ticketData.id}`}>Precio</Label>
                          <Input
                            type="number"
                            id={`price-${ticketData.id}`}
                            value={ticketData.price ?? 1}
                            onChange={(e) =>
                              updateTicketEdit(ticketData.id, { price: Number(e.target.value) })
                            }
                            placeholder="$0"
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex w-full flex-col gap-2">
                          <Label htmlFor={`quantity-${ticketData.id}`}>Cantidad</Label>
                          <Input
                            type="number"
                            id={`quantity-${ticketData.id}`}
                            value={ticketData.quantity ?? 1}
                            onChange={(e) =>
                              updateTicketEdit(ticketData.id, { quantity: Number(e.target.value) })
                            }
                            placeholder="0"
                            required
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex w-full flex-col gap-2">
                          <Label htmlFor={`max-quantity-${ticketData.id}`}>
                            Maxima cantidad por usuario
                          </Label>
                          <Input
                            type="number"
                            id={`max-quantity-${ticketData.id}`}
                            value={ticketData.maxQuantityPerUser ?? 5}
                            min={1}
                            onChange={(e) =>
                              updateTicketEdit(ticketData.id, {
                                maxQuantityPerUser: Number(e.target.value),
                              })
                            }
                            placeholder="0"
                            required
                            disabled={isLoading}
                          />
                        </div>
                        {(type.length > 1 || newType.length > 0) && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                              updateTicketEdit(ticketData.id, {
                                deleted: true,
                              });
                            }}
                            className="absolute right-3 top-2.5 m-0 h-fit p-0 text-red-600 transition-colors hover:text-red-700"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <></>
                  )}
                </motion.div>
              ))}
              {newType.map((ticketData, index) => (
                <motion.div
                  key={ticketData.id}
                  initial={{ opacity: 0, y: -20, scale: 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                    delay: index * 0.05,
                  }}
                  layout
                >
                  <Card className="relative mt-2 flex w-full flex-col items-start justify-start gap-2 p-3">
                    <div className="flex w-full flex-col items-end gap-2">
                      <div className="flex w-full flex-col gap-2">
                        <Label htmlFor={`member-${ticketData.id}`}>Tipo de boleto</Label>
                        <Input
                          type="text"
                          id={`type-${ticketData.id}`}
                          value={ticketData.name ?? ''}
                          onChange={(e) => updateNewTicket(ticketData.id, { name: e.target.value })}
                          placeholder="VIP"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="flex w-full flex-col gap-2">
                        <Label htmlFor={`member-${ticketData.id}`}>Descripción</Label>
                        <Textarea
                          id={`type-${ticketData.id}`}
                          value={ticketData.description ?? ''}
                          onChange={(e) =>
                            updateNewTicket(ticketData.id, { description: e.target.value })
                          }
                          placeholder="VIP"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex w-full flex-col gap-2">
                        <Label htmlFor={`price-${ticketData.id}`}>Precio</Label>
                        <Input
                          type="number"
                          id={`price-${ticketData.id}`}
                          value={ticketData.price ?? 0}
                          onChange={(e) =>
                            updateNewTicket(ticketData.id, { price: Number(e.target.value) })
                          }
                          placeholder="$0"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="flex w-full flex-col gap-2">
                        <Label htmlFor={`quantity-${ticketData.id}`}>Cantidad</Label>
                        <Input
                          type="number"
                          id={`quantity-${ticketData.id}`}
                          value={ticketData.quantity ?? 0}
                          onChange={(e) =>
                            updateNewTicket(ticketData.id, { quantity: Number(e.target.value) })
                          }
                          placeholder="0"
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="flex w-full flex-col gap-2">
                        <Label htmlFor={`max-quantity-${ticketData.id}`}>
                          Maxima cantidad por usuario
                        </Label>
                        <Input
                          type="number"
                          id={`max-quantity-${ticketData.id}`}
                          value={ticketData.maxQuantityPerUser ?? 0}
                          onChange={(e) =>
                            updateNewTicket(ticketData.id, {
                              maxQuantityPerUser: Number(e.target.value),
                            })
                          }
                          min={1}
                          placeholder="0"
                          required
                          disabled={isLoading}
                        />
                      </div>
                      {/* {(newType.length > 1 || type.length > 0) && ( */}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          removeNewTicket(ticketData.id);
                        }}
                        className="absolute right-3 top-2.5 m-0 h-fit p-0 text-red-600 transition-colors hover:text-red-700"
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </button>
                      {/* )} */}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* <ScrollArea className="h-[60cqh] !max-h-[60cqh] !w-full pr-4">
          <div className="flex w-full flex-col-reverse gap-3">
            {newType.map((ticketData, index) => (
              <Card
                key={ticketData.id}
                className="mt-4 flex w-full flex-col items-start justify-start gap-3 p-3"
              >
                <div className="flex w-full flex-col items-end gap-6">
                  <div className="flex w-full flex-col gap-2">
                    <Label htmlFor={`member-${ticketData.id}`}>Tipo de boleto</Label>
                    <Input
                      type="text"
                      id={`type-${ticketData.id}`}
                      value={ticketData.name ?? ''}
                      onChange={(e) => updateNewTicket(ticketData.id, { name: e.target.value })}
                      placeholder="VIP"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <Label htmlFor={`member-${ticketData.id}`}>Tipo de boleto</Label>
                    <Textarea
                      id={`type-${ticketData.id}`}
                      value={ticketData.description ?? ''}
                      onChange={(e) =>
                        updateNewTicket(ticketData.id, { description: e.target.value })
                      }
                      placeholder="VIP"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <Label htmlFor={`price-${ticketData.id}`}>Precio</Label>
                    <Input
                      type="number"
                      id={`price-${ticketData.id}`}
                      value={ticketData.price ?? 0}
                      onChange={(e) =>
                        updateNewTicket(ticketData.id, { price: Number(e.target.value) })
                      }
                      placeholder="$0"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex w-full flex-col gap-2">
                    <Label htmlFor={`quantity-${ticketData.id}`}>Cantidad</Label>
                    <Input
                      type="number"
                      id={`quantity-${ticketData.id}`}
                      value={ticketData.quantity ?? 0}
                      onChange={(e) =>
                        updateNewTicket(ticketData.id, { quantity: Number(e.target.value) })
                      }
                      placeholder="0"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex w-full flex-col gap-2">
                    <Label htmlFor={`max-quantity-${ticketData.id}`}>
                      Maxima cantidad por usuario
                    </Label>
                    <Input
                      type="number"
                      id={`max-quantity-${ticketData.id}`}
                      value={ticketData.maxQuantityPerUser ?? 0}
                      onChange={(e) =>
                        updateNewTicket(ticketData.id, {
                          maxQuantityPerUser: Number(e.target.value),
                        })
                      }
                      placeholder="0"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  {newType.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => {
                        removeNewTicket(ticketData.id);
                      }}
                      className="border-[1px] border-red-600 px-3 text-red-600 transition-colors hover:border-red-700 hover:text-red-700"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea> */}
      </PopoverContent>
    </Popover>
  );
}
