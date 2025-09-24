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
}: {
  data: Data;
  isLoading: boolean;
  label: string;
  searchParamsIdentifier: string;
}) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isMounted = useIsMounted();

  const agregadoraIds = parseToIntegerArray(searchParams?.get(searchParamsIdentifier) ?? '');

  const comboBoxOptions = (data ?? []).map((data) => ({
    label: data.name,
    value: data.id,
  }));

  const onChange = (newAgregadoraIds: number[]) => {
    if (!pathname) {
      return;
    }

    const params = new URLSearchParams(searchParams?.toString());

    params.set(searchParamsIdentifier, newAgregadoraIds.join(','));

    if (newAgregadoraIds.length === 0) {
      params.delete(searchParamsIdentifier);
    }

    void navigate(`${pathname}?${params.toString()}`, { preventScrollReset: true });
  };

  return (
    <MultiSelectCombobox
      className="w-full"
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
      selectedValues={agregadoraIds}
      onChange={onChange}
    />
  );
};
