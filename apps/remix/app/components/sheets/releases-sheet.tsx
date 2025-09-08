import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Release, TypeOfRelease } from '@prisma/client';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { type TRelease } from '@documenso/lib/types/release';
import { Button } from '@documenso/ui/primitives/button';
// import { Calendar } from '@documenso/ui/primitives/calendar';
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
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Separator } from '@documenso/ui/primitives/separator';
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
import { Switch } from '@documenso/ui/primitives/switch';

const TypeOfReleaseValues = {
  ALBUM: 'Album',
  EP: 'EP',
  SINGLE: 'Sencillo',
  // ...(typeof TypeOfRelease === 'object' ? TypeOfRelease : {}),
};

const ReleaseValues = {
  FOCUS: 'Focus',
  SOFT: 'Soft',
  // ...(typeof Release === 'object' ? Release : {}),
};

type artistData = {
  id: number;
  name: string;
}[];

interface MyFormProps {
  onSubmit: (data: TRelease) => void;
  initialData?: TRelease | null;
  isDialogOpen: boolean;
  artistData?: artistData;
  isSubmitting: boolean;

  setIsDialogOpen: (isOpen: boolean) => void;
  setInitialData: (data: TRelease | null) => void;
}

export default function ReleasesSheet({
  onSubmit,
  initialData,
  artistData,
  isSubmitting,
  isDialogOpen,
  setIsDialogOpen,
  setInitialData,
}: MyFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<string[] | undefined>([]);

  const { _ } = useLingui();
  const formSchema = z.object({
    date: z.date().optional(),
    artist: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === null ? '' : val)),
    lanzamiento: z.string().min(1, { message: 'Release title cannot be empty' }),
    typeOfRelease: z.nativeEnum(TypeOfRelease).optional(),
    release: z.nativeEnum(Release).optional(),
    uploaded: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === null ? '' : val)),
    streamingLink: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val === null ? '' : val)),
    assets: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    canvas: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    cover: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    audioWAV: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    video: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    banners: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    pitch: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    EPKUpdates: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    WebSiteUpdates: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
    Biography: z
      .boolean()
      .optional()
      .nullable()
      .transform((val) => (val === null ? false : val)),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      artist: '',
      lanzamiento: '',
      typeOfRelease: undefined,
      release: undefined,
      uploaded: '',
      streamingLink: '',
      assets: false,
      canvas: false,
      cover: false,
      audioWAV: false,
      video: false,
      banners: false,
      pitch: false,
      EPKUpdates: false,
      WebSiteUpdates: false,
      Biography: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        if (key !== 'id') {
          // Skip the id field
          // @ts-expect-error - We know these fields exist in our form schema

          form.setValue(key, initialData[key]);
          if (key === 'typeOfRelease' || key === 'release') {
            form.setValue(key, undefined);
          }
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

  // async function handleSubmit(values: z.infer<typeof formSchema>) {
  //   try {
  //     setIsLoading(true);
  //     const dataToSubmit = initialData?.id ? { ...values, id: initialData.id } : values;
  //     // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  //     await onSubmit(dataToSubmit as unknown as Releases);

  //     toast({
  //       description: 'Release submitted successfully',
  //     });
  //   } catch (error) {
  //     console.error('Form submission error', error);
  //     toast({
  //       variant: 'destructive',
  //       description: 'Error submitting release',
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const dataToSubmit = {
        ...values,
        date: values.date || new Date(),
        ...(initialData?.id && { id: initialData.id }),
        artistsToUpdate: selectedArtists,
        artists: initialData?.artists || [],
      };

      await onSubmit(dataToSubmit as unknown as TRelease);
    } catch (error) {
      throw new Error('Form submission error');
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
          <ScrollArea className="h-[75cqh] w-full">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="">
                <fieldset disabled={isLoading} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-12 gap-4">
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
                                              : format(date, 'dd/MM/yyyy');
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
                                        // Safely parse the date
                                        const date = field.value
                                          ? field.value instanceof Date
                                            ? field.value
                                            : new Date(field.value)
                                          : undefined;
                                        return date && !isNaN(date.getTime()) ? date : undefined;
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
                        name="lanzamiento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lanzamiento</FormLabel>
                            <FormControl>
                              <Input placeholder="Lanzamiento" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="typeOfRelease"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type of Release</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type of release" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(TypeOfReleaseValues).map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="release"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Release Type</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select release type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(ReleaseValues).map((release) => (
                                  <SelectItem key={release} value={release}>
                                    {release}
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

                  <Separator />

                  {/* Release Details */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="uploaded"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uploaded</FormLabel>
                            <FormControl>
                              <Input placeholder="Upload status" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="streamingLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Streaming Link</FormLabel>
                            <FormControl>
                              <Input placeholder="Link to streaming" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* <div className="col-span-12">
                      <FormField
                        control={form.control}
                        name="assets"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assets</FormLabel>
                            <FormControl>
                              <Input placeholder="Assets information" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div> */}
                  </div>

                  <Separator />

                  {/* Checkboxes Section */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="assets"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />

                              {/* <Switch checked={field.value} onCheckedChange={field.onChange} /> */}
                            </FormControl>
                            <FormLabel className="font-normal">Assets</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="canvas"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Canvas</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="cover"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Cover</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="audioWAV"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Audio WAV</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="video"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Video</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="banners"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Banners</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="pitch"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Pitch</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="EPKUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">EPK Updates</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="WebSiteUpdates"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Website Updates</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="Biography"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-2">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="font-normal">Biography</FormLabel>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </fieldset>
              </form>
            </Form>
          </ScrollArea>
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
