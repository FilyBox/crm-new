import { useCallback } from 'react';

import { motion } from 'framer-motion';
import { MoonStar, Sun } from 'lucide-react';
import { Theme, useTheme } from 'remix-themes';

import { useIsMounted } from '@documenso/lib/client-only/hooks/use-is-mounted';

import { cn } from '../lib/utils';

export const ThemeSwitcher = ({ className }: { className?: string }) => {
  const [theme, setTheme] = useTheme();

  const applyTheme = useCallback(
    (darkMode: boolean) => {
      if (darkMode) {
        document.startViewTransition(() => {
          document.documentElement.classList.add('dark');
          setTheme(Theme.DARK);
        });
      } else {
        document.startViewTransition(() => {
          document.documentElement.classList.remove('dark');
          setTheme(Theme.LIGHT);
        });
      }
    },
    [setTheme],
  );

  const isMounted = useIsMounted();

  return (
    <div className={cn('bg-muted flex items-center gap-x-1 rounded-full p-1', className)}>
      <button
        className="text-muted-foreground relative z-10 flex h-8 w-8 items-center justify-center rounded-full"
        onClick={() => applyTheme(false)}
      >
        {isMounted && theme === Theme.LIGHT && (
          <motion.div
            className="bg-background absolute inset-0 rounded-full mix-blend-color-burn"
            layoutId="selected-theme"
          />
        )}
        <Sun className="h-5 w-5" />
      </button>

      <button
        className="text-muted-foreground relative z-10 flex h-8 w-8 items-center justify-center rounded-full"
        onClick={() => applyTheme(true)}
      >
        {isMounted && theme === Theme.DARK && (
          <motion.div
            className="bg-background absolute inset-0 rounded-full mix-blend-exclusion"
            layoutId="selected-theme"
          />
        )}

        <MoonStar className="h-5 w-5" />
      </button>

      {/* <button
        className="text-muted-foreground relative z-10 flex h-8 w-8 items-center justify-center rounded-full"
        onClick={() => setTheme(null)}
      >
        {isMounted && theme === null && (
          <motion.div
            className="bg-background absolute inset-0 rounded-full mix-blend-exclusion"
            layoutId="selected-theme"
          />
        )}
        <Monitor className="h-5 w-5" />
      </button> */}
    </div>
  );
};
