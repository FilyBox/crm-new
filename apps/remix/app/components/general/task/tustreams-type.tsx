import type { HTMLAttributes } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { TypeOfTuStreams } from '@prisma/client';
import { Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react/dist/lucide-react';

import { cn } from '@documenso/ui/lib/utils';

type FriendlyStatus = {
  label: MessageDescriptor;
  labelExtended: MessageDescriptor;
  icon?: LucideIcon;
  color: string;
};

export const ExtendedTuStreamsType = {
  ...TypeOfTuStreams,

  ALL: 'ALL',
} as const;

export type ExtendedTuStreamsType =
  (typeof ExtendedTuStreamsType)[keyof typeof ExtendedTuStreamsType];

export const FRIENDLY_STATUS_MAP: Record<ExtendedTuStreamsType, FriendlyStatus> = {
  Sencillo: {
    label: msg`Sencillo`,
    labelExtended: msg`Sencillo`,
    icon: Flag,
    color: 'text-blue-600 dark:text-blue-300',
  },
  Single: {
    label: msg`Single`,
    labelExtended: msg`Single`,
    icon: Flag,
    color: 'text-blue-600 dark:text-blue-300',
  },
  EP: {
    label: msg`EP`,
    labelExtended: msg`EP`,
    icon: Flag,
    color: 'text-green-500 dark:text-green-300',
  },
  Album: {
    label: msg`Album`,
    labelExtended: msg`Album`,
    icon: Flag,
    color: 'text-yellow-500 dark:text-yellow-200',
  },
  ALL: {
    label: msg`All`,
    labelExtended: msg`All`,
    color: 'text-muted-foreground',
  },
};

export type TaskProps = HTMLAttributes<HTMLSpanElement> & {
  type: ExtendedTuStreamsType;
  inheritColor?: boolean;
};

export const TuStreamsType = ({ className, type, inheritColor, ...props }: TaskProps) => {
  const { _ } = useLingui();

  const { label, icon: Icon, color } = FRIENDLY_STATUS_MAP[type];

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
