import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { ContractStatus, ExpansionPossibility } from '@prisma/client';
import { queryOptions } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { type Contract, type Document } from '@documenso/prisma/client';
import { trpc } from '@documenso/trpc/react';
import { queryClient } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import { Calendar } from '@documenso/ui/primitives/calendar-year-picker';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@documenso/ui/primitives/command';
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
import { Textarea } from '@documenso/ui/primitives/textarea';

import { useCurrentTeam } from '~/providers/team';

const formSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(1, { message: 'Title is required' }),
  fileName: z.string().optional().nullable(),
  artists: z.string().optional().nullable(),
  startDate: z.date().optional(),
  endDate: z.date(),
  isPossibleToExpand: z.nativeEnum(ExpansionPossibility),
  possibleExtensionTime: z.string().optional().nullable(),
  status: z.nativeEnum(ContractStatus),
  documentId: z.number(),
  folderId: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
});

interface MyFormProps {
  initialData?: Contract | null;
  setInitialData?: (data: Contract | null) => void;
  isSubmitting?: boolean;
  folderId: string | null;
  setIsSheetOpen?: (isOpen: boolean) => void;
  isSheetOpen?: boolean;
}

export default function ContractsSheet({
  initialData,
  setInitialData,
  folderId,
  setIsSheetOpen,
  isSheetOpen,
}: MyFormProps) {
  const { _ } = useLingui();
  const team = useCurrentTeam();

  const { data: documents } = trpc.document.findAllDocumentsInternalUseToChat.useQuery(
    { teamId: team.id },
    queryOptions({
      queryKey: ['chatDocuments', team.id],
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    }),
  );

  // const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const updateContractsMutation = trpc.contracts.updateContractsById.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: () => {
      toast.error(_(msg`Error updating record`), {
        className: 'mb-16',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(_(msg`Record updated successfully`), {
          className: 'mb-16',
          position: 'bottom-center',
        });
        setInitialData?.(null);
        setIsSheetOpen?.(false);
      }
    },
  });

  const createContractsMutation = trpc.contracts.createContracts.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: () => {
      toast.error(_(msg`Error updating record`), {
        className: 'mb-16',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(_(msg`Record updated successfully`), {
          className: 'mb-16',
          position: 'bottom-center',
        });
        setIsSheetOpen?.(false);
      }
    },
  });
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      fileName: '',
      artists: '',
      folderId: folderId || undefined,
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

      if (initialData.documentId && documents) {
        const document = documents.find((doc) => doc.id === initialData.documentId);
        setSelectedDocument(document || null);
      }
    }
  }, [form, initialData, documents]);

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      const formData = initialData?.id ? { ...values, id: initialData.id } : values;

      const dataToSubmit = {
        ...formData,
        documentId: selectedDocument?.id,
        fileName: selectedDocument?.title,
      };

      if (initialData?.id) {
        await handleUpdate(dataToSubmit as unknown as Contract);
      } else {
        await handleCreate(dataToSubmit as unknown as Omit<Contract, 'id'>);
      }
      form.reset();
      setSelectedDocument(null);
    } catch (error) {
      throw new Error('Form submission error');
    }
  }

  const handleCreate = async (newRecord: Omit<Contract, 'id'>) => {
    try {
      await createContractsMutation.mutateAsync({
        title: newRecord.title ?? '',
        fileName: newRecord.fileName ?? '',
        artists: newRecord.artists ?? '',
        startDate: newRecord.startDate ?? new Date(),
        endDate: newRecord.endDate ?? new Date(),
        isPossibleToExpand: newRecord.isPossibleToExpand ?? '',
        possibleExtensionTime: newRecord.possibleExtensionTime ?? '',
        status: newRecord.status ?? 'NO_ESPECIFICADO',
        documentId: newRecord.documentId ?? 0,
        summary: newRecord.summary ?? '',
      });
    } catch (error) {
      console.error('Error creating record:', error);
    }
  };

  const handleUpdate = async (updatedContracts: Contract) => {
    try {
      await updateContractsMutation.mutateAsync({
        id: updatedContracts.id,
        title: updatedContracts.title ?? '',
        artists: updatedContracts.artists ?? '',
        fileName: updatedContracts.fileName ?? undefined,
        startDate: updatedContracts.startDate ?? new Date(),
        endDate: updatedContracts.endDate ?? new Date(),
        isPossibleToExpand: updatedContracts.isPossibleToExpand ?? undefined,
        possibleExtensionTime: updatedContracts.possibleExtensionTime ?? undefined,
        status: updatedContracts.status ?? undefined,
        documentId: updatedContracts.documentId ?? undefined,
        summary: updatedContracts.summary ?? undefined,
      });
    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button
          onClick={() => setInitialData?.(null)}
          className="w-full sm:w-fit"
          disabled={updateContractsMutation.isPending || createContractsMutation.isPending}
        >
          <Trans>New Record</Trans>
        </Button>
      </SheetTrigger>

      <SheetContent
        autoFocus={false}
        showOverlay={true}
        style={{ containerType: 'size' }}
        className="dark:bg-backgroundDark m-2 flex max-h-[98vh] w-full max-w-[94vw] flex-col justify-between overflow-y-auto rounded-lg bg-zinc-50 sm:m-2 md:max-w-4xl"
      >
        <div className="flex flex-col gap-4">
          <SheetHeader>
            <SheetTitle>
              <Trans>{initialData ? _(msg`Update Contract`) : _(msg`Add Contract`)}</Trans>
            </SheetTitle>
            <SheetDescription>
              {initialData
                ? _(msg`Update your contract details.`)
                : _(msg`Create a new contract with details.`)}
            </SheetDescription>
          </SheetHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="">
              <ScrollArea className="h-[80cqh] w-full px-1">
                <fieldset
                  disabled={updateContractsMutation.isPending || createContractsMutation.isPending}
                  className=""
                >
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="title"
                        disabled={
                          updateContractsMutation.isPending || createContractsMutation.isPending
                        }
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
                        disabled={
                          updateContractsMutation.isPending || createContractsMutation.isPending
                        }
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
                                      !selectedDocument && 'text-muted-foreground',
                                    )}
                                  >
                                    {selectedDocument?.title || 'Select document'}
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
                                      {documents &&
                                        documents.map((document) => (
                                          <CommandItem
                                            value={document.title}
                                            key={document.id}
                                            onSelect={() => {
                                              setSelectedDocument(document);
                                              form.setValue('documentId', document.id);
                                            }}
                                          >
                                            {document.title}
                                            <Check
                                              className={cn(
                                                'ml-auto',
                                                selectedDocument?.id === document.id
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
                        name="artists"
                        disabled={
                          updateContractsMutation.isPending || createContractsMutation.isPending
                        }
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
                        disabled={
                          updateContractsMutation.isPending || createContractsMutation.isPending
                        }
                        render={({ field }) => (
                          <FormItem className="flex h-full flex-col justify-between pt-1">
                            <FormLabel>Fecha de inicio</FormLabel>
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
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        name="endDate"
                        disabled={
                          updateContractsMutation.isPending || createContractsMutation.isPending
                        }
                        render={({ field }) => (
                          <FormItem className="flex h-full flex-col justify-between pt-1">
                            <FormLabel>Fecha de terminación</FormLabel>
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
                    </div>

                    <div className="col-span-12 md:col-span-6">
                      <FormField
                        control={form.control}
                        disabled={
                          updateContractsMutation.isPending || createContractsMutation.isPending
                        }
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
                        disabled={
                          updateContractsMutation.isPending || createContractsMutation.isPending
                        }
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tiempo posible de extensión</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: 6 meses"
                                {...field}
                                value={field.value || ''}
                                // disabled={
                                //   form.watch('isPossibleToExpand') !== ExpansionPossibility.SI
                                // }
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
                        disabled={
                          updateContractsMutation.isPending || createContractsMutation.isPending
                        }
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
              </ScrollArea>
              <SheetFooter>
                <div className="flex w-full gap-5">
                  <SheetClose asChild>
                    <Button
                      disabled={
                        updateContractsMutation.isPending || createContractsMutation.isPending
                      }
                      className="w-full"
                      size="lg"
                      variant="secondary"
                    >
                      <Trans>Cancel</Trans>
                    </Button>
                  </SheetClose>
                  <Button
                    disabled={
                      updateContractsMutation.isPending || createContractsMutation.isPending
                    }
                    loading={updateContractsMutation.isPending || createContractsMutation.isPending}
                    type="submit"
                    size="lg"
                    className="w-full"
                    // onClick={() => {
                    //   void form.trigger().then(() => {
                    //     console.log('Form state:', form.formState);
                    //     const errores = form.formState.errors;
                    //     if (Object.keys(errores).length > 0) {
                    //       return;
                    //     }
                    //     const values = form.getValues();
                    //     void handleSubmit(values);
                    //   });
                    // }}
                  >
                    {initialData?.id ? 'Actualizar' : 'Agregar'}
                  </Button>
                </div>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
