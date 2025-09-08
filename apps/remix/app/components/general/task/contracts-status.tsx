import type { HTMLAttributes } from 'react';

import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react/dist/lucide-react';

import type { ExtendedContractStatus } from '@documenso/prisma/types/extended-contracts';
import { cn } from '@documenso/ui/lib/utils';

type FriendlyStatus = {
  label: MessageDescriptor;
  labelExtended: MessageDescriptor;
  icon?: LucideIcon;
  color: string;
};

export const FRIENDLY_STATUS_MAP: Record<ExtendedContractStatus, FriendlyStatus> = {
  FINALIZADO: {
    label: msg`Finalizado`,
    labelExtended: msg`Finalizado`,
    icon: Flag,
    color: 'text-blue-600 dark:text-blue-300',
  },
  VIGENTE: {
    label: msg`Vigente`,
    labelExtended: msg`Vigente`,
    icon: Flag,
    color: 'text-green-500 dark:text-green-300',
  },
  NO_ESPECIFICADO: {
    label: msg`No Especificado`,
    labelExtended: msg`No Especificado  `,
    icon: Flag,
    color: 'text-yellow-500 dark:text-yellow-200',
  },
  ALL: {
    label: msg`All`,
    labelExtended: msg`All`,
    color: 'text-muted-foreground',
  },
};

export type ContractProps = HTMLAttributes<HTMLSpanElement> & {
  status: ExtendedContractStatus;
  inheritColor?: boolean;
};

export const ContractsStatus = ({ className, status, inheritColor, ...props }: ContractProps) => {
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
