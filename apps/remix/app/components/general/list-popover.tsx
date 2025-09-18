import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLingui } from '@lingui/react/macro';
import type { List } from '@prisma/client';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import type { EventColor } from '@documenso/prisma/generated/types';
import { queryClient, trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
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

import { getEventColorClasses } from './event-calendar';

interface ListPopoverProps {
  list: Pick<List, 'id' | 'name' | 'color'> | null;
  isOpen: boolean;
  setIsSheetOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
  boardId: string;
  onSave?: () => void;
}

export function ListPopover({
  list,
  isOpen,
  setIsSheetOpen,
  children,
  boardId,
  onSave,
}: ListPopoverProps) {
  const { t } = useLingui();
  const formSchema = z.object({
    name: z.string().min(1, { message: t`Name cannot be empty` }),
    color: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: 'blue',
    },
  });

  const createListMutation = trpc.task.createList.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['listTasks'] });
      onSave?.();
    },
    onError: () => {
      toast.error(t`Error creating list`, {
        className: '',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(t`List created successfully`, {
          className: '',
          position: 'bottom-center',
        });
        setIsSheetOpen(false);
      }
    },
  });

  const updateListMutation = trpc.task.updateList.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['listTasks'] });
      onSave?.();
    },
    onError: () => {
      toast.error(t`Error updating list`, {
        className: '',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(t`List updated successfully`, {
          className: '',
          position: 'bottom-center',
        });
        setIsSheetOpen(false);
      }
    },
  });

  useEffect(() => {
    if (list) {
      form.reset({
        name: list.name || '',
        color: (list.color as EventColor) || 'blue',
      });
    } else {
      form.reset({
        name: '',
        color: 'blue',
      });
    }
  }, [list, form]);

  const handleUpdate = async (values: z.infer<typeof formSchema>) => {
    if (!list?.id) return;

    const { name, color } = values;
    await updateListMutation.mutate({
      listId: list.id,
      name,
      color: color ? (color as EventColor) : 'blue',
    });
  };

  const handleCreate = async (values: z.infer<typeof formSchema>) => {
    const { name, color } = values;
    await createListMutation.mutate({
      name,
      color: color ? (color as EventColor) : 'blue',
      boardId,
    });
    form.reset({
      name: '',
      color: 'blue',
    });
  };

  const handleSave = (values: z.infer<typeof formSchema>) => {
    if (list?.id) {
      void handleUpdate(values);
    } else {
      void handleCreate(values);
    }
  };

  const colorOptions = [
    { value: 'blue', label: 'Blue', class: getEventColorClasses('blue') },
    { value: 'emerald', label: 'Emerald', class: getEventColorClasses('emerald') },
    { value: 'sky', label: 'Sky', class: getEventColorClasses('sky') },
    { value: 'violet', label: 'Violet', class: getEventColorClasses('violet') },
    { value: 'rose', label: 'Rose', class: getEventColorClasses('rose') },
    { value: 'orange', label: 'Orange', class: getEventColorClasses('orange') },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsSheetOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start" side="right">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="font-medium">{list?.id ? 'Editar lista' : 'Crear lista'}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSheetOpen(false);
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <div
                className={cn(
                  'relative h-20 overflow-hidden rounded-lg',
                  getEventColorClasses(form.watch('color')),
                )}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-black backdrop-blur-sm">
                    📝 {form.watch('name') || 'Título de la lista'}
                  </div>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fondo</label>
                  <div className="mt-2 grid grid-cols-6 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={cn(
                          'h-8 rounded border-2',
                          color.class,
                          form.watch('color') === color.value
                            ? 'border-gray-800'
                            : 'border-transparent hover:border-gray-300',
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          form.setValue('color', color.value);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Título de la lista */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Título de la lista *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="" className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Button
                className="w-full"
                disabled={createListMutation.isPending || updateListMutation.isPending}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const isValid = await form.trigger();
                  if (isValid) {
                    const values = form.getValues();
                    await handleSave(values);
                  }
                }}
              >
                {createListMutation.isPending || updateListMutation.isPending
                  ? list?.id
                    ? t`Updating...`
                    : t`Creating...`
                  : list?.id
                    ? t`Update`
                    : t`Create`}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
