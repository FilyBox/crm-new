import React from 'react';

import { Inbox } from '@novu/react';
import { dark } from '@novu/react/themes';
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
      appearance={{ baseTheme: themeMode }}
    />
  );
}

export default React.memo(NotificationCenter);
