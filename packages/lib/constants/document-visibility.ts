import { useLingui } from '@lingui/react/macro';

import { DocumentVisibility } from '@documenso/lib/types/document-visibility';

import type { TDocumentVisibility } from '../types/document-visibility';

type DocumentVisibilityTypeData = {
  key: TDocumentVisibility;
  value: string;
};

export const useDocumentVisibilityTypes = (): Record<string, DocumentVisibilityTypeData> => {
  const { t } = useLingui();
  return {
    [DocumentVisibility.ADMIN]: {
      key: DocumentVisibility.ADMIN,
      value: t`Admins only`,
    },
    [DocumentVisibility.EVERYONE]: {
      key: DocumentVisibility.EVERYONE,
      value: t`Everyone`,
    },
    [DocumentVisibility.MANAGER_AND_ABOVE]: {
      key: DocumentVisibility.MANAGER_AND_ABOVE,
      value: t`Managers and above`,
    },
  } satisfies Record<TDocumentVisibility, DocumentVisibilityTypeData>;
};

export const DOCUMENT_VISIBILITY: Record<string, DocumentVisibilityTypeData> = {
  [DocumentVisibility.ADMIN]: {
    key: DocumentVisibility.ADMIN,
    value: 'Admins only',
  },
  [DocumentVisibility.EVERYONE]: {
    key: DocumentVisibility.EVERYONE,
    value: 'Everyone',
  },
  [DocumentVisibility.MANAGER_AND_ABOVE]: {
    key: DocumentVisibility.MANAGER_AND_ABOVE,
    value: 'Managers and above',
  },
} satisfies Record<TDocumentVisibility, DocumentVisibilityTypeData>;
