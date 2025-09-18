import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import type { Board } from '@prisma/client';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { BoardVisibility, type TBoardVisibility } from '@documenso/lib/types/board-visibility';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@documenso/ui/primitives/select';

import { getEventColorClasses } from './event-calendar';

interface BoardDialogProps {
  board: Board | null;
  isOpen: boolean;
  setIsSheetOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
  canAdminAbove: boolean;
}

export function BoardPopover({
  board,
  isOpen,
  setIsSheetOpen,
  children,
  canAdminAbove,
}: BoardDialogProps) {
  const { t } = useLingui();
  const formSchema = z.object({
    name: z.string().min(1, { message: t`Name cannot be empty` }),
    color: z.string(),
    visibility: z.string().default(BoardVisibility.EVERYONE),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      color: 'blue',
      visibility: BoardVisibility.EVERYONE,
    },
  });

  const createBoardMutation = trpc.task.createBoard.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
    onError: () => {
      toast.error(t`Error creating board`, {
        className: '',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(t`Board created successfully`, {
          className: '',
          position: 'bottom-center',
        });
        setIsSheetOpen(false);
      }
    },
  });

  const updateBoardMutation = trpc.task.updateBoard.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['boardsTasks'] });
    },
    onError: () => {
      toast.error(t`Error updating board`, {
        className: '',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(t`Board updated successfully`, {
          className: '',
          position: 'bottom-center',
        });
        setIsSheetOpen(false);
      }
    },
  });

  useEffect(() => {
    if (board) {
      form.reset({
        name: board.name || '',
        color: (board.color as EventColor) || 'orange',
        visibility: board.visibility || BoardVisibility.EVERYONE,
      });
    } else {
      form.reset({
        name: '',
        color: 'blue',
        visibility: BoardVisibility.EVERYONE,
      });
    }
  }, [board, form]);

  const handleUpdate = async (values: z.infer<typeof formSchema>) => {
    if (!board?.id) return;

    const { name, color } = values;
    await updateBoardMutation.mutate({
      boardId: board.id,
      name,
      color: color ? (color as EventColor) : 'blue',
      visibility: values.visibility as TBoardVisibility,
    });
  };

  const handleCreate = async (values: z.infer<typeof formSchema>) => {
    const { name, color } = values;
    await createBoardMutation.mutate({
      name,
      color: color ? (color as EventColor) : 'blue',
      visibility: values.visibility as TBoardVisibility,
    });
    form.reset({
      name: '',
      color: 'blue',
      visibility: BoardVisibility.EVERYONE,
    });
  };

  const handleSave = (values: z.infer<typeof formSchema>) => {
    if (board?.id) {
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
            <h3 className="font-medium">{board?.id ? 'Editar tablero' : 'Crear tablero'}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSheetOpen(false)}
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
                    📋 {form.watch('name') || 'Título del tablero'}
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
                        onClick={() => form.setValue('color', color.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Título del tablero */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Título del tablero *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="" className="bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Trans>Visibility</Trans>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t`Select visibility`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={BoardVisibility.EVERYONE}>
                            <Trans>Everyone</Trans>
                          </SelectItem>
                          {canAdminAbove && (
                            <SelectItem value={BoardVisibility.MANAGER_AND_ABOVE}>
                              <Trans>Managers and above</Trans>
                            </SelectItem>
                          )}
                          {canAdminAbove && (
                            <SelectItem value={BoardVisibility.ADMIN}>
                              <Trans>Admins only</Trans>
                            </SelectItem>
                          )}
                          <SelectItem value={BoardVisibility.ONLY_ME}>
                            <Trans>Only me</Trans>
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
                disabled={createBoardMutation.isPending || updateBoardMutation.isPending}
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (isValid) {
                    const values = form.getValues();
                    await handleSave(values);
                  }
                }}
              >
                {createBoardMutation.isPending || updateBoardMutation.isPending
                  ? board?.id
                    ? t`Updating...`
                    : t`Creating...`
                  : board?.id
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
