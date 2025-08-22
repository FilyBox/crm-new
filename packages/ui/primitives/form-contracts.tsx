import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { ContractStatus, ExpansionPossibility } from '@prisma/client';
import { format, isValid, parse } from 'date-fns';
// Add import for parse and isValid
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { type Contract, type Document } from '@documenso/prisma/client';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { cn } from '../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar-year-picker';
import { Card, CardContent } from './card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ScrollArea } from './scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';

// Define the enum types from Prisma

// Interface for Contract model

const formSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, { message: 'Title is required' }),
  fileName: z.string().optional().nullable(),
  artists: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  isPossibleToExpand: z.nativeEnum(ExpansionPossibility),
  possibleExtensionTime: z.string().optional().nullable(),
  status: z.nativeEnum(ContractStatus),
  documentId: z.number().optional(),
  folderId: z.string().optional(),
  summary: z.string().optional().nullable(),
});

interface ContractFormProps {
  onSubmit: (data: Contract) => void;
  folderId?: string;
  initialData: Contract | null;
  isSubmitting?: boolean;
  documents: Document[];
}

const parseDate = (dateString: string | null | undefined) => {
  if (!dateString) return undefined;

  try {
    let date;
    if (dateString.includes('/')) {
      date = parse(dateString, 'dd/MM/yyyy', new Date());
    } else {
      date = new Date(dateString + 'T00:00:00');
    }

    return isValid(date) ? date : undefined;
  } catch (error) {
    console.error('Date parsing error:', error);
    return undefined;
  }
};

export default function ContractForm({
  documents,
  folderId,
  onSubmit,
  initialData,
  isSubmitting = false,
}: ContractFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      fileName: '',
      artists: '',
      folderId: folderId,
      isPossibleToExpand: ExpansionPossibility.NO_ESPECIFICADO,
      possibleExtensionTime: '',
      status: ContractStatus.NO_ESPECIFICADO,
      summary: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      Object.keys(initialData).forEach((key) => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
          // Skip the id field and timestamps
          // @ts-expect-error - We know these fields exist in our form schema
          form.setValue(key, initialData[key]);
        }
      });

      if (initialData.id) {
        form.setValue('id', initialData.id);
      }
    }
  }, [form, initialData]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    console.log('handleSubmit', values);
    try {
      console.log('actualizando');
      setIsLoading(true);
      const dataToSubmit = initialData?.id ? { ...values, id: initialData.id } : values;
      await onSubmit(dataToSubmit as Contract);
      toast({
        description: 'Contract data submitted successfully',
      });
    } catch (error) {
      console.error('Form submission error', error);
      toast({
        variant: 'destructive',
        description: 'Error submitting contract data',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const expansionOptions = [
    { label: 'Sí', value: ExpansionPossibility.SI },
    { label: 'No', value: ExpansionPossibility.NO },
    { label: 'No Especificado', value: ExpansionPossibility.NO_ESPECIFICADO },
  ];

  const statusOptions = [
    { label: 'Finalizado', value: ContractStatus.FINALIZADO },
    { label: 'Vigente', value: ContractStatus.VIGENTE },
    { label: 'No Especificado', value: ContractStatus.NO_ESPECIFICADO },
  ];

  return (
    <div className="mx-auto max-w-6xl py-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="">
          <Card className="border-border dark:bg-background relative p-6">
            <div className="h-min-20 h-fit">
              <h1 className="text-xl font-semibold md:text-2xl">Información del Contrato</h1>
              <p className="text-muted-foreground mt-2 text-xs md:text-sm">
                Esta información es esencial para la gestión de contratos.
              </p>
            </div>

            <ScrollArea className="h-[60vh] w-full">
              <hr className="-mx-6 my-4" />
              <CardContent className="gap-4 px-1 pb-0">
                <fieldset disabled={isSubmitting} className="">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input placeholder="Título del contrato" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="documentId"
                        render={({ field }) => (
                          <FormItem className="flex h-full w-full flex-col space-y-2.5">
                            <FormLabel>Document</FormLabel>
                            <Popover modal={true}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      'justify-between',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
                                    {field.value
                                      ? documents.find((document) => document.id === field.value)
                                          ?.id
                                      : 'Select document'}
                                    <ChevronsUpDown className="opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="z-9999 p-0">
                                <Command>
                                  <CommandInput placeholder="Search document..." className="h-9" />
                                  <CommandList>
                                    <CommandEmpty>No document found.</CommandEmpty>
                                    <CommandGroup>
                                      {documents.map((document) => (
                                        <CommandItem
                                          value={document.title}
                                          key={document.id}
                                          onSelect={() => {
                                            form.setValue('documentId', document.id);
                                          }}
                                        >
                                          {document.title}
                                          <Check
                                            className={cn(
                                              'ml-auto',
                                              document.id === field.value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="fileName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Archivo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombre del archivo"
                                {...field}
                                value={field.value || ''}
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
                        name="artists"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Artistas</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nombres de los artistas"
                                {...field}
                                value={field.value || ''}
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
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Original Release Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-[240px] pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
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
                                      // format(
                                      //   // Only try to format if field.value is a non-empty string
                                      //   field.value && field.value.trim() !== ''
                                      //     ? new Date(field.value + 'T00:00:00')
                                      //     : new Date(),
                                      //   'dd/MM/yyyy',
                                      // )
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
                                      return field.value ? new Date(field.value) : undefined;
                                    } catch (error) {
                                      return undefined;
                                    }
                                  })()}
                                  onSelect={(date) => field.onChange(date)}
                                  disabled={(date) => date < new Date('1900-01-01')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Inicio</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
                                    {field.value ? (
                                      formatDateForDisplay(field.value)
                                    ) : (
                                      <span>Seleccione una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="z-9999 w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={parseDate(field.value)}
                                  onSelect={(date) =>
                                    field.onChange(date ? formatDateForApi(date) : '')
                                  }
                                  disabled={(date) => date < new Date('1900-01-01')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Original Release Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-[240px] pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
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
                                      // format(
                                      //   // Only try to format if field.value is a non-empty string
                                      //   field.value && field.value.trim() !== ''
                                      //     ? new Date(field.value + 'T00:00:00')
                                      //     : new Date(),
                                      //   'dd/MM/yyyy',
                                      // )
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
                                      return field.value ? new Date(field.value) : undefined;
                                    } catch (error) {
                                      return undefined;
                                    }
                                  })()}
                                  onSelect={(date) => field.onChange(date)}
                                  disabled={(date) => date < new Date('1900-01-01')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha de finalización</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={'outline'}
                                    className={cn(
                                      'w-full pl-3 text-left font-normal',
                                      !field.value && 'text-muted-foreground',
                                    )}
                                  >
                                    {field.value ? (
                                      formatDateForDisplay(field.value)
                                    ) : (
                                      <span>Seleccione una fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="z-9999 w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={parseDate(field.value)}
                                  onSelect={(date) =>
                                    field.onChange(date ? formatDateForApi(date) : '')
                                  }
                                  disabled={(date) => date < new Date('1900-01-01')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="isPossibleToExpand"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>¿Es posible expandir?</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(value as ExpansionPossibility)
                              }
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione una opción" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {expansionOptions.map((option) => (
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
                        name="possibleExtensionTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiempo posible de extensión</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: 6 meses"
                                {...field}
                                value={field.value || ''}
                                disabled={
                                  form.watch('isPossibleToExpand') !== ExpansionPossibility.SI
                                }
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
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value as ContractStatus)}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccione un estado" />
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

                    <div className="col-span-12">
                      <FormField
                        control={form.control}
                        name="summary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resumen</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Resumen del contrato"
                                className="min-h-[100px]"
                                {...field}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </fieldset>
              </CardContent>
            </ScrollArea>

            <div className="mt-6 flex items-center gap-x-4 px-6">
              <Button
                disabled={isLoading || isSubmitting}
                loading={isLoading}
                type="button"
                size="lg"
                className="flex-1"
                onClick={() => {
                  // Trigger validation before submitting
                  void form.trigger().then((isValid) => {
                    const values = form.getValues();
                    void handleSubmit(values);
                  });
                }}
              >
                {initialData?.id ? 'Actualizar' : 'Agregar'}
              </Button>
            </div>
          </Card>
        </form>
      </Form>
    </div>
  );
}
