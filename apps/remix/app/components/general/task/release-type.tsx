import type { HTMLAttributes } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react/dist/lucide-react';

import type { ExtendedReleaseType } from '@documenso/prisma/types/extended-release';
import { cn } from '@documenso/ui/lib/utils';

type FriendlyStatus = {
  label: MessageDescriptor;
  labelExtended: MessageDescriptor;
  icon?: LucideIcon;
  color: string;
};

export const FRIENDLY_STATUS_MAP: Record<ExtendedReleaseType, FriendlyStatus> = {
  Sencillo: {
    label: msg`Sencillo`,
    labelExtended: msg`Sencillo`,
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
  type: ExtendedReleaseType;
  inheritColor?: boolean;
};

export const ReleaseType = ({ className, type, inheritColor, ...props }: TaskProps) => {
  const { _ } = useLingui();
  const typeLabel = type;

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
