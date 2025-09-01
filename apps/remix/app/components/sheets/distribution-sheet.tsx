import { useEffect, useState } from 'react';
import React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { FilePlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { type TDistribution } from '@documenso/lib/types/distribution';
import { Button } from '@documenso/ui/primitives/button';
import { DialogClose } from '@documenso/ui/primitives/dialog';
import {
  Form,
  FormControl,
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';
import { Separator } from '@documenso/ui/primitives/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@documenso/ui/primitives/sheet';
import { useToast } from '@documenso/ui/primitives/use-toast';

const formSchema = z.object({
  // Territory and platform arrays
  territories: z
    .array(
      z.object({
        id: z.number(),
        name: z.string().nullable(),
      }),
    )
    .optional(),
  musicPlatform: z
    .array(
      z.object({
        id: z.number(),
        name: z.string().nullable(),
      }),
    )
    .optional(),

  // String fields
  marketingOwner: z.string().optional(),
  nombreDistribucion: z.string().optional(),
  proyecto: z.string().optional(),
  numeroDeCatalogo: z.string().optional(),
  upc: z.string().optional(),
  localProductNumber: z.string().optional(),
  isrc: z.string().optional(),
  tituloCatalogo: z.string().optional(),
  territorio: z.string().optional(),
  codigoDelTerritorio: z.string().optional(),
  nombreDelTerritorio: z.string().optional(),
  tipoDePrecio: z.string().optional(),
  tipoDeIngreso: z.string().optional(),

  // Numeric fields
  mesReportado: z.number().int().optional(),
  venta: z.number().optional(),
  rtl: z.number().optional(),
  ppd: z.number().optional(),
  rbp: z.number().optional(),
  tipoDeCambio: z.number().optional(),
  valorRecibido: z.number().optional(),
  regaliasArtisticas: z.number().optional(),
  costoDistribucion: z.number().optional(),
  copyright: z.number().optional(),
  cuotaAdministracion: z.number().optional(),
  costoCarga: z.number().optional(),
  otrosCostos: z.number().optional(),
  ingresosRecibidos: z.number().optional(),
});

type territoryData =
  | {
      name: string | null;
      id: number;
    }[]
  | undefined;

type platformData =
  | {
      name: string | null;
      id: number;
    }[]
  | undefined;

interface DistributionFormProps {
  onSubmit: (data: TDistribution) => void;
  initialData: TDistribution | null;
  isSubmitting: boolean;
  territoryData?: territoryData;
  platformData?: platformData;
  setInitialData: (data: TDistribution | null) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (isOpen: boolean) => void;
}

// Tipo para los pasos del formulario
type FormStep = 'BASIC_INFO' | 'FINANCIAL_INFO';

export default function DistributionSheet({
  onSubmit,
  initialData,
  isSubmitting,
  setInitialData,
  isDialogOpen,
  setIsDialogOpen,
  territoryData = [],
  platformData = [],
}: DistributionFormProps) {
  const { toast } = useToast();
  const { _ } = useLingui();

  const [step, setStep] = useState<FormStep>('BASIC_INFO');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = React.useState<{
    id: number;
    name: string | null;
  } | null>(null);
  const [selectedPlatform, setSelectedPlatform] = React.useState<{
    id: number;
    name: string | null;
  } | null>(null);

  useEffect(() => {
    if (
      initialData &&
      initialData.distributionStatementTerritories &&
      initialData.distributionStatementTerritories.length > 0
    ) {
      setSelectedTerritory(initialData.distributionStatementTerritories[0]);
    }
    if (
      initialData &&
      initialData.distributionStatementMusicPlatforms &&
      initialData.distributionStatementMusicPlatforms.length > 0
    ) {
      setSelectedPlatform(initialData.distributionStatementMusicPlatforms[0]);
    }
  }, [initialData]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      marketingOwner: '',
      nombreDistribucion: '',
      proyecto: '',
      numeroDeCatalogo: '',
      upc: '',
      localProductNumber: '',
      isrc: '',
      tituloCatalogo: '',
      territorio: '',
      codigoDelTerritorio: '',
      nombreDelTerritorio: '',
      tipoDePrecio: '',
      tipoDeIngreso: '',
      mesReportado: undefined,
      venta: undefined,
      rtl: undefined,
      ppd: undefined,
      rbp: undefined,
      tipoDeCambio: undefined,
      valorRecibido: undefined,
      regaliasArtisticas: undefined,
      costoDistribucion: undefined,
      copyright: undefined,
      cuotaAdministracion: undefined,
      costoCarga: undefined,
      otrosCostos: undefined,
      ingresosRecibidos: undefined,
      territories: [],
      musicPlatform: [],
    },
  });

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        if (key !== 'id') {
          // @ts-expect-error - We know these fields exist in our form schema
          form.setValue(key, initialData[key]);
        }
      });

      // Set territories and platforms if they exist
      if (
        initialData.distributionStatementTerritories &&
        initialData.distributionStatementTerritories.length > 0
      ) {
        setSelectedTerritory(initialData.distributionStatementTerritories[0]);
        form.setValue('territories', [initialData.distributionStatementTerritories[0]]);
      }

      if (
        initialData.distributionStatementMusicPlatforms &&
        initialData.distributionStatementMusicPlatforms.length > 0
      ) {
        setSelectedPlatform(initialData.distributionStatementMusicPlatforms[0]);
        form.setValue('musicPlatform', [initialData.distributionStatementMusicPlatforms[0]]);
      }
    }
  }, [form, initialData]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const dataToSubmit = initialData?.id ? { ...values, id: initialData.id } : values;
      console.log('Form submitted:', dataToSubmit);
      const dataToSend = {
        ...dataToSubmit,
        distributionStatementTerritories: selectedTerritory ? [selectedTerritory] : [],
        distributionStatementMusicPlatforms: selectedPlatform ? [selectedPlatform] : [],
      };

      console.log('Data to send:', dataToSend);
      await onSubmit(dataToSend as TDistribution);
      console.log('Form submitted successfully', values);
      toast({
        description: 'Data submitted successfully',
      });
    } catch (error) {
      console.error('Form submission error', error);
      toast({
        variant: 'destructive',
        description: 'Error submitting data',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Función para validar los campos del paso 1 y avanzar al paso 2
  const onNextClick = async () => {
    const basicFields = [
      'marketingOwner',
      'nombreDistribucion',
      'proyecto',
      'numeroDeCatalogo',
      'upc',
      'isrc',
      'tituloCatalogo',
    ] as const;

    const isValid = await form.trigger(basicFields);

    if (isValid) {
      setStep('FINANCIAL_INFO');
    } else {
      toast({
        variant: 'destructive',
        description: 'Por favor completa todos los campos requeridos.',
      });
    }
  };

  // Helper function to convert string to number
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
          // disabled={!user.emailVerified}
        >
          <FilePlus className="-ml-1 mr-2 h-4 w-4" />
          <Trans>New Record</Trans>
        </Button>
      </SheetTrigger>

      <SheetContent
        autoFocus={false}
        showOverlay={true}
        className="dark:bg-backgroundDark m-2 flex max-h-[98vh] w-full max-w-[94vw] flex-col justify-between overflow-y-auto rounded-lg bg-zinc-50 sm:max-w-[94vw] md:mx-0 md:my-2 md:max-w-4xl"
      >
        <SheetHeader>
          <SheetTitle>
            <Trans>
              {initialData ? _(msg`Update Distribution Record`) : _(msg`Add Distribution Record`)}
            </Trans>
          </SheetTitle>
          <SheetDescription>
            {initialData
              ? _(msg`Update your Distribution record details.`)
              : _(msg`Create a new Distribution record with details.`)}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[58cqh] w-full sm:h-[80cqh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="">
              <ScrollArea className="w-full">
                <hr className="-mx-6 my-4" />

                {/* Paso 1: Información Básica */}
                {step === 'BASIC_INFO' && (
                  <fieldset disabled={isSubmitting} className="space-y-6 p-1">
                    {/* Sección 1: Información del producto */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="marketingOwner"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Marketing Owner</FormLabel>
                              <FormControl>
                                <Input placeholder="Propietario de marketing" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="nombreDistribucion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre Distribución</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre de la distribución" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="proyecto"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Proyecto</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del proyecto" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="numeroDeCatalogo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Catálogo</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: CAT-123456" {...field} />
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
                              <FormLabel>UPC</FormLabel>
                              <FormControl>
                                <Input placeholder="Código UPC" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="localProductNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Local Product Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Número de producto local" {...field} />
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
                                <Input placeholder="Código ISRC" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="tituloCatalogo"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título Catálogo</FormLabel>
                              <FormControl>
                                <Input placeholder="Título del catálogo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Sección 2: Información de territorio y tipo */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="mesReportado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mes Reportado</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="12"
                                  placeholder="1-12"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* <div className="col-span-12 md:col-span-6">
                                <FormField
                                  control={form.control}
                                  name="territorio"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Territorio</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Territorio" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div> */}

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="codigoDelTerritorio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código del Territorio</FormLabel>
                              <FormControl>
                                <Input placeholder="Código territorio" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {/* 
                              <div className="col-span-12 md:col-span-6">
                                <FormField
                                  control={form.control}
                                  name="nombreDelTerritorio"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nombre del Territorio</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Nombre del territorio" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div> */}

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="tipoDePrecio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Precio</FormLabel>
                              <FormControl>
                                <Input placeholder="Tipo de precio" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="tipoDeIngreso"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Ingreso</FormLabel>
                              <FormControl>
                                <Input placeholder="Tipo de ingreso" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Sección 3: Territorios y Plataformas */}
                    <div className="grid grid-cols-12 gap-4">
                      {territoryData && territoryData.length > 0 && (
                        <div className="col-span-12 md:col-span-6">
                          <div className="col-span-12 md:col-span-6">
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-medium">Nombre Del Territorio</p>

                              <Select
                                value={selectedTerritory?.name?.toString() || ''}
                                onValueChange={(value) => {
                                  if (value === '') {
                                    setSelectedTerritory(null);
                                    form.setValue('musicPlatform', []);
                                  } else {
                                    const territory = territoryData.find((p) => p.name === value);
                                    if (territory) {
                                      setSelectedTerritory(territory);
                                      form.setValue('musicPlatform', [territory]);
                                    }
                                  }
                                }}
                              >
                                <SelectTrigger className="">
                                  <SelectValue placeholder="Select a territory platform" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    {territoryData.map((territory) => (
                                      <SelectItem key={territory.id} value={territory.name ?? ''}>
                                        {territory.name}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                      {platformData && platformData.length > 0 && (
                        <div className="col-span-12 md:col-span-6">
                          <div className="flex flex-col gap-2">
                            <p className="text-sm font-medium">Territorio</p>

                            <Select
                              value={selectedPlatform?.name?.toString() || ''}
                              onValueChange={(value) => {
                                console.log('Selected platform value:', value);
                                if (value === '') {
                                  setSelectedPlatform(null);
                                  form.setValue('musicPlatform', []);
                                } else {
                                  const platform = platformData.find((p) => p.name === value);
                                  if (platform) {
                                    setSelectedPlatform(platform);
                                    form.setValue('musicPlatform', [platform]);
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="">
                                <SelectValue placeholder="Select a music platform" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {platformData.map((platform) => (
                                    <SelectItem key={platform.id} value={platform.name ?? ''}>
                                      {platform.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </fieldset>
                )}

                {/* Paso 2: Información Financiera */}
                {step === 'FINANCIAL_INFO' && (
                  <fieldset disabled={isSubmitting} className="space-y-6 p-1">
                    {/* Sección 1: Métricas financieras básicas */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="venta"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Venta</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.001"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="rtl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RTL</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="ppd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>PPD</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="rbp"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RBP</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="tipoDeCambio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tipo de Cambio</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.0001"
                                  placeholder="0.0000"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="valorRecibido"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor Recibido</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Sección 2: Regalías y costos */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6">
                        <FormField
                          control={form.control}
                          name="regaliasArtisticas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Regalías Artísticas</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="costoDistribucion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Costo Distribución</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="copyright"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Copyright</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="cuotaAdministracion"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cuota Administración</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="costoCarga"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Costo Carga</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="otrosCostos"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Otros Costos</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
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
                          name="ingresosRecibidos"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ingresos Recibidos</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  {...field}
                                  onChange={(e) => field.onChange(convertToNumber(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </fieldset>
                )}
              </ScrollArea>
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="w-full">
          {/* Botones de navegación */}
          <div className="flex w-full flex-col items-center gap-3">
            <Progress className="h-1.5" value={step === 'BASIC_INFO' ? 50 : 100} />
            <div className="flex w-full items-center gap-x-4">
              {step === 'FINANCIAL_INFO' ? (
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="flex-1"
                  disabled={isLoading}
                  onClick={() => setStep('BASIC_INFO')}
                >
                  Volver
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button
                    type="button"
                    size="lg"
                    variant="secondary"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                </DialogClose>
              )}
              {/* Botón para avanzar o enviar */}
              {step === 'BASIC_INFO' && (
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

              {step === 'FINANCIAL_INFO' && (
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
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
