import { useEffect } from 'react';

import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { useIsMounted } from '@documenso/lib/client-only/hooks/use-is-mounted';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { MultiSelectCombobox } from '@documenso/ui/primitives/multi-select-combobox';

type Data =
  | {
      id: number;
      name: string;
    }[]
  | undefined;

export const TableFilter = ({
  data,
  isLoading,
  label,
  searchParamsIdentifier,
  clearFilters = false,
  localValue,
  onLocalChange,
}: {
  data: Data;
  isLoading: boolean;
  label: string;
  searchParamsIdentifier: string;
  clearFilters?: boolean;
  localValue?: number[];
  onLocalChange?: (value: number[]) => void;
}) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isMounted = useIsMounted();

  const currentIds =
    localValue ?? parseToIntegerArray(searchParams?.get(searchParamsIdentifier) ?? '');

  const comboBoxOptions = (data ?? []).map((data) => ({
    label: data.name,
    value: data.id,
  }));

  const onChange = (newIds: number[]) => {
    if (onLocalChange) {
      onLocalChange(newIds);
    } else {
      if (!pathname) {
        return;
      }

      const params = new URLSearchParams(searchParams?.toString());

      if (newIds.length === 0) {
        params.delete(searchParamsIdentifier);
      } else {
        params.set(searchParamsIdentifier, newIds.join(','));
      }

      void navigate(`${pathname}?${params.toString()}`, { preventScrollReset: true });
    }
  };

  useEffect(() => {
    if (clearFilters && currentIds.length > 0) {
      onChange([]);
    }
  }, [clearFilters]);

  return (
    <div className="relative">
      <MultiSelectCombobox
        className={`w-full`}
        emptySelectionPlaceholder={
          <p className="text-muted-foreground font-normal">
            <Trans>
              <span className="text-muted-foreground/70">{label}:</span> All
            </Trans>
          </p>
        }
        enableClearAllButton={true}
        inputPlaceholder={msg`Search`}
        loading={!isMounted || isLoading}
        options={comboBoxOptions}
        selectedValues={currentIds}
        onChange={onChange}
      />
    </div>
  );
};
