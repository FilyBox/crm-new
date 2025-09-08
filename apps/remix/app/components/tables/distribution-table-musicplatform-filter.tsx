import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { useIsMounted } from '@documenso/lib/client-only/hooks/use-is-mounted';
import { parseToIntegerArray } from '@documenso/lib/utils/params';
import { MultiSelectCombobox } from '@documenso/ui/primitives/multi-select-combobox';

type platformData =
  | {
      id: number;

      name: string | null;
    }[]
  | undefined;
export const TablePlatformFilter = ({
  platformData,
  isLoading,
}: {
  platformData: platformData;
  isLoading: boolean;
}) => {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isMounted = useIsMounted();

  const platformIds = parseToIntegerArray(searchParams?.get('platformIds') ?? '');

  // const { data: platformData, isLoading } = trpc.lpm.findLpmUniqueArtists.useQuery();

  const comboBoxOptions = (platformData ?? []).map((platform) => ({
    label: platform.name ?? 'Unknown Platform',
    value: platform.id,
  }));

  const onChange = (newplatformIds: number[]) => {
    if (!pathname) {
      return;
    }

    const params = new URLSearchParams(searchParams?.toString());

    params.set('platformIds', newplatformIds.join(','));

    if (newplatformIds.length === 0) {
      params.delete('platformIds');
    }

    void navigate(`${pathname}?${params.toString()}`, { preventScrollReset: true });
  };

  return (
    <MultiSelectCombobox
      emptySelectionPlaceholder={
        <p className="text-muted-foreground font-normal">
          <Trans>
            <span className="text-muted-foreground/70">Platforms:</span> All
          </Trans>
        </p>
      }
      enableClearAllButton={true}
      inputPlaceholder={msg`Search`}
      loading={!isMounted || isLoading}
      options={comboBoxOptions}
      selectedValues={platformIds}
      onChange={onChange}
    />
  );
};
