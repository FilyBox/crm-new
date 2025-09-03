import { useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { DocumentStatus, RecipientRole } from '@prisma/client';
import {
  CheckCircle,
  Download,
  EyeIcon,
  FolderInput,
  MoreHorizontal,
  MoveRight,
  Pencil,
  RefreshCcw,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { downloadPDF } from '@documenso/lib/client-only/download-pdf';
import { useSession } from '@documenso/lib/client-only/providers/session';
import type { TDocumentMany as TDocumentRow } from '@documenso/lib/types/document';
import { isDocumentCompleted } from '@documenso/lib/utils/document';
import { trpc as trpcClient } from '@documenso/trpc/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';

import { DocumentDeleteDialog } from '~/components/dialogs/document-delete-dialog';
import { DocumentDuplicateDialog } from '~/components/dialogs/document-duplicate-dialog';
// import { DocumentMoveDialog } from '~/components/dialogs/document-move-dialog';
import { useCurrentTeam } from '~/providers/team';

export type DocumentsTableActionDropdownProps = {
  row: TDocumentRow;
  onMoveDocument?: () => void;
  onHandleRetry?: () => void;
};

export const ChatTableActionDropdown = ({
  row,
  onMoveDocument,
  onHandleRetry,
}: DocumentsTableActionDropdownProps) => {
  const { user } = useSession();
  const team = useCurrentTeam();

  const { _ } = useLingui();

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const recipient = row.recipients.find((recipient) => recipient.email === user.email);

  const isOwner = row.user.id === user.id;
  // const isRecipient = !!recipient;
  const isDraft = row.status === DocumentStatus.DRAFT;
  const isError = row.status === 'ERROR';
  // const isPending = row.status === DocumentStatus.PENDING;
  const isComplete = isDocumentCompleted(row.status);
  // const isSigned = recipient?.signingStatus === SigningStatus.SIGNED;
  const isCurrentTeamDocument = team && row.team?.url === team.url;
  const canManageDocument = Boolean(isOwner || isCurrentTeamDocument);

  const onDownloadOriginalClick = async () => {
    try {
      const document = await trpcClient.document.getChatDocumentById.query({
        documentId: row.id,
      });

      const documentData = document?.documentData;

      if (!documentData) {
        return;
      }

      await downloadPDF({ documentData, fileName: row.title, version: 'original' });
    } catch (err) {
      toast.error(_(msg`Something went wrong`), {
        position: 'bottom-center',
        description: _(msg`An error occurred while downloading your document.`),
        className: 'mb-16',
      });
    }
  };

  // const nonSignedRecipients = row.recipients.filter((item) => item.signingStatus !== 'SIGNED');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-testid="document-table-action-btn">
        <MoreHorizontal className="text-muted-foreground h-5 w-5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-52" align="start" forceMount>
        <DropdownMenuLabel>
          <Trans>Action</Trans>
        </DropdownMenuLabel>

        {!isDraft && recipient && recipient?.role !== RecipientRole.CC && (
          <DropdownMenuItem disabled={!recipient || isComplete} asChild>
            <Link to={`/sign/${recipient?.token}`}>
              {recipient?.role === RecipientRole.VIEWER && (
                <>
                  <EyeIcon className="mr-2 h-4 w-4" />
                  <Trans>View</Trans>
                </>
              )}

              {recipient?.role === RecipientRole.SIGNER && (
                <>
                  <Pencil className="mr-2 h-4 w-4" />
                  <Trans>Sign</Trans>
                </>
              )}

              {recipient?.role === RecipientRole.APPROVER && (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <Trans>Approve</Trans>
                </>
              )}
            </Link>
          </DropdownMenuItem>
        )}

        {/* <DropdownMenuItem disabled={!canManageDocument || isComplete} asChild>
          <Link to={formatPath}>
            <Edit className="mr-2 h-4 w-4" />
            <Trans>Edit</Trans>
          </Link>
        </DropdownMenuItem> */}

        {/* <DropdownMenuItem disabled={!isComplete} onClick={onDownloadClick}>
          <Download className="mr-2 h-4 w-4" />
          <Trans>Download</Trans>
        </DropdownMenuItem> */}

        <DropdownMenuItem
          onClick={onHandleRetry}
          // disabled={!canManageDocument || isComplete}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          <Trans>Retry</Trans>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onDownloadOriginalClick}>
          <Download className="mr-2 h-4 w-4" />
          <Trans>Download</Trans>
        </DropdownMenuItem>

        {/* <DropdownMenuItem onClick={() => setDuplicateDialogOpen(true)}>
          <Copy className="mr-2 h-4 w-4" />
          <Trans>Duplicate</Trans>
        </DropdownMenuItem> */}

        {/* We don't want to allow teams moving documents across at the moment. */}
        {/*!team && !row.teamId && (
          <DropdownMenuItem disabled={isError} onClick={() => setMoveDialogOpen(true)}>
            <MoveRight className="mr-2 h-4 w-4" />
            <Trans>Move to Team</Trans>
          </DropdownMenuItem>
        ) */}

        {onMoveDocument && canManageDocument && (
          <DropdownMenuItem onClick={onMoveDocument} onSelect={(e) => e.preventDefault()}>
            <FolderInput className="mr-2 h-4 w-4" />
            <Trans>Move to Folder</Trans>
          </DropdownMenuItem>
        )}

        {onMoveDocument && (
          <DropdownMenuItem
            disabled={isError}
            onClick={onMoveDocument}
            onSelect={(e) => e.preventDefault()}
          >
            <MoveRight className="mr-2 h-4 w-4" />
            <Trans>Move to Folder</Trans>
          </DropdownMenuItem>
        )}

        {/* No point displaying this if there's no functionality. */}
        {/* <DropdownMenuItem disabled>
          <XCircle className="mr-2 h-4 w-4" />
          Void
        </DropdownMenuItem> */}

        <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          {canManageDocument ? _(msg`Delete`) : _(msg`Hide`)}
        </DropdownMenuItem>

        {/* <DropdownMenuLabel>
          <Trans>Share</Trans>
        </DropdownMenuLabel> */}

        {/* {canManageDocument && (
          <DocumentRecipientLinkCopyDialog
            recipients={row.recipients}
            trigger={
              <DropdownMenuItem disabled={!isPending} asChild onSelect={(e) => e.preventDefault()}>
                <div>
                  <Copy className="mr-2 h-4 w-4" />
                  <Trans>Signing Links</Trans>
                </div>
              </DropdownMenuItem>
            }
          />
        )} */}

        {/* <DocumentResendDialog document={row} recipients={nonSignedRecipients} /> */}

        {/* <DocumentShareButton
          documentId={row.id}
          token={isOwner ? undefined : recipient?.token}
          trigger={({ loading, disabled }) => (
            <DropdownMenuItem disabled={disabled || isDraft} onSelect={(e) => e.preventDefault()}>
              <div className="flex items-center">
                {loading ? <Loader className="mr-2 h-4 w-4" /> : <Share className="mr-2 h-4 w-4" />}
                <Trans>Share Signing Card</Trans>
              </div>
            </DropdownMenuItem>
          )}
        /> */}
      </DropdownMenuContent>

      <DocumentDeleteDialog
        id={row.id}
        status={row.status}
        documentTitle={row.title}
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        canManageDocument={canManageDocument}
      />

      {/* <DocumentMoveDialog
        documentId={row.id}
        open={isMoveDialogOpen}
        onOpenChange={setMoveDialogOpen}
      /> */}

      <DocumentDuplicateDialog
        id={row.id}
        open={isDuplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
      />
    </DropdownMenu>
  );
};
