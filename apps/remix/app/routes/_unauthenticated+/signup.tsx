import { redirect } from 'react-router';

import { IS_GOOGLE_SSO_ENABLED, IS_OIDC_SSO_ENABLED } from '@documenso/lib/constants/auth';
import { env } from '@documenso/lib/utils/env';

import { SignUpForm } from '~/components/forms/signup';
import { appMetaTags } from '~/utils/meta';

import type { Route } from './+types/signup';

export function meta() {
  return appMetaTags('Sign Up');
}

export function loader() {
  const NEXT_PUBLIC_DISABLE_SIGNUP = env('NEXT_PUBLIC_DISABLE_SIGNUP');

  // SSR env variables.
  const isGoogleSSOEnabled = IS_GOOGLE_SSO_ENABLED;
  const isOIDCSSOEnabled = IS_OIDC_SSO_ENABLED;

  if (NEXT_PUBLIC_DISABLE_SIGNUP === 'true') {
    throw redirect('/signin');
  }

  return {
    isGoogleSSOEnabled,
    isOIDCSSOEnabled,
  };
}

export default function SignUp({ loaderData }: Route.ComponentProps) {
  const { isGoogleSSOEnabled, isOIDCSSOEnabled } = loaderData;

  return (
    <div className="flex h-full w-screen items-center justify-center p-16">
      <SignUpForm
        className="max-h-[80vh] w-full max-w-screen-2xl lg:-my-28"
        isGoogleSSOEnabled={isGoogleSSOEnabled}
        isOIDCSSOEnabled={isOIDCSSOEnabled}
      />
    </div>
  );
}
