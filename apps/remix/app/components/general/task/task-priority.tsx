import type { HTMLAttributes } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react/dist/lucide-react';

import type { ExtendedTaskPriority } from '@documenso/prisma/types/extended-task-priority';
import { cn } from '@documenso/ui/lib/utils';

type FriendlyStatus = {
  label: MessageDescriptor;
  labelExtended: MessageDescriptor;
  icon?: LucideIcon;
  color: string;
};

export const FRIENDLY_STATUS_MAP: Record<ExtendedTaskPriority, FriendlyStatus> = {
  LOW: {
    label: msg`Low`,
    labelExtended: msg`Document pending`,
    icon: Flag,
    color: 'text-blue-600 dark:text-blue-300',
  },
  MEDIUM: {
    label: msg`Medium`,
    labelExtended: msg`Document completed`,
    icon: Flag,
    color: 'text-green-500 dark:text-green-300',
  },
  HIGH: {
    label: msg`High`,
    labelExtended: msg`Document draft`,
    icon: Flag,
    color: 'text-yellow-500 dark:text-yellow-200',
  },
  CRITICAL: {
    label: msg`Critical`,
    labelExtended: msg`Document error`,
    icon: Flag,
    color: 'text-red-500 dark:text-red-200',
  },
  ALL: {
    label: msg`All`,
    labelExtended: msg`Document All`,
    color: 'text-muted-foreground',
  },
};

export type TaskProps = HTMLAttributes<HTMLSpanElement> & {
  priority: ExtendedTaskPriority;
  inheritColor?: boolean;
};

export const TaskPriority = ({ className, priority, inheritColor, ...props }: TaskProps) => {
  const { _ } = useLingui();
  const { label, icon: Icon, color } = FRIENDLY_STATUS_MAP[priority];

  return (
    <span className={cn('flex items-center', className)} {...props}>
      {Icon && (
        <Icon
          className={cn('mr-2 inline-block h-4 w-4', {
            [color]: !inheritColor,
          })}
        />
      )}
      {_(label)}
    </span>
  );
};
