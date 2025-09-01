import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { useIsMounted } from '@documenso/lib/client-only/hooks/use-is-mounted';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { MultiSelectCombobox } from '@documenso/ui/primitives/multi-select-combobox';

type DocumentsTableSenderFilterProps = {
  teamId: number;
};

type territoryData =
  | {
      id: number;
      name: string | null;
    }[]
  | undefined;
export const TableTerritoryFilter = ({
  territoryData,
  isLoading,
}: {
  territoryData: territoryData;
  isLoading: boolean;
}) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isMounted = useIsMounted();

  const territoryIds = parseToIntegerArray(searchParams?.get('territoryIds') ?? '');

  // const { data: territoryData, isLoading } = trpc.lpm.findLpmUniqueArtists.useQuery();

  const comboBoxOptions = (territoryData ?? []).map((territory) => ({
    label: territory.name ?? 'Unknown Territory',
    value: territory.id,
  }));

  const onChange = (newterritoryIds: number[]) => {
    if (!pathname) {
      return;
    }

    const params = new URLSearchParams(searchParams?.toString());

    params.set('territoryIds', newterritoryIds.join(','));

    if (newterritoryIds.length === 0) {
      params.delete('territoryIds');
    }

    void navigate(`${pathname}?${params.toString()}`, { preventScrollReset: true });
  };

  return (
    <MultiSelectCombobox
      emptySelectionPlaceholder={
        <p className="text-muted-foreground font-normal">
          <Trans>
            <span className="text-muted-foreground/70">Territories:</span> All
          </Trans>
        </p>
      }
      enableClearAllButton={true}
      inputPlaceholder={msg`Search`}
      loading={!isMounted || isLoading}
      options={comboBoxOptions}
      selectedValues={territoryIds}
      onChange={onChange}
    />
  );
};
