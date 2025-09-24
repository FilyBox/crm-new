import type { HTMLAttributes } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { useSession } from '@documenso/lib/client-only/providers/session';
import { isPersonalLayout } from '@documenso/lib/utils/organisations';
import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@documenso/ui/primitives/navigation-menu';

import { useOptionalCurrentTeam } from '~/providers/team';

export type AppNavDesktopProps = HTMLAttributes<HTMLDivElement> & {
  setIsCommandMenuOpen: (value: boolean) => void;
};

export const AppNavDesktop = ({
  className,
  setIsCommandMenuOpen,
  ...props
}: AppNavDesktopProps) => {
  const { _ } = useLingui();
  const { organisations } = useSession();

  const { pathname } = useLocation();

  const [modifierKey, setModifierKey] = useState(() => 'Ctrl');

  const currentTeam = useOptionalCurrentTeam();

  useEffect(() => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const isMacOS = /Macintosh|Mac\s+OS\s+X/i.test(userAgent);

    setModifierKey(isMacOS ? '⌘' : 'Ctrl');
  }, []);

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
        href: `/t/${teamUrl}/allMusic`,
        label: msg`Music`,
      },
      {
        href: `/t/${teamUrl}/files`,
        label: msg`Files`,
      },

      {
        href: `/t/${teamUrl}/events`,
        label: msg`Events`,
      },
      {
        href: `/t/${teamUrl}/tasks`,
        label: msg`Tasks`,
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
        label: msg`Virgin`,
      },
      {
        href: `/t/${teamUrl}/tuStreams`,
        label: msg`TuStreams`,
      },
      {
        href: `/t/${teamUrl}/releases`,
        label: msg`Releases`,
      },
      {
        href: `/t/${teamUrl}/distribution`,
        label: msg`Ada`,
      },
      {
        href: `/t/${teamUrl}/isrc`,
        label: msg`ISRC`,
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
        label: msg`Create contracts`,
      },
      {
        href: `/t/${teamUrl}/templates`,
        label: msg`Templates`,
      },
      {
        href: `/t/${teamUrl}/contracts`,
        label: msg`Contracts`,
      },
      {
        href: `/t/${teamUrl}/chatspace`,
        label: msg`Process Contracts`,
      },
    ];
  }, [currentTeam, organisations]);

  return (
    <div
      className={cn(
        'ml-8 hidden flex-1 items-center gap-x-12 md:flex md:justify-between',
        className,
      )}
      {...props}
    >
      <div>
        <AnimatePresence>
          <div className="flex items-center gap-3">
            {menuNavigationLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-baseline gap-x-6 text-sm"
              >
                <NavigationMenu>
                  <NavigationMenuList className="flex items-center gap-3">
                    {/* <NavigationMenuItem>
                      <NavigationMenuTrigger
                        className={cn(
                          'dark:text-muted-foreground/60 text-muted-foreground dark:hover:text-foreground m-0 p-0',
                          {
                            'text-foreground dark:text-muted-foreground':
                              menuNavigationLinksMusic.some((link) =>
                                pathname?.startsWith(`${link.href}`),
                              ),
                          },
                        )}
                      >
                        <Trans>Music</Trans>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="flex min-w-32 flex-col gap-2 p-1">
                        {menuNavigationLinksMusic.map(({ href, label }) => (
                          <NavigationMenuLink asChild key={href}>
                            <Link
                              key={href}
                              to={`${href}`}
                              className={cn(
                                'text-muted-foreground dark:text-muted-foreground/60 dark:hover:text-foreground focus-visible:ring-ring ring-offset-background hover:bg-secondary/80 w-full rounded-sm p-1 text-center font-medium leading-5 focus-visible:outline-none focus-visible:ring-2',
                                {
                                  'text-foreground dark:text-muted-foreground':
                                    pathname?.startsWith(`${href}`),
                                },
                              )}
                            >
                              {_(label)}
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </NavigationMenuContent>
                    </NavigationMenuItem> */}

                    <NavigationMenuItem>
                      <NavigationMenuTrigger
                        className={cn(
                          'dark:text-muted-foreground/60 text-muted-foreground dark:hover:text-foreground m-0 p-0',
                          {
                            'text-foreground dark:text-muted-foreground':
                              menuNavigationLinksContracts.some((link) =>
                                pathname?.startsWith(`${link.href}`),
                              ),
                          },
                        )}
                      >
                        <Trans>Contracts</Trans>
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="min-w-52">
                        <div className="flex w-full flex-col items-center gap-2 p-1">
                          {menuNavigationLinksContracts.map(({ href, label }) => (
                            <NavigationMenuLink asChild key={href}>
                              <Link
                                key={href}
                                to={`${href}`}
                                className={cn(
                                  'text-muted-foreground dark:text-muted-foreground/60 dark:hover:text-foreground focus-visible:ring-ring ring-offset-background hover:bg-secondary/80 w-full rounded-sm p-1 text-center font-medium leading-5 focus-visible:outline-none focus-visible:ring-2',
                                  {
                                    'text-foreground dark:text-muted-foreground':
                                      pathname?.startsWith(`${href}`),
                                  },
                                )}
                              >
                                {_(label)}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </motion.div>
            )}
            {menuNavigationLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-baseline gap-x-6"
              >
                {menuNavigationLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    to={href}
                    className={cn(
                      'text-muted-foreground dark:text-muted-foreground/60 focus-visible:ring-ring ring-offset-background rounded-md text-sm font-medium leading-5 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2',
                      {
                        'text-foreground dark:text-muted-foreground': pathname?.startsWith(href),
                      },
                    )}
                  >
                    {_(label)}
                  </Link>
                ))}
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>

      <Button
        variant="outline"
        className="text-muted-foreground flex w-full max-w-28 items-center justify-between rounded-lg"
        onClick={() => setIsCommandMenuOpen(true)}
      >
        <div className="flex items-center">
          <Search className="mr-2 h-5 w-5" />
        </div>

        <div>
          <div className="text-muted-foreground bg-muted flex items-center rounded-md px-1.5 py-0.5 text-xs tracking-wider">
            {modifierKey}+K
          </div>
        </div>
      </Button>
    </div>
  );
};
