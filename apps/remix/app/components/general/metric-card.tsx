import NumberFlow, { continuous } from '@number-flow/react';
import type { LucideIcon } from 'lucide-react/dist/lucide-react';

import { cn } from '@documenso/ui/lib/utils';

export type CardMetricProps = {
  icon?: LucideIcon;
  title: string;
  value: string | number;
  className?: string;
  valueFormat?: ValueFormat;
};

export type ValueFormat = 'currency' | 'percent' | 'decimal';

export const CardMetric = ({
  icon: Icon,
  title,
  value,
  className,
  valueFormat = 'decimal',
}: CardMetricProps) => {
  return (
    <div
      className={cn(
        'border-border bg-background hover:shadow-border/80 h-32 max-h-32 max-w-full overflow-hidden rounded-lg border shadow shadow-transparent duration-200',
        className,
      )}
    >
      <div className="flex h-full max-h-full flex-col px-4 pb-6 pt-4 sm:px-4 sm:pb-8 sm:pt-4">
        <div className="flex items-start">
          {Icon && (
            <div className="mr-2 h-4 w-4">
              <Icon className="text-muted-foreground h-4 w-4" />
            </div>
          )}

          <h3 className="text-primary-forground mb-2 flex items-end text-sm font-medium leading-tight">
            {title}
          </h3>
        </div>

        {typeof value === 'number' ? (
          <NumberFlow
            plugins={[continuous]}
            format={{ style: valueFormat, currency: 'USD' }}
            className="text-foreground mt-auto text-4xl font-semibold leading-8"
            value={valueFormat === 'percent' ? value / 100 : value}
          />
        ) : (
          <p className="text-foreground mt-auto text-4xl font-semibold leading-8">{value}</p>
        )}
      </div>
    </div>
  );
};
