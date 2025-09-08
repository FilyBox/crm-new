import type { HTMLAttributes } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { CheckCircle2, Clock, File, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react/dist/lucide-react';

import type { ExtendedTaskStatus } from '@documenso/prisma/types/extended-task-status';
import { cn } from '@documenso/ui/lib/utils';

type FriendlyStatus = {
  label: MessageDescriptor;
  labelExtended: MessageDescriptor;
  icon?: LucideIcon;
  color: string;
};

export const FRIENDLY_STATUS_MAP: Record<ExtendedTaskStatus, FriendlyStatus> = {
  PENDING: {
    label: msg`Pending`,
    labelExtended: msg`Document pending`,
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-300',
  },
  COMPLETED: {
    label: msg`Completed`,
    labelExtended: msg`Document completed`,
    icon: CheckCircle2,
    color: 'text-green-500 dark:text-green-300',
  },
  IN_PROGRESS: {
    label: msg`In Progress`,
    labelExtended: msg`Task in progress`,
    icon: File,
    color: 'text-yellow-500 dark:text-yellow-200',
  },
  CANCELLED: {
    label: msg`Cancelled`,
    labelExtended: msg`Task cancelled`,
    icon: File,
    color: 'text-red-500 dark:text-red-200',
  },
  BLOCKED: {
    label: msg`Blocked`,
    labelExtended: msg`Task cancelled`,
    icon: XCircle,
    color: 'text-red-500 dark:text-red-300',
  },
  ALL: {
    label: msg`All`,
    labelExtended: msg`Document All`,
    color: 'text-muted-foreground',
  },
};

export type DocumentStatusProps = HTMLAttributes<HTMLSpanElement> & {
  status: ExtendedTaskStatus;
  inheritColor?: boolean;
};

export const TaskStatusComponent = ({
  className,
  status,
  inheritColor,
  ...props
}: DocumentStatusProps) => {
  const { _ } = useLingui();

  const { label, icon: Icon, color } = FRIENDLY_STATUS_MAP[status];

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
