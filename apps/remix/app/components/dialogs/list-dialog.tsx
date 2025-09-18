import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trans, useLingui } from '@lingui/react/macro';
import type { Board } from '@prisma/client';
import { Trash2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import type { EventColor } from '@documenso/prisma/generated/types';
import { queryClient, trpc } from '@documenso/trpc/react';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@documenso/ui/primitives/form';
import { Input } from '@documenso/ui/primitives/input';
import { RadioGroup, RadioGroupItem } from '@documenso/ui/primitives/radio-group';

interface ListDialogProps {
  board: Board | null;
  isOpen: boolean;
  setIsSheetOpen: (isOpen: boolean) => void;
  setInitialData: (data: Board | null) => void;
  boardId: string;
  onClose: () => void;
  onSave: (board: Pick<Board, 'id' | 'name' | 'color'>) => void;
  onDelete: (listId: string) => void;
}

export function ListDialog({
  board,
  boardId,
  setInitialData,
  isOpen,
  setIsSheetOpen,
  onClose,
  onSave,
  onDelete,
}: ListDialogProps) {
  const [error, setError] = useState<string | null>(null);
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
    },
    onError: () => {
      toast.error(t`Error creating board`, {
        className: '',
        position: 'bottom-center',
      });
    },
    onSettled: (success) => {
      if (success) {
        toast.success(t`Record updated successfully`, {
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
      });
      setError(null);
    } else {
      form.reset({
        name: '',
        color: 'blue',
      });
      setError(null);
    }
  }, [board, form]);

  const handleCreate = async (values: z.infer<typeof formSchema>) => {
    const { name, color } = values;
    await createListMutation.mutate({
      name,
      color: color ? (color as EventColor) : 'blue',
      boardId,
    });
  };

  const handleSave = (values: z.infer<typeof formSchema>) => {
    const eventName = values.name.trim() ? values.name : t`(no title)`;

    if (board?.id) {
      console.log('Editing board not implemented yet');
    } else {
      void handleCreate(values);
    }

    onSave({
      id: board?.id || '',
      name: eventName,
      color: values.color as EventColor,
    });
  };

  const handleDelete = () => {
    if (board?.id) {
      onDelete(board.id);
    }
  };

  const colorOptions: Array<{
    value: EventColor;
    label: string;
    bgClass: string;
    borderClass: string;
  }> = [
    {
      value: 'blue',
      label: 'Blue',
      bgClass: 'bg-blue-400 data-[state=checked]:bg-blue-400',
      borderClass: 'border-blue-400 data-[state=checked]:border-blue-400',
    },
    {
      value: 'violet',
      label: 'Violet',
      bgClass: 'bg-violet-400 data-[state=checked]:bg-violet-400',
      borderClass: 'border-violet-400 data-[state=checked]:border-violet-400',
    },
    {
      value: 'rose',
      label: 'Rose',
      bgClass: 'bg-rose-400 data-[state=checked]:bg-rose-400',
      borderClass: 'border-rose-400 data-[state=checked]:border-rose-400',
    },
    {
      value: 'emerald',
      label: 'Emerald',
      bgClass: 'bg-emerald-400 data-[state=checked]:bg-emerald-400',
      borderClass: 'border-emerald-400 data-[state=checked]:border-emerald-400',
    },
    {
      value: 'orange',
      label: 'Orange',
      bgClass: 'bg-orange-400 data-[state=checked]:bg-orange-400',
      borderClass: 'border-orange-400 data-[state=checked]:border-orange-400',
    },
    {
      value: 'sky',
      label: 'Sky',
      bgClass: 'bg-sky-400 data-[state=checked]:bg-sky-400',
      borderClass: 'border-sky-400 data-[state=checked]:border-sky-400',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsSheetOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setInitialData(null)} className="w-full sm:w-fit">
          <Trans>New List</Trans>
        </Button>
      </DialogTrigger>
      <DialogContent
        autoFocus={false}
        className="m-2 flex h-fit w-full flex-col justify-between overflow-y-auto rounded-lg sm:m-2 md:max-w-4xl"
      >
        <DialogHeader>
          <DialogTitle>{board?.id ? t`Edit List` : t`Create List`}</DialogTitle>
          <DialogDescription className="sr-only">
            {board?.id ? t`Edit the details of this list` : t`Add a new list to your board`}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}
        <Form {...form}>
          <form aria-disabled={createListMutation.isPending} className="grid gap-4 px-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <Trans>Title</Trans>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem className="col-span-1 w-fit space-y-4">
                  <FormLabel className="text-foreground text-sm font-medium leading-none">
                    <Trans>Etiquette</Trans>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex items-center gap-1.5"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {colorOptions.map((colorOption) => (
                        <RadioGroupItem
                          key={colorOption.value}
                          value={colorOption.value}
                          aria-label={colorOption.label}
                          className={cn(
                            'size-6 fill-white text-white shadow-none',
                            colorOption.bgClass,
                            colorOption.borderClass,
                          )}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="flex-row sm:justify-between">
          {board?.id && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              size="icon"
              onClick={() =>
                toast.warning(t`The board will be deleted`, {
                  description: t`Are you sure you want to delete this board?`,
                  position: 'bottom-center',
                  className: 'z-9999 pointer-events-auto',
                  closeButton: true,
                  action: {
                    label: t`Delete`,
                    onClick: () => {
                      handleDelete();
                    },
                  },
                })
              }
              aria-label="Delete board"
            >
              <Trash2Icon size={16} aria-hidden="true" />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button disabled={createListMutation.isPending} variant="outline" onClick={onClose}>
              <Trans>Cancel</Trans>
            </Button>
            <Button
              disabled={createListMutation.isPending}
              loading={createListMutation.isPending}
              onClick={async () => {
                const isValid = await form.trigger();
                if (isValid) {
                  const values = form.getValues();
                  await handleSave(values);
                }
              }}
            >
              <Trans>Save</Trans>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
