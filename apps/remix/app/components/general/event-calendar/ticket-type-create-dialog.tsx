import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { FilePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { useSession } from '@documenso/lib/client-only/providers/session';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form';
import { Input } from '@documenso/ui/primitives/input';
import { Textarea } from '@documenso/ui/primitives/textarea';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Name cannot be empty' }),
  description: z.string().optional(),
  price: z.number().min(0, { message: 'Price must be a positive number' }),
  quantity: z.number().min(1, { message: 'Quantity must be at least 1' }),
  maxQuantityPerUser: z.number().min(1, { message: 'Max quantity per user must be at least 1' }),
  imageUrl: z.string().optional(),
});

export const TicketTypeCreateDialog = ({ isLoading }: { isLoading: boolean }) => {
  const { user } = useSession();
  const { t } = useLingui();
  const [showDialog, setShowDialog] = useState(false);

  const { mutateAsync: createTicketTemplate, isPending: isCreatingTicket } =
    trpc.ticketType.createTicketTemplate.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      maxQuantityPerUser: 1,
      imageUrl: '',
    },
  });

  const handleSave = (values: z.infer<typeof formSchema>) => {
    toast.promise(
      createTicketTemplate({
        name: values.name,
        description: values.description,
        price: values.price,
        quantity: values.quantity,
        maxQuantityPerUser: values.maxQuantityPerUser,
        imageUrl: values.imageUrl,
      }),
      {
        loading: t`Creating ticket template...`,
        success: () => {
          form.reset();
          setShowDialog(false);
          return { message: t`Ticket template created successfully` };
        },
        error: () => t`Error creating ticket template. Please try again.`,
      },
    );
  };

  const canCreateTicket = Boolean(user.id) && !isCreatingTicket;

  return (
    <Dialog open={showDialog} onOpenChange={(value) => !isCreatingTicket && setShowDialog(value)}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="max-sm:px-2.5! max-sm:h-8"
          disabled={isCreatingTicket || isLoading}
        >
          <FilePlus className="-ml-1 mr-2 h-4 w-4" />
          <Trans>New Ticket Template</Trans>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] w-full !max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            <Trans>Create New Ticket Template</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>Create a new ticket template that can be reused for multiple events.</Trans>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="grid gap-4" aria-disabled={isCreatingTicket}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Name</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., VIP Ticket, General Admission" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Description</Trans>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what this ticket includes..."
                      maxLength={250}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Price</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Trans>Quantity</Trans>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxQuantityPerUser"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Max Quantity Per User</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="1"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Image URL (Optional)</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="url" placeholder="https://example.com/image.jpg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
          </form>
        </Form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isCreatingTicket}>
              <Trans>Cancel</Trans>
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={async () => {
              const isValid = await form.trigger();
              if (isValid) {
                const values = form.getValues();
                await handleSave(values);
              }
            }}
            loading={isCreatingTicket}
            disabled={!canCreateTicket}
          >
            <Trans>Create Ticket Template</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
