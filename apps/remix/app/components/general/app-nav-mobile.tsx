import { useMemo } from 'react';

import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';
import { ReadStatus } from '@prisma/client';
import { Link } from 'react-router';

import { authClient } from '@documenso/auth/client';
import { useSession } from '@documenso/lib/client-only/providers/session';
import { isPersonalLayout } from '@documenso/lib/utils/organisations';
import { trpc } from '@documenso/trpc/react';
import { Sheet, SheetContent } from '@documenso/ui/primitives/sheet';

import { useOptionalCurrentTeam } from '~/providers/team';

import { BrandingLogo } from './branding-logo';

export type AppNavMobileProps = {
  isMenuOpen: boolean;
  onMenuOpenChange?: (_value: boolean) => void;
};

export const AppNavMobile = ({ isMenuOpen, onMenuOpenChange }: AppNavMobileProps) => {
  const { t } = useLingui();

  const { organisations } = useSession();

  const currentTeam = useOptionalCurrentTeam();

  const { data: unreadCountData } = trpc.document.inbox.getCount.useQuery(
    {
      readStatus: ReadStatus.NOT_OPENED,
    },
    {
      // refetchInterval: 30000, // Refetch every 30 seconds
    },
  );

  const handleMenuItemClick = () => {
    onMenuOpenChange?.(false);
  };

  const menuNavigationLinks = useMemo(() => {
    let teamUrl = currentTeam?.url || null;

    if (!teamUrl && isPersonalLayout(organisations)) {
      teamUrl = organisations[0].teams[0]?.url || null;
    }

    if (!teamUrl) {
      return [];
    }

    return [
      {
        href: `/t/${teamUrl}/files`,
        label: t`Files`,
      },

      {
        href: `/t/${teamUrl}/events`,
        label: t`Events`,
      },
      {
        href: `/t/${teamUrl}/tasks`,
        label: t`Tasks`,
      },
    ];
  }, [currentTeam, organisations]);

  const menuNavigationLinksMusic = useMemo(() => {
    let teamUrl = currentTeam?.url || null;

    if (!teamUrl && isPersonalLayout(organisations)) {
      teamUrl = organisations[0].teams[0]?.url || null;
    }

    if (!teamUrl) {
      return [];
    }

    return [
      {
        href: `/t/${teamUrl}/music`,
        label: t`Virgin`,
      },
      {
        href: `/t/${teamUrl}/tuStreams`,
        label: t`TuStreams`,
      },
      {
        href: `/t/${teamUrl}/releases`,
        label: t`Releases`,
      },
      {
        href: `/t/${teamUrl}/distribution`,
        label: t`Ada`,
      },
      {
        href: `/t/${teamUrl}/isrc`,
        label: t`ISRC`,
      },
    ];
  }, [currentTeam, organisations]);

  const menuNavigationLinksContracts = useMemo(() => {
    let teamUrl = currentTeam?.url || null;

    if (!teamUrl && isPersonalLayout(organisations)) {
      teamUrl = organisations[0].teams[0]?.url || null;
    }

    if (!teamUrl) {
      return [];
    }

    return [
      {
        href: `/t/${teamUrl}/documents`,
        label: t`Create contracts`,
      },
      {
        href: `/t/${teamUrl}/templates`,
        label: t`Templates`,
      },
      {
        href: `/t/${teamUrl}/contracts`,
        label: t`Contracts`,
      },
      {
        href: `/t/${teamUrl}/chatspace`,
        label: t`Process Contracts`,
      },
    ];
  }, [currentTeam, organisations]);

  return (
    <Sheet open={isMenuOpen} onOpenChange={onMenuOpenChange}>
      <SheetContent className="flex w-full max-w-[350px] flex-col">
        <BrandingLogo className="h-6 w-auto" />
        <div className="mt-8 flex w-full flex-col items-start gap-y-4">
          {menuNavigationLinksContracts.map(({ href, label }) => (
            <Link
              key={href}
              className="text-foreground hover:text-foreground/80 flex items-center gap-2 text-2xl font-semibold"
              to={href}
              onClick={() => handleMenuItemClick()}
            >
              {label}
            </Link>
          ))}
          {menuNavigationLinks.map(({ href, label }) => (
            <Link
              key={href}
              className="text-foreground hover:text-foreground/80 flex items-center gap-2 text-2xl font-semibold"
              to={href}
              onClick={() => handleMenuItemClick()}
            >
              {label}
              {href === '/inbox' && unreadCountData && unreadCountData.count > 0 && (
                <span className="bg-primary text-primary-foreground flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                  {unreadCountData.count > 99 ? '99+' : unreadCountData.count}
                </span>
              )}
            </Link>
          ))}

          {menuNavigationLinksMusic.map(({ href, label }) => (
            <Link
              key={href}
              className="text-foreground hover:text-foreground/80 flex items-center gap-2 text-2xl font-semibold"
              to={href}
              onClick={() => handleMenuItemClick()}
            >
              {label}
            </Link>
          ))}

          <button
            className="text-foreground hover:text-foreground/80 text-2xl font-semibold"
            onClick={async () => authClient.signOut()}
          >
            <Trans>Sign Out</Trans>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
