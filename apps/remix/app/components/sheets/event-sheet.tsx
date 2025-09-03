import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { es } from 'date-fns/locale';
import { FilePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { useSession } from '@documenso/lib/client-only/providers/session';
import { type TEvent } from '@documenso/lib/types/event';
import { putFile } from '@documenso/lib/universal/upload/put-file';
import { Button } from '@documenso/ui/primitives/button';
import { DateTimePicker } from '@documenso/ui/primitives/datetime-picker';
import { DialogClose } from '@documenso/ui/primitives/dialog';
import {
  Faceted,
  FacetedBadgeList,
  FacetedContent,
  FacetedEmpty,
  FacetedGroup,
  FacetedInput,
  FacetedItem,
  FacetedList,
  FacetedTrigger,
} from '@documenso/ui/primitives/faceted-hover-badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form';
import { Input } from '@documenso/ui/primitives/input';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@documenso/ui/primitives/sheet';
import { Textarea } from '@documenso/ui/primitives/textarea';

import { useRegistrationFormStore, useUpdateFormStore } from '~/storage/store-tickets';

import InputImage from '../general/input-image';
import TicketsAdd from '../general/tickets-add';

type artistData = {
  id: number;
  name: string;
}[];

type tickets = {
  id: number;
  name: string | null;
  price: number | null;
  quantity: number | null;
  maxQuantityPerUser: number | null;
  seatNumber?: number | null;
  description?: string | null;
};

interface MyFormProps {
  onSubmit: (data: Omit<TEvent, 'userId'>) => void;
  initialData: Omit<TEvent, 'userId'> | null;
  artistData?: artistData;
  tickets?: tickets[];
  isDialogOpen: boolean;
  onDelete: (id: number) => void;

  setIsDialogOpen: (isOpen: boolean) => void;
  setEditingUser: (user: Omit<TEvent, 'userId'> | null) => void;
}

const formSchema = z.object({
  end: z.date().optional(),
  beginning: z.date().optional(),
  artist: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === null ? '' : val)),
  name: z.string().min(1, { message: 'name cannot be empty' }),
  description: z.string().min(1, { message: 'description cannot be empty' }),
  venue: z.string().min(1, { message: 'venue cannot be empty' }),
});

export const EventCreateDialog = ({
  onSubmit,
  initialData,
  artistData,
  onDelete,
  tickets,
  isDialogOpen,
  setEditingUser,
  setIsDialogOpen,
}: MyFormProps) => {
  const [selectedArtists, setSelectedArtists] = useState<string[] | undefined>([]);
  const [selectedTickets, setSelectedTickets] = useState<string[] | undefined>([]);
  const [isImageRemove, setIsImageRemove] = useState(false);
  const { type, addMember } = useUpdateFormStore();
  const { newType } = useRegistrationFormStore();
  const { _ } = useLingui();

  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSession();
  const [image, setImage] = useState<File | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      venue: '',
      beginning: initialData?.beginning ? new Date(initialData.beginning) : undefined,
      end: initialData?.end ? new Date(initialData.end) : undefined,
      artist: undefined,
    },
  });
  useEffect(() => {
    type.length = 0; // Clear the existing tickets

    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        if (key !== 'id') {
          // Skip the id field
          // @ts-expect-error - We know these fields exist in our form schema
          form.setValue(key, initialData[key]);
          if (key === 'artists') {
            const artistsData = initialData.artists?.map((artist) => artist.id.toString()) || [];
            setSelectedArtists(artistsData);
          }

          if (key === 'ticketTypes') {
            const ticketTypesData =
              initialData.ticketTypes?.map((ticket) => ticket.id.toString()) || [];
            setSelectedTickets(ticketTypesData);

            //     initialData.ticketTypes?.forEach((ticket) => {
            //   // Ensure ticket.id is a string
            //   const ticketId = ticket.id.toString();
            //   // Check if the ticket already exists in the store
            //   const existingTicket = type.find((t) => t.id === ticketId);
            //   if (!existingTicket) {
            //     addMember({
            //       id: ticketId,
            //       name: ticket.name,
            //       price: ticket.price,
            //       quantity: ticket.quantity,
            //       maxQuantityPerUser: ticket.maxQuantityPerUser,
            //       seatNumber: ticket.seatNumber,
            //       description: ticket.description,
            //       deleted: false,
            //       modified: false,
            //     });
            //   }
            // });
          }
          newType.length = 0;
        }
      });
    } else {
      form.reset();
      setSelectedArtists([]);
      setSelectedTickets([]);
    }
  }, [form, initialData]);

  async function handleSubmit({
    values,
    published,
  }: {
    values: z.infer<typeof formSchema>;
    published: boolean;
  }) {
    try {
      setIsLoading(true);

      let imageUrl = '';
      if (image) {
        const parts = image.name.split('.');
        const ext = parts.length > 1 ? '.' + parts.pop() : '';
        let base = parts.join('.');
        if (base.length > 50) base = base.slice(0, 50);
        const safeName = base + ext;

        const truncatedFile = new File([image], safeName, { type: image.type });

        const result = await putFile(truncatedFile);
        imageUrl = result.data;

        const dataToSubmit = initialData?.id
          ? { ...values, id: initialData.id, image: result.data, published }
          : { ...values, published };
        console.log('dataToSubmit:', dataToSubmit);

        console.log('Image uploaded successfully:', result.data);
        imageUrl = result.data;
        const dataToSend = {
          updateArtists: selectedArtists,
          updateTickets: selectedTickets,
          image: result.data,
          ...dataToSubmit,
        };
        await onSubmit(dataToSend as unknown as Omit<TEvent, 'userId'>);
      } else {
        const image = isImageRemove ? null : 'nochange';
        const dataToSubmit = initialData?.id
          ? { ...values, id: initialData.id, image, published }
          : { ...values, published };
        const dataToSend = {
          updateArtists: selectedArtists,
          updateTickets: selectedTickets,
          ...dataToSubmit,
        };

        await onSubmit(dataToSend as unknown as Omit<TEvent, 'userId'>);
      }
      // toast.success(_(msg`Event created successfully`));
      setEditingUser(null);
      setSelectedArtists([]);
      setImage(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Form submission error', error);
      toast.error(_(msg`Error submitting form`), {
        description: _(msg`Please check the console for more details.`),
        position: 'bottom-center',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handlePublish({
    values,
    published,
  }: {
    values: z.infer<typeof formSchema>;
    published: boolean;
  }) {
    toast.warning(
      published ? _(msg`The event will be published`) : _(msg`The event will be unpublished`),
      {
        description: published
          ? _(msg`Are you sure you want to publish this item?`)
          : _(msg`Are you sure you want to unpublish this item?`),
        position: 'bottom-center',
        duration: 3000,
        className: 'z-9999 pointer-events-auto',
        action: {
          label: published ? _(msg`Publish`) : _(msg`Unpublish`),
          onClick: () => {
            toast.promise(handleSubmit({ published, values }), {
              loading: published ? _(msg`Publishing event...`) : _(msg`Unpublishing event...`),
              success: published
                ? _(msg`Event published successfully`)
                : _(msg`Event unpublished successfully`),
              error: published ? _(msg`Error publishing event`) : _(msg`Error unpublishing event`),
              position: 'bottom-center',
              className: 'z-9999 pointer-events-auto',
            });
          },
        },
      },
    );
  }

  function handleSave({
    values,
    published,
    creating,
  }: {
    values: z.infer<typeof formSchema>;
    published: boolean;
    creating: boolean;
  }) {
    toast.promise(handleSubmit({ published, values }), {
      loading: creating ? _(msg`Creating event...`) : _(msg`Updating event...`),
      success: creating ? _(msg`Event created successfully`) : _(msg`Event updated successfully`),
      error: creating ? _(msg`Error creating event`) : _(msg`Error updating event`),
      position: 'bottom-center',
      className: 'z-9999 pointer-events-auto',
    });
  }

  return (
    <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <SheetTrigger asChild>
        <Button
          className="m-1 w-full cursor-pointer md:w-fit"
          onClick={() => setEditingUser(null)}
          disabled={!user.emailVerified}
        >
          <FilePlus className="-ml-1 mr-2 h-4 w-4" />
          <Trans>New Event</Trans>
        </Button>
      </SheetTrigger>

      <SheetContent
        autoFocus={false}
        showOverlay={true}
        className="dark:bg-backgroundDark m-2 flex max-h-[98vh] w-full max-w-[94vw] flex-col justify-between overflow-y-auto rounded-lg bg-zinc-50 sm:m-2 md:max-w-4xl"
      >
        <div className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>
              <Trans>{initialData ? _(msg`Update Event`) : _(msg`Create Event`)}</Trans>
            </SheetTitle>
            <SheetDescription>
              <Trans>
                {initialData
                  ? _(msg`Update your event details like name, description, and artists.`)
                  : _(msg`Create a new Event with details like name, description, and artists.`)}
              </Trans>
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[58cqh] w-full sm:h-[75cqh]">
            <Form {...form}>
              <form className="flex flex-col gap-6 p-1">
                <fieldset disabled={isLoading} className="space-y-6">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Trans>Event Name</Trans>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder={_(msg`Event Name`)} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12">
                      <FormField
                        control={form.control}
                        name="venue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              <Trans>Event Venue</Trans>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder={_(msg`Event Venue`)} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12">
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
                                maxLength={200}
                                placeholder={_(msg`Event Description`)}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="beginning"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              <Trans>Beginning Date</Trans>
                            </FormLabel>

                            <DateTimePicker
                              locale={es}
                              hourCycle={12}
                              value={field.value}
                              onChange={(date) => field.onChange(date)}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="end"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>
                              <Trans>End Date</Trans>
                            </FormLabel>

                            <DateTimePicker
                              locale={es}
                              hourCycle={12}
                              value={field.value}
                              onChange={(date) => field.onChange(date)}
                            />

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <div className="flex flex-col gap-1">
                        <Trans>Artists</Trans>
                        <Faceted
                          modal={true}
                          value={selectedArtists}
                          onValueChange={(value) => {
                            setSelectedArtists(value);
                          }}
                          multiple={true}
                        >
                          <FacetedTrigger asChild>
                            <Button
                              variant="outline"
                              size="default"
                              className="w-full rounded font-normal"
                            >
                              <FacetedBadgeList
                                max={3}
                                options={artistData?.map((member) => ({
                                  label: member.name,
                                  value: member.id.toString(),
                                }))}
                                placeholder={_(msg`Select artists...`)}
                                className="h-fit"
                              />
                            </Button>
                          </FacetedTrigger>
                          <FacetedContent className="z-9999 h-fit w-full origin-[var(--radix-popover-content-transform-origin)]">
                            <FacetedInput
                              aria-label={_(msg`Search options`)}
                              placeholder={_(msg`Search options...`)}
                            />
                            <FacetedList className="h-fit">
                              <FacetedEmpty>{_(msg`No options found.`)}</FacetedEmpty>
                              <FacetedGroup>
                                {artistData?.map((option) => (
                                  <FacetedItem key={option.id} value={option.id.toString()}>
                                    <span>{option.name}</span>
                                  </FacetedItem>
                                ))}
                              </FacetedGroup>
                            </FacetedList>
                          </FacetedContent>
                        </Faceted>
                      </div>
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <div className="flex flex-col gap-1">
                        <Trans>Tickets</Trans>
                        <div className="flex gap-3">
                          {/* <Faceted
                            modal={true}
                            value={selectedTickets}
                            onValueChange={(value) => {
                              setSelectedTickets(value);
                            }}
                            multiple={true}
                          >
                            <FacetedTrigger asChild>
                              <Button
                                variant="outline"
                                size="default"
                                className="w-full rounded font-normal"
                              >
                                <FacetedBadgeList
                                  max={3}
                                  options={tickets?.map((ticket) => ({
                                    label: ticket.name || _(msg`Ticket`),
                                    value: ticket.id.toString(),
                                  }))}
                                  placeholder={_(msg`Select tickets...`)}
                                  className="h-fit"
                                />
                              </Button>
                            </FacetedTrigger>
                            <FacetedContent className="z-9999 h-fit w-full origin-[var(--radix-popover-content-transform-origin)]">
                              <FacetedInput
                                aria-label={_(msg`Search options`)}
                                placeholder={_(msg`Search options...`)}
                              />
                              <FacetedList className="h-fit">
                                <FacetedEmpty>{_(msg`No options found.`)}</FacetedEmpty>
                                <FacetedGroup>
                                  {tickets?.map((option) => (
                                    <div className="flex items-center gap-1" key={option.id}>
                                      <FacetedItem
                                        className="w-full"
                                        key={option.id}
                                        value={option.id.toString()}
                                      >
                                        <span>{option.name}</span>
                                      </FacetedItem>

                                      <PopoverHover
                                        trigger={<InfoIcon className="text-foreground h-4 w-4" />}
                                        contentProps={{
                                          className: 'flex flex-col gap-y-5 py-2 z-9999',
                                          side: 'top',
                                        }}
                                      >
                                        <div className="flex flex-col gap-2">

                                          <div className="flex items-center gap-1">
                                            <Badge
                                              size={'small'}
                                              className="text-foreground text-xs font-semibold"
                                            >
                                              <Trans>Name</Trans>
                                            </Badge>
                                            <span className="text-muted-foreground text-xs">
                                              {option.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Badge
                                              size={'small'}
                                              className="text-foreground text-xs font-semibold"
                                            >
                                              <Trans>Description</Trans>
                                            </Badge>
                                            <span className="text-muted-foreground line-clamp-1 text-xs">
                                              {option.description || _(msg`No description`)}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Badge
                                              size={'small'}
                                              className="text-foreground text-xs font-semibold"
                                            >
                                              <Trans>Price</Trans>
                                            </Badge>
                                            <span className="text-muted-foreground text-xs">
                                              {option.price}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Badge
                                              size={'small'}
                                              className="text-foreground text-xs font-semibold"
                                            >
                                              <Trans>Quantity</Trans>
                                            </Badge>
                                            <span className="text-muted-foreground text-xs">
                                              {option.quantity}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Badge
                                              size={'small'}
                                              className="text-foreground text-xs font-semibold"
                                            >
                                              <Trans>Max Quantity Per User</Trans>
                                            </Badge>
                                            <span className="text-muted-foreground text-xs">
                                              {option.maxQuantityPerUser}
                                            </span>
                                          </div>
                                        </div>
                                      </PopoverHover>
                                    </div>
                                  ))}
                                </FacetedGroup>
                              </FacetedList>
                            </FacetedContent>
                          </Faceted> */}

                          <TicketsAdd isLoading={isLoading} />
                        </div>
                      </div>
                    </div>

                    <div className="col-span-12 flex flex-col gap-2 md:col-span-6">
                      <label htmlFor="Image" className="text-foreground block text-sm font-medium">
                        <Trans>Image</Trans>
                      </label>

                      <InputImage
                        setIsImageRemove={(remove) => setIsImageRemove(remove)}
                        multiple={false}
                        onUpload={(data: File | null) => {
                          setImage(data);
                        }}
                        image={initialData?.image ?? undefined}
                      />
                    </div>
                  </div>
                </fieldset>
              </form>
            </Form>
          </ScrollArea>
        </div>
        <div className="flex w-full flex-col-reverse justify-end gap-2 sm:flex-row">
          <DialogClose asChild>
            <Button type="button" className="w-full" variant="outline" disabled={isLoading}>
              <Trans>Cancel</Trans>
            </Button>
          </DialogClose>
          {initialData && (
            <Button
              variant="outline"
              className="w-full border-red-600 text-red-600 hover:border-red-700 hover:text-red-700"
              type="button"
              onClick={() => {
                onDelete(initialData.id);
              }}
              disabled={isLoading}
            >
              <Trans>Delete</Trans>
            </Button>
          )}

          {initialData && initialData.published === false ? (
            <Button
              type="submit"
              variant={'outline'}
              className="border-primary text-primary w-full border-blue-500 text-blue-500 hover:border-blue-600 hover:text-blue-600"
              onClick={async () => {
                const isValid = await form.trigger(); // Trigger validation for all fields
                const errors = form.formState.errors;

                if (isValid) {
                  const values = form.getValues();
                  void handlePublish({ values, published: true });
                }
              }}
              disabled={isLoading}
            >
              <Trans>Update And Publish</Trans>
            </Button>
          ) : initialData && initialData.published === true ? (
            <Button
              type="submit"
              variant={'outline'}
              className="border-primary text-primary w-full border-orange-500 text-orange-500 hover:border-orange-600 hover:text-orange-600"
              onClick={async () => {
                const isValid = await form.trigger();
                const errors = form.formState.errors;

                if (isValid) {
                  const values = form.getValues();
                  void handlePublish({ values, published: false });
                }
              }}
              disabled={isLoading}
            >
              <Trans>Update and UnPublish</Trans>
            </Button>
          ) : (
            <></>
          )}
          <Button
            type="submit"
            variant={'outline'}
            className="dark:border-primary dark:text-primary w-full border-green-500 text-green-700"
            onClick={async () => {
              const isValid = await form.trigger();
              if (isValid) {
                const values = form.getValues();
                void handleSave({
                  values,
                  published: initialData?.published ?? false,
                  creating: !initialData,
                });
              }
            }}
            disabled={isLoading}
            loading={isLoading}
          >
            <p>{initialData ? _(msg`Update Event`) : _(msg`Create Event`)}</p>
          </Button>

          {!initialData && (
            <Button
              type="submit"
              variant={'outline'}
              className="border-primary text-primary w-full"
              onClick={async () => {
                const isValid = await form.trigger();
                const errors = form.formState.errors;
                console.log('Form errors:', errors);

                console.log('Form validation result:', isValid);
                if (isValid) {
                  console.log('Form is valid, submitting...');
                  const values = form.getValues();
                  void handlePublish({ values, published: true });
                }
              }}
              disabled={isLoading}
            >
              <Trans>Create And Publish</Trans>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
