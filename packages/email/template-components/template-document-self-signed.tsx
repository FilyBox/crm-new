import { Trans } from '@lingui/react/macro';

import { env } from '@documenso/lib/utils/env';

import { Column, Img, Link, Section, Text } from '../components';
import { TemplateDocumentImage } from './template-document-image';

export interface TemplateDocumentSelfSignedProps {
  documentName: string;
  assetBaseUrl: string;
}

export const TemplateDocumentSelfSigned = ({
  documentName,
  assetBaseUrl,
}: TemplateDocumentSelfSignedProps) => {
  const NEXT_PUBLIC_WEBAPP_URL = env('NEXT_PUBLIC_WEBAPP_URL');

  const signUpUrl = `${NEXT_PUBLIC_WEBAPP_URL ?? 'http://localhost:3000'}/signup`;

  const getAssetUrl = (path: string) => {
    return new URL(path, assetBaseUrl).toString();
  };

  return (
    <>
      <TemplateDocumentImage className="mt-6" assetBaseUrl={assetBaseUrl} />

      <Section className="flex-row items-center justify-center">
        <Section>
          <Column align="center">
            <Text className="text-base font-semibold text-[#7AC455]">
              <Img
                src={getAssetUrl('/static/completed.png')}
                className="-mt-0.5 mr-2 inline h-7 w-7 align-middle"
              />
              <Trans>Completed</Trans>
            </Text>
          </Column>
        </Section>

        <Text className="text-primary mb-0 mt-6 text-center text-lg font-semibold">
          <Trans>You have signed “{documentName}”</Trans>
        </Text>

        <Text className="mx-auto mb-6 mt-1 max-w-[80%] text-center text-base text-slate-400">
          <Trans>
            Create a{' '}
            <Link
              href={signUpUrl}
              target="_blank"
              className="text-documenso-700 hover:text-documenso-600 whitespace-nowrap"
            >
              account
            </Link>{' '}
            to access your signed documents at any time.
          </Trans>
        </Text>
      </Section>
    </>
  );
};

export default TemplateDocumentSelfSigned;
