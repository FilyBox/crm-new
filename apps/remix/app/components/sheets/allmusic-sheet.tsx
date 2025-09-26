import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import { es } from 'date-fns/locale';
import { Trash2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import type { TAllMusic } from '@documenso/lib/types/allMusic';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form';
import { Input } from '@documenso/ui/primitives/input';
import { ScrollArea } from '@documenso/ui/primitives/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@documenso/ui/primitives/sheet';

import { useAllMusic } from '~/hooks/use-allmusic';
import { useAllMusicLinksStore } from '~/storage/store-allmusic-links';

import LinksAdd from '../general/links-add';

type ArtistData = {
  id: number;
  name: string;
}[];

type AgregadoraData = {
  id: number;
  name: string;
}[];

type RecordLabelData = {
  id: number;
  name: string;
}[];

interface AllMusicDialogProps {
  record: TAllMusic | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (record: TAllMusic) => void;
  onDelete: (recordId: number) => void;
  artistData?: ArtistData;
  agregadoraData?: AgregadoraData;
  recordLabelData?: RecordLabelData;
}

export function AllMusicDialog({
  record,
  isOpen,
  onClose,
  artistData,
  agregadoraData,
  recordLabelData,
}: AllMusicDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const { t, i18n } = useLingui();
  const currentLanguage = i18n.locale;
  const [selectedArtists, setSelectedArtists] = useState<string[] | undefined>([]);
  const [fullSelectedArtists, setFullSelectedArtists] = useState<ArtistData>([]);
  const [selectedAgregadora, setSelectedAgregadora] = useState<
    { id: number; name: string } | undefined
  >(undefined);
  const [selectedRecordLabel, setSelectedRecordLabel] = useState<
    { id: number; name: string } | undefined
  >(undefined);
  const { setInitialVideoLinks, setInitialGeneralLinks, resetStore } = useAllMusicLinksStore();

  // Add the custom hook
  const { handleCreate, handleUpdate, handleDelete, isCreating, isUpdating, isDeleting } =
    useAllMusic();

  const isPending = isCreating || isUpdating || isDeleting;

  const formSchema = z.object({
    title: z.string().min(1, { message: t`Title cannot be empty` }),
    isrcVideo: z.string().optional(),
    isrcSong: z.string().optional(),
    UPC: z.string().optional(),
    publishedAt: z.date().optional(),
    catalog: z.string().optional(),
    agregadoraId: z.string().optional(),
    recordLabelId: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      isrcVideo: '',
      isrcSong: '',
      UPC: '',
      publishedAt: undefined,
      catalog: '',
      agregadoraId: '',
      recordLabelId: '',
    },
  });

  useEffect(() => {
    if (record) {
      // Set artists
      if (record.artists) {
        setSelectedArtists(record.artists.map((artist) => artist.id.toString()));
        setFullSelectedArtists(record.artists);
      }

      // Set agregadora
      if (record.agregadora) {
        setSelectedAgregadora(record.agregadora);
      }

      // Set record label
      if (record.recordLabel) {
        setSelectedRecordLabel(record.recordLabel);
      }

      // Set links
      if (record.videoLinks) {
        setInitialVideoLinks(
          record.videoLinks.map((link) => ({
            id: link.id.toString(),
            name: link.name,
            url: link.url,
            isrcVideo: link.isrcVideo,
            publishedAt: link.publishedAt,
            lyrics: link.lyrics,
            modified: false,
            deleted: false,
          })),
        );
      }

      if (record.generalLinks) {
        setInitialGeneralLinks(
          record.generalLinks.map((link) => ({
            id: link.id.toString(),
            name: link.name,
            url: link.url,
          })),
        );
      }

      form.reset({
        title: record.title || '',
        isrcVideo: record.isrcVideo || '',
        isrcSong: record.isrcSong || '',
        UPC: record.UPC || '',
        publishedAt: record.publishedAt || undefined,
        catalog: record.catalog || '',
        agregadoraId: record.agregadora?.id.toString() || '',
        recordLabelId: record.recordLabel?.id.toString() || '',
      });
      setError(null);
    } else {
      // Reset for new record
      setSelectedArtists([]);
      setFullSelectedArtists([]);
      setSelectedAgregadora(undefined);
      setSelectedRecordLabel(undefined);
      resetStore();
      form.reset({
        title: '',
        isrcVideo: '',
        isrcSong: '',
        UPC: '',
        publishedAt: undefined,
        catalog: '',
        agregadoraId: '',
        recordLabelId: '',
      });
    }
  }, [record, form, setInitialVideoLinks, setInitialGeneralLinks, resetStore]);

  const handleSave = async (values: z.infer<typeof formSchema>) => {
    try {
      const recordData: Omit<TAllMusic, 'id' | 'createdAt' | 'updatedAt' | 'recordLabelId'> & {
        id: number | undefined;
      } = {
        id: record?.id,
        title: values.title.trim(),
        isrcVideo: values.isrcVideo || null,
        isrcSong: values.isrcSong || null,
        UPC: values.UPC || null,
        publishedAt: values.publishedAt || null,
        catalog: values.catalog || null,
        artists: fullSelectedArtists,
        agregadora: selectedAgregadora,
        agregadoraPercentage: record?.agregadoraPercentage ?? null,
        distribuidorPercentage: record?.distribuidorPercentage ?? null,
        recordLabel: selectedRecordLabel,
        // artists: selectedArtists,
        // agregadoraId: values.agregadoraId ? parseInt(values.agregadoraId) : undefined,
        // videoLinks: videoLinks.filter(link => !link.deleted),
        // generalLinks: generalLinks.filter(link => !link.deleted),
      };

      if (recordData.id) {
        await handleUpdate(recordData as TAllMusic);
      } else {
        await handleCreate(recordData);
      }

      onClose();
    } catch (error) {
      setError('Error saving record');
      toast.error('Error saving record');
    }
  };

  const handleDeleteRecord = async () => {
    if (!record) return;

    try {
      await handleDelete(record.id);
      onClose();
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full max-w-2xl flex-col text-start sm:max-w-2xl">
        <SheetHeader className="items-start justify-start text-start">
          <SheetTitle className="flex items-center gap-2 text-start">
            {record ? t`Edit Record` : t`Add Record`}
          </SheetTitle>
          <SheetDescription className="w-full items-start justify-start !text-start">
            {record
              ? t`Update the record details below.`
              : t`Fill in the details to create a new record.`}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            aria-disabled={isPending}
            onSubmit={form.handleSubmit(handleSave)}
            className="flex flex-1 flex-col justify-between"
          >
            <ScrollArea className={` ${record ? 'h-[60cqh]' : 'h-[70cqh]'} w-full sm:h-[75cqh]`}>
              <div className="flex-1 space-y-4 overflow-y-auto px-1">
                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {error}
                  </div>
                )}

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Title</Trans> *
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* ISRC Song */}
                  <FormField
                    control={form.control}
                    name="isrcSong"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Trans>ISRC</Trans>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="USRC17607838" className="w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* UPC */}
                  <FormField
                    control={form.control}
                    name="UPC"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Trans>UPC</Trans>
                        </FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456789012" className="w-full" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Catalog */}
                <FormField
                  control={form.control}
                  name="catalog"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Catalog number</Trans>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="w-full" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Published Date */}
                <FormField
                  control={form.control}
                  name="publishedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Published Date</Trans>
                      </FormLabel>

                      <FormControl>
                        <DateTimePicker
                          locale={es}
                          placeholder={t`Pick a date...`}
                          granularity="day"
                          value={field.value}
                          onChange={(date) => field.onChange(date)}
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Artists Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    <Trans>Artists</Trans>
                  </label>
                  <Faceted
                    onValueChange={(value) => {
                      setSelectedArtists(value);
                      setFullSelectedArtists(
                        value && artistData
                          ? (artistData ?? []).filter((artist) =>
                              value.includes(artist.id.toString()),
                            )
                          : [],
                      );
                    }}
                    multiple={true}
                    modal={true}
                    value={selectedArtists}
                  >
                    <FacetedTrigger asChild className="w-full">
                      <Button
                        type="button"
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
                          placeholder={t`Select some artists...`}
                          className="h-fit"
                        />
                      </Button>
                    </FacetedTrigger>
                    <FacetedContent className="z-9999 h-fit w-full">
                      <FacetedInput placeholder={t`Search artists...`} />
                      <FacetedList className="h-fit">
                        <FacetedEmpty>
                          <Trans>No artists found.</Trans>
                        </FacetedEmpty>
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

                {/* Agregadora Selection */}
                <FormField
                  control={form.control}
                  name="agregadoraId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Agregator</Trans>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedAgregadora(
                            agregadoraData?.find((a) => a.id.toString() === value),
                          );
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t`Select an agregator`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {agregadoraData?.map((agregadora) => (
                            <SelectItem key={agregadora.id} value={agregadora.id.toString()}>
                              {agregadora.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Record Label Selection */}
                <FormField
                  control={form.control}
                  name="recordLabelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Record Label</Trans>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedRecordLabel(
                            recordLabelData?.find((a) => a.id.toString() === value),
                          );
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t`Select a record label`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recordLabelData?.map((label) => (
                            <SelectItem key={label.id} value={label.id.toString()}>
                              {label.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Links Management */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">
                    <Trans>Links</Trans>
                  </label>
                  <LinksAdd isLoading={false} editar={!!record} />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                disabled={isPending}
                loading={isCreating || isUpdating}
                type="submit"
                className="w-full sm:w-auto"
              >
                {record ? t`Update Record` : t`Create Record`}
              </Button>

              {record && (
                <Button
                  disabled={isPending}
                  loading={isDeleting}
                  type="button"
                  variant="destructive"
                  onClick={() => void handleDeleteRecord()}
                  className="w-full sm:w-auto"
                >
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  <Trans>Delete</Trans>
                </Button>
              )}

              <Button
                disabled={isPending}
                type="button"
                variant="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                <Trans>Cancel</Trans>
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
