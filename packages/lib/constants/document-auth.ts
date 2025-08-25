import { useLingui } from '@lingui/react/macro';

import type { TDocumentAuth } from '../types/document-auth';
import { DocumentAuth } from '../types/document-auth';

type DocumentAuthTypeData = {
  key: TDocumentAuth;
  value: string;
};

export const useDocumentAuthTypes = (): Record<string, DocumentAuthTypeData> => {
  const { t } = useLingui();

  return {
    [DocumentAuth.ACCOUNT]: {
      key: DocumentAuth.ACCOUNT,
      value: t`Require account`,
    },
    [DocumentAuth.PASSKEY]: {
      key: DocumentAuth.PASSKEY,
      value: t`Require passkey`,
    },
    [DocumentAuth.TWO_FACTOR_AUTH]: {
      key: DocumentAuth.TWO_FACTOR_AUTH,
      value: t`Require 2FA`,
    },
    [DocumentAuth.PASSWORD]: {
      key: DocumentAuth.PASSWORD,
      value: t`Require password`,
    },
    [DocumentAuth.EXPLICIT_NONE]: {
      key: DocumentAuth.EXPLICIT_NONE,
      value: t`None (Overrides global settings)`,
    },
  } satisfies Record<TDocumentAuth, DocumentAuthTypeData>;
};

export const DOCUMENT_AUTH_TYPES: Record<string, DocumentAuthTypeData> = {
  [DocumentAuth.ACCOUNT]: {
    key: DocumentAuth.ACCOUNT,
    value: 'Require account',
  },
  [DocumentAuth.PASSKEY]: {
    key: DocumentAuth.PASSKEY,
    value: 'Require passkey',
  },
  [DocumentAuth.TWO_FACTOR_AUTH]: {
    key: DocumentAuth.TWO_FACTOR_AUTH,
    value: 'Require 2FA',
  },
  [DocumentAuth.PASSWORD]: {
    key: DocumentAuth.PASSWORD,
    value: 'Require password',
  },
  [DocumentAuth.EXPLICIT_NONE]: {
    key: DocumentAuth.EXPLICIT_NONE,
    value: 'None (Overrides global settings)',
  },
} satisfies Record<TDocumentAuth, DocumentAuthTypeData>;
