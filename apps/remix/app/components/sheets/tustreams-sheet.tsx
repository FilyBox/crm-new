import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { type TtuStreams } from '@documenso/lib/types/tustreams';
import { Button } from '@documenso/ui/primitives/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
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
  title: z.string().min(1, { message: 'Title cannot be empty' }),
  UPC: z.string().optional().nullable(),
  artist: z.string().optional().nullable(),
  type: z.enum(['Sencillo', 'Album', 'Single', 'EP']).optional().nullable(),
  total: z.number().optional().nullable(),
  date: z.date().optional().nullable(),
});

type artistData = {
  id: number;
  name: string;
}[];

interface MyFormProps {
  onSubmit: (data: TtuStreams) => void;
  initialData?: TtuStreams | null;
  artistData?: artistData;
  isSubmitting: boolean;

  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  setInitialData: (data: TtuStreams | null) => void;
}

export default function TuStreamsSheet({
  onSubmit,
  initialData,
  artistData,
  isSubmitting,
  isDialogOpen,
  setIsDialogOpen,
  setInitialData,
}: MyFormProps) {
  const { _ } = useLingui();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<string[] | undefined>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      UPC: '',
      artist: '',
      type: undefined,
      date: undefined,
    },
  });

  const TypeOfTuStreamsValues = {
    Sencillo: 'Sencillo',
    Album: 'Album',
    Single: 'Single',
    EP: 'EP',
  } as const;

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
    }
  }, [initialData]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const dataToSubmit = {
        ...values,
        date: values.date ? new Date(values.date + 'T00:00:00') : null,
        ...(initialData?.id && { id: initialData.id }),
        artistsToUpdate: selectedArtists,
        artists: initialData?.artists || [],
      };

      await onSubmit(dataToSubmit as unknown as TtuStreams);
    } catch (error) {
      throw new Error('Error submitting form');
    } finally {
      setIsLoading(false);
    }
  }

  const convertToNumber = (value: string): number | undefined => {
    if (!value || value === '') return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  };

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
              <fieldset disabled={isLoading} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-12">
                    <FormField
                      control={form.control}
                      name="UPC"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>UPC</FormLabel>
                          <FormControl>
                            <Input placeholder="UPC Code" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-12">
                    <FormField
                      control={form.control}
                      name="total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? 1}
                              onChange={(e) => field.onChange(convertToNumber(e.target.value))}
                            />
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
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value)}
                            value={field.value ?? undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(TypeOfTuStreamsValues).map(([key, value]) => (
                                <SelectItem key={key} value={key}>
                                  {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
              <Button className="w-full" size="lg" variant="secondary">
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
