import { useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { isValid, parse } from 'date-fns';
import { toast } from 'sonner';

import { parseCsvFile } from '@documenso/lib/utils/csvParser';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import { Popover, PopoverContent, PopoverTrigger } from '@documenso/ui/primitives/popover';

import CsvUploadInputWithLabel from '~/components/general/csv-input-with-label';
import { useCsvFilesStore } from '~/storage/store-csv';

interface CsvImportManagerProps {
  onImportComplete?: () => void;
}

export function CsvImportManager({ onImportComplete }: CsvImportManagerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clearCsvFiles, csvFiles } = useCsvFilesStore();
  const { _ } = useLingui();

  const createManyAllMusicMutation = trpc.allMusic.createManyAllMusic.useMutation({
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const convertDateFormat = (dateString: string): Date | undefined => {
    if (!dateString || dateString.trim() === '') return undefined;

    try {
      const trimmedDate = dateString.trim();

      // Detectar formato DD/MM/YYYY o DD/M/YYYY o D/M/YYYY
      const datePattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = trimmedDate.match(datePattern);

      if (match) {
        // Usar parse de date-fns para manejar el formato DD/MM/YYYY explícitamente
        const parsedDate = parse(trimmedDate, 'd/M/yyyy', new Date());

        if (!isValid(parsedDate)) return undefined;

        return new Date(parsedDate.toISOString());
      }

      // Fallback para otros formatos
      const date = new Date(trimmedDate);

      if (!isValid(date)) return undefined;

      return new Date(date.toISOString());
    } catch (error) {
      console.warn(`Error converting date: ${dateString}`, error);
      return undefined;
    }
  };

  const handleVirginCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);

      const validatedData = csvData.map((item) => ({
        productId: item['productId'] || '',
        productType: item['productType'] || '',
        productTitle: item['productTitle'] || '',
        productVersion: item['productVersion'] || undefined,
        productDisplayArtist: item['productDisplayArtist'] || '',
        parentLabel: item['parentLabel'] || undefined,
        label: item['label'] || '',
        originalReleaseDate: convertDateFormat(item['originalReleaseDate']) || new Date(),
        releaseDate: convertDateFormat(item['releaseDate']) || new Date(),
        upc: item['upc'] || '',
        catalog: item['catalog'] || '',
        productPriceTier: item['productPriceTier'] || undefined,
        productGenre: item['productGenre'] || '',
        submissionStatus: item['submissionStatus'] || '',
        productCLine: item['productCLine'] || '',
        productPLine: item['productPLine'] || '',
        preOrderDate: convertDateFormat(item['preOrderDate']),
        exclusives: item['exclusives'] || undefined,
        explicitLyrics: item['explicitLyrics'] || '',
        productPlayLink: item['productPlayLink'] || undefined,
        linerNotes: item['linerNotes'] || undefined,
        primaryMetadataLanguage: item['primaryMetadataLanguage'] || '',
        compilation: item['compilation'] || undefined,
        pdfBooklet: item['pdfBooklet'] || undefined,
        timedReleaseDate: convertDateFormat(item['timedReleaseDate']),
        timedReleaseMusicServices:
          convertDateFormat(item['timedReleaseMusicServices']) || undefined,
        lastProcessDate: convertDateFormat(item['lastProcessDate']) || new Date(),
        importDate: convertDateFormat(item['importDate']) || new Date(),

        // Campos administrativos
        createdBy: item['createdBy'] || 'system',
        lastModified: convertDateFormat(item['lastModified']) || new Date(),
        submittedAt: convertDateFormat(item['submittedAt']) || new Date(),
        submittedBy: item['submittedBy'] || undefined,
        vevoChannel: item['vevoChannel'] || undefined,

        // Campos de pistas
        trackType: item['trackType'] || 'default',
        trackId: item['trackId'] || '',
        trackVolume: item['trackVolume'] === '1' ? true : undefined,
        trackNumber: item['trackNumber'] || '',
        trackName: item['trackName'] || '',
        trackVersion: item['trackVersion'] || undefined,
        trackDisplayArtist: item['trackDisplayArtist'] || '',
        isrc: item['isrc'] || '',
        trackPriceTier: item['trackPriceTier'] || undefined,
        trackGenre: item['trackGenre'] || '',
        audioLanguage: item['audioLanguage'] || '',
        trackCLine: item['trackCLine'] || '',
        trackPLine: item['trackPLine'] || '',
        writersComposers: item['writersComposers'] || '',
        publishersCollectionSocieties: item['publishersCollectionSocieties'] || '',
        withholdMechanicals: item['withholdMechanicals'] || '',
        preOrderType: item['preOrderType'] || undefined,
        instantGratificationDate: convertDateFormat(item['instantGratificationDate']) || new Date(),
        duration: item['duration'] || '',
        sampleStartTime: item['sampleStartTime'] || '',
        explicitLyricsTrack: item['explicitLyricsTrack'] || '',
        albumOnly: item['albumOnly'] || '',
        lyrics: item['lyrics'] || undefined,
        additionalContributorsPerforming: item['additionalContributorsPerforming'] || undefined,
        additionalContributorsNonPerforming:
          item['additionalContributorsNonPerforming'] || undefined,
        producers: item['producers'] || '',
        continuousMix: item['continuousMix'] || '',
        continuouslyMixedIndividualSong: item['continuouslyMixedIndividualSong'] || '',
        trackPlayLink: item['trackPlayLink'] || '',
        license: item['license'] || '',
      }));

      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      const manyData = filteredData.map((item) => ({
        title: item.productTitle,
        catalog: item.catalog,
        UPC: item.upc,
        artists: item.productDisplayArtist,
        publishedAt: item.originalReleaseDate,
        generalLinks: item.trackPlayLink,
        recordLabel: item.label,
      }));

      void clearCsvFiles();

      toast.promise(
        createManyAllMusicMutation.mutateAsync({
          allMusic: manyData,
          agregadora: 'Virgin',
        }),
        {
          loading: _(msg`Processing file...`),
          success: (data: number) => {
            return _(msg`A total of ${data} records created successfully`);
          },
          error: () => {
            return _(msg`Error processing file`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        },
      );

      onImportComplete?.();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    }
  };

  const handleAnywhereCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);

      const validatedData = csvData.map((item) => ({
        title: item['titulo'] || '',
        artists: item['artistas'] || '',
        label: item['disquera'] || '',
        isrcSong: item['isrc'] || '',
        UPC: item['upc'] || '',
        publishedAt: convertDateFormat(item['fechalanzamiento']) || undefined,
        catalog: item['catalogo'] || '',
      }));

      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      void clearCsvFiles();

      toast.promise(
        createManyAllMusicMutation.mutateAsync({
          allMusic: filteredData,
          agregadora: 'No definida',
        }),
        {
          loading: _(msg`Processing file...`),
          success: (data: number) => {
            return _(msg`A total of ${data} records created successfully`);
          },
          error: () => {
            return _(msg`Error processing file`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        },
      );

      onImportComplete?.();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    }
  };

  const handleAdaCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);

      const validatedData = csvData.map((item) => ({
        title: item['proyecto'] || '',
        artists: item['nombreDistribucion'] || '',
        label: item['marketingOwner'] || '',
        isrc: item['isrc'] || '',
        catalog: item['numeroDeCatalogo'] || '',
      }));

      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      const manyData = filteredData.map((item) => ({
        title: item.title,
        catalog: item.catalog,
        artists: item.artists,
        recordLabel: item.label,
        isrcSong: item.isrc,
      }));

      void clearCsvFiles();

      toast.promise(
        createManyAllMusicMutation.mutateAsync({
          allMusic: manyData,
          agregadora: 'Ada',
        }),
        {
          loading: _(msg`Processing file...`),
          success: (data: number) => {
            return _(msg`A total of ${data} records created successfully`);
          },
          error: () => {
            return _(msg`Error processing file`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        },
      );

      onImportComplete?.();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    }
  };

  const handleTuStreamCsvUpload = async (file: File) => {
    if (!file) return;
    setIsSubmitting(true);
    try {
      const csvData = await parseCsvFile(file);
      const validatedData = csvData.map((item) => ({
        title: item['title'] || '',
        upc: item['UPC'] || '',
        artists: item['artists'] || '',
      }));

      // Filtrar cualquier objeto que esté completamente vacío (por si hay filas vacías en el CSV)
      const filteredData = validatedData.filter((item) =>
        Object.values(item).some((value) => value !== ''),
      );

      const manyData = filteredData.map((item) => ({
        title: item.title,
        UPC: item.upc,
        artists: item.artists,
      }));

      void clearCsvFiles();

      toast.promise(
        createManyAllMusicMutation.mutateAsync({
          allMusic: manyData,
          agregadora: 'TuStreams',
        }),
        {
          loading: _(msg`Processing file...`),
          success: (data: number) => {
            return _(msg`A total of ${data} records created successfully`);
          },
          error: () => {
            return _(msg`Error processing file`);
          },
          position: 'bottom-center',
          className: 'mb-16',
        },
      );

      onImportComplete?.();
    } catch (error) {
      console.error('Error al procesar el CSV:', error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          <Trans>Import</Trans>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={
          csvFiles.length < 0 ? 'dark:bg-backgroundDark w-52' : 'dark:bg-backgroundDark w-fit'
        }
      >
        <div className="flex flex-col gap-2">
          <CsvUploadInputWithLabel
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleVirginCsvUpload}
            multiple={false}
            label="Virgin"
          />
          <CsvUploadInputWithLabel
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleTuStreamCsvUpload}
            multiple={false}
            label="TuStream"
          />
          <CsvUploadInputWithLabel
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleAdaCsvUpload}
            multiple={false}
            label="Ada"
          />
          <CsvUploadInputWithLabel
            isSubmitting={isSubmitting}
            uploadFilesVoid={handleAnywhereCsvUpload}
            multiple={false}
            label="No definida"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
