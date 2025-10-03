import React from 'react';

import { Inbox } from '@novu/react';
import { dark } from '@novu/react/themes';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Theme, useTheme } from 'remix-themes';

function NotificationCenter({ suscriberId }: { suscriberId: string }) {
  const [theme] = useTheme();
  const navigate = useNavigate();
  dark.elements = {
    button: {
      borderRadius: '8px',
      padding: '6px',
    },
  };
  const themeMode = theme === Theme.DARK ? dark : undefined;
  return (
    <Inbox
      applicationIdentifier="dwyFjFG8GGi4"
      subscriberId={suscriberId}
      routerPush={async (path: string) => navigate(path)}
      appearance={{
        baseTheme: themeMode,
        elements: {
          button: {
            borderRadius: '8px',
            padding: '11px',
            border: '1px solid',
            borderColor: theme === Theme.LIGHT ? '#e2e8f0' : '#474747',
          },
        },
      }}
      renderBell={(unreadCount) => {
        return (
          <div className="relative w-fit">
            {unreadCount.total > 0 ? (
              <div className="bg-destructive absolute -top-1 left-2 size-2 animate-pulse rounded-full" />
            ) : null}
            <Bell className="text-foreground" size={16} />
          </div>
        );
      }}
    />
  );
}

export default React.memo(NotificationCenter);
