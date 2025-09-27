import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { addDays, format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { type TIsrcSongs } from '@documenso/lib/types/isrc';
import { Button } from '@documenso/ui/primitives/button';
import { Calendar } from '@documenso/ui/primitives/calendar-year-picker';
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
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@documenso/ui/primitives/sheet';

const formSchema = z.object({
  id: z.number(),
  trackName: z.string().optional(),
  artist: z.string().optional(),
  duration: z.string().optional(),
  title: z.string().optional(),
  license: z.string().optional(),
  isrc: z.string().optional(),
  date: z.date().optional(),
});

type artistData = {
  id: number;
  name: string;
}[];

interface MyFormProps {
  onSubmit: (data: TIsrcSongs) => void;
  initialData: TIsrcSongs | null;
  isSubmitting: boolean;
  artistData?: artistData;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  setInitialData: (data: TIsrcSongs | null) => void;
}

export default function IsrcSheet({
  onSubmit,
  initialData,
  artistData,
  isDialogOpen,
  setIsDialogOpen,
  setInitialData,
}: MyFormProps) {
  const { _ } = useLingui();

  const [selectedArtists, setSelectedArtists] = useState<string[] | undefined>([]);

  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // trackPlayLink: '',
      // preOrderType: '',
      // instantGratificationDate: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
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
        }
      });
    } else {
      form.reset();
      setSelectedArtists([]);
      setInitialData(null);
    }
  }, [initialData]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const dataToSubmit = initialData?.id ? { ...values, id: initialData.id } : values;
      const dataToSend = {
        ...dataToSubmit,
        artistsToUpdate: selectedArtists,
        artists: initialData?.artists,
      };
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      await onSubmit(dataToSend as unknown as TIsrcSongs);
      form.reset();
    } catch (error) {
      throw new Error('Error submitting form');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <SheetTrigger asChild>
        <Button
          onClick={() => setInitialData(null)}
          className="w-full sm:w-fit"
          disabled={isSubmitting}
        >
          <Trans>New Record</Trans>
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
              <Trans>{initialData ? _(msg`Update Isrc Record`) : _(msg`Add Isrc Record`)}</Trans>
            </SheetTitle>
            <SheetDescription>
              {initialData
                ? _(msg`Update your Isrc record details.`)
                : _(msg`Create a new Isrc record with details.`)}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="">
              <fieldset disabled={isSubmitting} className="space-y-6">
                {/* Sección 1: Información básica del producto */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-6">
                    <FormField
                      control={form.control}
                      name="trackName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Track Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre de la pista" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titulo (Album)</FormLabel>
                          <FormControl>
                            <Input placeholder="Titulo (Album)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-12 md:col-span-6">
                    <div className="mt-2.5 flex flex-col gap-2">
                      <FormLabel>
                        <Trans>Artists</Trans>
                      </FormLabel>
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
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col pt-2.5">
                          <FormLabel>Release Date</FormLabel>
                          <FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={'outline'}>
                                    {field.value ? (
                                      (() => {
                                        try {
                                          // Handle different date formats safely
                                          const date = new Date(field.value);
                                          return isNaN(date.getTime())
                                            ? 'Select date'
                                            : format(addDays(date, 1), 'dd/MM/yyyy');
                                        } catch (error) {
                                          return 'Select date';
                                        }
                                      })()
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="z-9999 w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={(() => {
                                    try {
                                      const date = field.value
                                        ? field.value instanceof Date
                                          ? field.value
                                          : new Date(field.value)
                                        : undefined;
                                      return date && !isNaN(date.getTime())
                                        ? addDays(date, 1)
                                        : undefined;
                                    } catch (error) {
                                      return undefined;
                                    }
                                  })()}
                                  onSelect={(date) => field.onChange(date)} // Enviar Date directamente
                                  disabled={(date) => date < new Date('1900-01-01')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración</FormLabel>
                          <FormControl>
                            <Input placeholder="2:40 min" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <FormField
                      control={form.control}
                      name="license"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Licencia</FormLabel>
                          <FormControl>
                            <Input placeholder="Licencia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-12 md:col-span-6">
                    <FormField
                      control={form.control}
                      name="isrc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISRC</FormLabel>
                          <FormControl>
                            <Input placeholder="ISRC" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </fieldset>
            </form>
          </Form>
        </div>

        <SheetFooter>
          <div className="flex w-full gap-5">
            <SheetClose asChild>
              <Button disabled={isLoading} className="w-full" size="lg" variant="secondary">
                <Trans>Cancel</Trans>
              </Button>
            </SheetClose>
            <Button
              disabled={isLoading}
              loading={isLoading}
              type="button"
              size="lg"
              className="w-full"
              onClick={() => {
                const values = form.getValues();
                void handleSubmit(values); // Using void operator to explicitly mark as intentionally unhandled
              }}
            >
              Completar
            </Button>{' '}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
