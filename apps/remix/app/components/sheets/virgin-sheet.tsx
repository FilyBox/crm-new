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
import { type TLpm } from '@documenso/lib/types/lpm';
import { Button } from '@documenso/ui/primitives/button';
import { DateTimePicker } from '@documenso/ui/primitives/datetime-picker';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form';
import { Input } from '@documenso/ui/primitives/input';
import { Progress } from '@documenso/ui/primitives/progress';
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@documenso/ui/primitives/sheet';
import { Textarea } from '@documenso/ui/primitives/textarea';

type artistData = {
  id: number;
  name: string;
}[];

interface MyFormProps {
  artistData?: artistData;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
  onSubmit: (data: TLpm) => void;
  initialData: TLpm | null;
  setInitialData: (data: TLpm | null) => void;
  isSubmitting: boolean;
}

const formSchema = z.object({
  productId: z.string().optional(),
  productType: z.string().optional(),
  productTitle: z.string().optional(),
  productVersion: z.string().optional(),
  productDisplayArtist: z.string().optional(),
  parentLabel: z.string().optional(),
  label: z.string().optional(),
  originalReleaseDate: z.date().optional(),
  releaseDate: z.date().optional(),
  upc: z.string().optional(),
  catalog: z.string().optional(),
  productPriceTier: z.string().optional(),
  productGenre: z.array(z.string()).default([]),
  submissionStatus: z.string().optional(),
  productCLine: z.string().optional(),
  productPLine: z.string().optional(),
  preOrderDate: z.date().optional(),
  exclusives: z.string().optional(),
  explicitLyrics: z.string().optional(),
  productPlayLink: z.string().optional(),
  linerNotes: z.string().optional(),
  primaryMetadataLanguage: z.string().optional(),
  compilation: z.string().optional(),
  pdfBooklet: z.string().optional(),
  timedReleaseDate: z.date().optional(),
  timedReleaseMusicServices: z.date().optional(),
  lastProcessDate: z.date().optional(),
  importDate: z.date().optional(),
  createdBy: z.string().optional(),
  lastModified: z.date().optional(),
  submittedAt: z.date().optional(),
  submittedBy: z.string().optional(),
  vevoChannel: z.string().optional(),
  trackType: z.string().optional(),
  trackId: z.string().optional(),
  trackVolume: z.string().optional(),
  trackNumber: z.string().optional(),
  trackName: z.string().optional(),
  trackVersion: z.string().optional(),
  trackDisplayArtist: z.string().optional(),
  isrc: z.string().optional(),
  trackPriceTier: z.string().optional(),
  trackGenre: z.array(z.string()).default([]),
  audioLanguage: z.string().optional(),
  trackCLine: z.string().optional(),
  trackPLine: z.string().optional(),
  writersComposers: z.string().optional(),
  publishersCollectionSocieties: z.string().optional(),
  withholdMechanicals: z.string().optional(),
  preOrderType: z.string().optional(),
  instantGratificationDate: z.date().optional(),
  duration: z.string().optional(),
  sampleStartTime: z.string().optional(),
  explicitLyricsTrack: z.string().optional(),
  albumOnly: z.string().optional(),
  lyrics: z.string().optional(),
  additionalContributorsPerforming: z.string().optional(),
  additionalContributorsNonPerforming: z.string().optional(),
  producers: z.string().optional(),
  continuousMix: z.string().optional(),
  continuouslyMixedIndividualSong: z.string().optional(),
  trackPlayLink: z.string().optional(),
});

type FormStep = 'PRODUCT_INFO' | 'TRACK_INFO';

export const VirginSheet = ({
  onSubmit,
  initialData,
  artistData,
  isDialogOpen,
  setInitialData,
  setIsDialogOpen,
}: MyFormProps) => {
  const { _ } = useLingui();

  const [step, setStep] = useState<FormStep>('PRODUCT_INFO');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<string[] | undefined>([]);

  const { user } = useSession();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      submissionStatus: 'Draft',
      explicitLyrics: 'No',
      explicitLyricsTrack: 'No',
      albumOnly: 'No',
      trackVolume: '',
      withholdMechanicals: 'No',
      continuousMix: 'No',
      continuouslyMixedIndividualSong: 'No',
      productGenre: [],
      productVersion: '',
      parentLabel: '',
      originalReleaseDate: new Date(),
      productPriceTier: '',
      preOrderDate: new Date(),
      exclusives: '',
      productPlayLink: '',
      linerNotes: '',
      compilation: '',
      pdfBooklet: '',
      timedReleaseDate: new Date(),
      timedReleaseMusicServices: new Date(),
      submittedBy: '',
      vevoChannel: '',
      trackVersion: '',
      trackPriceTier: '',
      sampleStartTime: '',
      lyrics: '',
      additionalContributorsPerforming: '',
      additionalContributorsNonPerforming: '',
      producers: '',
      trackPlayLink: '',
      preOrderType: '',
      instantGratificationDate: new Date(),
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        if (key !== 'id') {
          // @ts-expect-error - We know these fields exist in our form schema
          form.setValue(key, initialData[key]);
          if (key === 'productDisplayArtist') {
            const artistsData =
              initialData.productDisplayArtist?.map((artist) => artist.id.toString()) || [];
            setSelectedArtists(artistsData);
          }

          if (initialData?.productGenre) {
            const genres =
              typeof initialData.productGenre === 'string'
                ? initialData.productGenre.split(',')
                : initialData.productGenre;
            form.setValue('productGenre', genres);
          }
          if (initialData?.trackGenre) {
            const trackGenres =
              typeof initialData.trackGenre === 'string'
                ? initialData.trackGenre.split(',')
                : initialData.trackGenre;
            form.setValue('trackGenre', trackGenres);
          }
        }
      });
    } else {
      form.reset();
      setSelectedArtists([]);
      setStep('PRODUCT_INFO');
    }
  }, [initialData]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const dataToSubmit = initialData?.id ? { ...values, id: initialData.id } : values;
      const dataToSend = {
        ...dataToSubmit,
        productGenre: Array.isArray(dataToSubmit.productGenre)
          ? dataToSubmit.productGenre.join(',')
          : dataToSubmit.productGenre,
        artistsToUpdate: selectedArtists,
        productDisplayArtist: initialData?.productDisplayArtist,
      };
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      await onSubmit(dataToSend as unknown as TLpm);
      console.log('Form submitted successfully', values);
    } catch (error) {
      console.error('Form submission error', error);
      toast.error('Error submitting data');
    } finally {
      setIsLoading(false);
    }
  }

  const onNextClick = () => {
    setStep('TRACK_INFO');
  };

  const yesNoOptions = [
    { label: 'Sí', value: 'Yes' },
    { label: 'No', value: 'No' },
  ];

  const genreOptions = [
    { label: 'Rock', value: 'Rock' },
    { label: 'Latin', value: 'Latin' },
    { label: 'Latin Pop', value: 'Latin Pop' },
    { label: 'Rap', value: 'Rap' },

    { label: 'Regional Mexican', value: 'Regional Mexican' },
    { label: 'Soundtrack', value: 'Soundtrack' },
    { label: 'Pop', value: 'Pop' },
    { label: 'Hip Hop', value: 'Hip Hop' },
    { label: 'Electrónica', value: 'Electronic' },
    { label: 'Clásica', value: 'Classical' },
    { label: 'Jazz', value: 'Jazz' },
    { label: 'R&B', value: 'R&B' },
  ];

  const languageOptions = [
    { label: 'Español', value: 'Spanish' },
    { label: 'Español Latino America', value: 'Spanish (Latin America)' },

    { label: 'Inglés', value: 'English' },
    { label: 'Francés', value: 'French' },
    { label: 'Alemán', value: 'German' },
    { label: 'Japonés', value: 'Japanese' },
    { label: 'Portugués', value: 'Portuguese' },
  ];

  const productTypeOptions = [
    { label: 'Álbum', value: 'Album' },
    { label: 'Single', value: 'Single' },
    { label: 'EP', value: 'EP' },
    { label: 'Music Video', value: 'Music Video' },
    { label: 'Audio', value: 'Audio' },
  ];

  const trackTypeOptions = [
    { label: 'Audio', value: 'Audio' },
    { label: 'Video', value: 'Video' },
    { label: 'Remix', value: 'Remix' },
    { label: 'Acústico', value: 'Acoustic' },
    { label: 'AudioTrack', value: 'AudioTrack' },
  ];

  const statusOptions = [
    { label: 'Borrador', value: 'Draft' },
    { label: 'Pendiente', value: 'Pending' },
    { label: 'Enviado', value: 'Submitted' },
    { label: 'Released', value: 'Released' },
    { label: 'Borrado', value: 'Deleted' },
    { label: 'Aprobado', value: 'Approved' },
    { label: 'Rechazado', value: 'Rejected' },
  ];

  return (
    <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <SheetTrigger asChild>
        <Button
          onClick={() => setInitialData(null)}
          className="w-full sm:w-fit"
          disabled={!user.emailVerified}
        >
          <FilePlus className="-ml-1 mr-2 h-4 w-4" />
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
              <Trans>
                {initialData ? _(msg`Update Virgin Record`) : _(msg`Add Virgin Record`)}
              </Trans>
            </SheetTitle>
            <SheetDescription>
              {initialData
                ? _(msg`Update your Virgin record details.`)
                : _(msg`Create a new Virgin record with details.`)}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[58cqh] w-full sm:h-[72cqh]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="p-1">
                {/* Paso 1: Información del Producto */}
                {step === 'PRODUCT_INFO' && (
                  <fieldset disabled={isSubmitting} className="space-y-6">
                    {/* Sección 1: Información básica del producto */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="productId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID del Producto</FormLabel>
                              <FormControl>
                                <Input placeholder="PRD123456" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="productType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Producto</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo de producto" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {productTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                          name="productTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del álbum o single" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="productVersion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Versión del Producto (Opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Deluxe Edition, Remastered, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* <div className="col-span-12 md:col-span-6">
                                    <FormField
                                      control={form.control}
                                      name="productDisplayArtist"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Artista Principal</FormLabel>
                                          <FormControl>
                                            <Input placeholder="Nombre del artista" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div> */}
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
                        <FormField
                          control={form.control}
                          name="releaseDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Release Date</FormLabel>
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
                    </div>

                    <Separator />

                    {/* Sección 2: Información de sello y comercial */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="label"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sello Discográfico</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del sello" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="originalReleaseDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Original Release Date</FormLabel>
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
                          name="parentLabel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sello Principal (Opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Sello matriz" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="upc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>UPC (Código Universal de Producto)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: 884977968484" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="catalog"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Catálogo</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: ABC-123456" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="productPriceTier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Price Tier (Opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Standard, Budget, Premium" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="productGenre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Género Musical</FormLabel>

                              <Faceted
                                modal={true}
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
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
                                      options={genreOptions?.map((genre) => ({
                                        label: genre.label,
                                        value: genre.value,
                                      }))}
                                      placeholder={_(msg`Select some genres...`)}
                                      className="h-fit"
                                    />
                                  </Button>
                                </FacetedTrigger>
                                <FacetedContent className="z-9999 h-fit w-full origin-[var(--radix-popover-content-transform-origin)]">
                                  <FacetedInput
                                    aria-label={_(msg`Search genre`)}
                                    placeholder={_(msg`Search for genre...`)}
                                  />
                                  <FacetedList className="h-fit">
                                    <FacetedEmpty>{_(msg`No options found.`)}</FacetedEmpty>
                                    <FacetedGroup>
                                      {genreOptions?.map((option) => (
                                        <FacetedItem key={option.label} value={option.value}>
                                          <span>{option.label}</span>
                                        </FacetedItem>
                                      ))}
                                    </FacetedGroup>
                                  </FacetedList>
                                </FacetedContent>
                              </Faceted>

                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Sección 3: Información adicional y derechos */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="productCLine"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Copyright (℗)</FormLabel>
                              <FormControl>
                                <Input placeholder="℗ 2025 Sello Discográfico" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="productPLine"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Publishing (©)</FormLabel>
                              <FormControl>
                                <Input placeholder="© 2025 Editora Musical" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="preOrderDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fecha de Pre-Orden</FormLabel>
                              <FormControl>
                                <DateTimePicker
                                  locale={es}
                                  hourCycle={12}
                                  value={field.value}
                                  onChange={(date) => field.onChange(date)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12">
                        <FormField
                          control={form.control}
                          name="exclusives"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Exclusivas</FormLabel>
                              <FormControl>
                                <Input placeholder="Exclusivas" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="primaryMetadataLanguage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Idioma Principal de Metadatos</FormLabel>

                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona idioma" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {languageOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                          name="explicitLyrics"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Explicit Lyrics</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una opción" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {yesNoOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                          name="trackVolume"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Track Volume</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una opción" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {yesNoOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="productPlayLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Play Link (URL)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enlace de Reproducción" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="compilation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compilación</FormLabel>
                            <FormControl>
                              <Input placeholder="Compilation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="pdfBooklet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PDF Booklet</FormLabel>
                            <FormControl>
                              <Input placeholder="PDF Booklet" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="timedReleaseDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Timed Release Date</FormLabel>

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
                        name="timedReleaseMusicServices"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Timed Release MusicServices</FormLabel>

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

                    <div className="col-span-12">
                      <FormField
                        disabled={isLoading}
                        control={form.control}
                        name="linerNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinerNotes</FormLabel>
                            <FormControl>
                              <Textarea placeholder="LinerNotes" className="min-h-32" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Sección 4: Información de estado y sistema */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="submissionStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estado de Envío</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona estado" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {statusOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                          name="lastProcessDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Process Date</FormLabel>
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
                          name="importDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ImportDate</FormLabel>
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
                          name="createdBy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Creado Por</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="submittedBy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subido por</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="vevoChannel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>vevoChannel(URL)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="lastModified"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>lastModified</FormLabel>
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
                          name="submittedAt"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>submittedAt</FormLabel>
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
                    </div>
                  </fieldset>
                )}

                {/* Paso 2: Información de la Pista */}
                {step === 'TRACK_INFO' && (
                  <fieldset disabled={isSubmitting} className="space-y-6">
                    {/* Sección 1: Información básica de pista */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="trackId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID de Pista</FormLabel>
                              <FormControl>
                                <Input placeholder="TRK123456" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="trackType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Pista</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo de pista" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {trackTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                          name="trackName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre de la Pista</FormLabel>
                              <FormControl>
                                <Input placeholder="Título de la canción" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="trackNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Pista</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="trackDisplayArtist"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Artista de la Pista</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nombre del artista para esta pista"
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
                          disabled={isLoading}
                          control={form.control}
                          name="trackVersion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Versión de la Pista (Opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Remix, Live, Acoustic, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="isrc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ISRC</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: USABC1234567" {...field} />
                              </FormControl>
                              <FormDescription>
                                Código Internacional Estándar de Grabación
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="trackPriceTier"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Track Price Tier</FormLabel>
                              <FormControl>
                                <Input placeholder="" {...field} />
                              </FormControl>
                              <FormDescription>Nivel de precio para la pista</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Sección 2: Información de derechos y comercial */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="trackCLine"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Copyright de Pista (℗)</FormLabel>
                              <FormControl>
                                <Input placeholder="℗ 2025 Sello Discográfico" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="trackPLine"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Publishing de Pista (©)</FormLabel>
                              <FormControl>
                                <Input placeholder="© 2025 Editora Musical" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="trackGenre"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Género de la Pista</FormLabel>
                              <Faceted
                                modal={true}
                                value={field.value}
                                onValueChange={field.onChange}
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
                                      options={genreOptions?.map((genre) => ({
                                        label: genre.label,
                                        value: genre.value,
                                      }))}
                                      placeholder={_(msg`Select some genres...`)}
                                      className="h-fit"
                                    />
                                  </Button>
                                </FacetedTrigger>
                                <FacetedContent className="z-9999 h-fit w-full origin-[var(--radix-popover-content-transform-origin)]">
                                  <FacetedInput
                                    aria-label={_(msg`Search genre`)}
                                    placeholder={_(msg`Search for genre...`)}
                                  />
                                  <FacetedList className="h-fit">
                                    <FacetedEmpty>{_(msg`No options found.`)}</FacetedEmpty>
                                    <FacetedGroup>
                                      {genreOptions?.map((option) => (
                                        <FacetedItem key={option.label} value={option.value}>
                                          <span>{option.label}</span>
                                        </FacetedItem>
                                      ))}
                                    </FacetedGroup>
                                  </FacetedList>
                                </FacetedContent>
                              </Faceted>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="audioLanguage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Idioma del Audio</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona idioma" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {languageOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                          disabled={isLoading}
                          control={form.control}
                          name="explicitLyricsTrack"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contenido Explícito en Pista</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una opción" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {yesNoOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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

                    {/* Sección 3: Información técnica */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duración</FormLabel>
                              <FormControl>
                                <Input placeholder="03:45" {...field} />
                              </FormControl>
                              <FormDescription>Formato mm:ss</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="sampleStartTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sample Start Time</FormLabel>
                              <FormControl>
                                <Input placeholder="03:45" {...field} />
                              </FormControl>
                              <FormDescription>Formato mm:ss</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="albumOnly"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>¿Solo en Álbum?</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una opción" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {yesNoOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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
                          disabled={isLoading}
                          control={form.control}
                          name="writersComposers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Compositores</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nombres de compositores separados por comas"
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
                          disabled={isLoading}
                          control={form.control}
                          name="publishersCollectionSocieties"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Editoras y Sociedades de Gestión</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Editoras y sociedades separadas por comas"
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
                          disabled={isLoading}
                          control={form.control}
                          name="withholdMechanicals"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>withholdMechanicals</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una opción" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {yesNoOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
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

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        disabled={isLoading}
                        control={form.control}
                        name="preOrderType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Pre-Orden</FormLabel>
                            <FormControl>
                              <Input placeholder="Tipo de Pre-Orden" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="instantGratificationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Gratificación Instantánea</FormLabel>
                            <FormControl>
                              <DateTimePicker
                                locale={es}
                                hourCycle={12}
                                value={field.value}
                                onChange={(date) => field.onChange(date)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* Sección 4: Información complementaria */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="lyrics"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Letras (Opcional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Letras de la canción"
                                  className="min-h-32"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="producers"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Productores (Opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Nombres de productores separados por comas"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="additionalContributorsPerforming"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Colaboradores Adicionales (Intérpretes) (Opcional)
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Músicos, vocalistas, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12">
                        <FormField
                          disabled={isLoading}
                          control={form.control}
                          name="additionalContributorsNonPerforming"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Colaboradores Adicionales (No Intérpretes) (Opcional)
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Músicos, vocalistas, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12">
                        <FormField
                          control={form.control}
                          name="trackPlayLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Track Play Link(URL)</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </fieldset>
                )}
              </form>
            </Form>
          </ScrollArea>
        </div>

        <section className="flex flex-col gap-5">
          {/* Indicador de Progreso */}
          <div className="flex items-center gap-3">
            <Progress className="h-1.5" value={step === 'PRODUCT_INFO' ? 50 : 100} />
          </div>

          <div className="flex w-full flex-col-reverse justify-end gap-2 sm:flex-row">
            {step !== 'PRODUCT_INFO' ? (
              <Button
                type="button"
                size="lg"
                variant="secondary"
                className="flex-1"
                disabled={isLoading}
                onClick={() => setStep('PRODUCT_INFO')}
              >
                Volver
              </Button>
            ) : (
              <SheetClose asChild>
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </SheetClose>
            )}
            {step === 'PRODUCT_INFO' && (
              <Button
                type="button"
                size="lg"
                className="flex-1 disabled:cursor-not-allowed"
                loading={isLoading}
                onClick={onNextClick}
              >
                Siguiente
              </Button>
            )}

            {step === 'TRACK_INFO' && (
              <>
                <Button
                  disabled={isLoading}
                  loading={isLoading}
                  type="button"
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    const values = form.getValues();
                    void handleSubmit(values);
                  }}
                >
                  Completar
                </Button>
              </>
            )}
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
};
