import { useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { Download, MoreHorizontal, MoveRight, RefreshCcw, Trash2 } from 'lucide-react';

import { downloadAnyFile } from '@documenso/lib/client-only/download-any-file';
import { useSession } from '@documenso/lib/client-only/providers/session';
import type { TFilesMany as TDocumentRow } from '@documenso/lib/types/files';
import { trpc as trpcClient } from '@documenso/trpc/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';
import { useToast } from '@documenso/ui/primitives/use-toast';

import { DocumentDuplicateDialog } from '~/components/dialogs/document-duplicate-dialog';
// import { DocumentMoveDialog } from '~/components/dialogs/document-move-dialog';
import { FilesDeleteDialog } from '~/components/dialogs/files-delete-dialog';
import { useOptionalCurrentTeam } from '~/providers/team';

export type TableActionDropdownProps = {
  row: TDocumentRow;
  onMoveDocument?: () => void;
  onHandleRetry?: () => void;
};

export const TableActionDropdown = ({
  row,
  onMoveDocument,
  onHandleRetry,
}: TableActionDropdownProps) => {
  const { user } = useSession();
  const team = useOptionalCurrentTeam();

  const { toast } = useToast();
  const { _ } = useLingui();

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [isMoveDialogOpen, setMoveDialogOpen] = useState(false);

  const isOwner = row.user.id === user.id;
  const isError = row.status === 'ERROR';

  const isCurrentTeamDocument = team && row.team?.url === team.url;
  const canManageDocument = Boolean(isOwner || isCurrentTeamDocument);

  const onDownloadOriginalClick = async () => {
    try {
      const document = await trpcClient.files.getDocumentById.query({
        documentId: row.id,
      });
      console.log('Document data:', document);
      const documentData = document?.documentData;

      if (!documentData) {
        return;
      }

      await downloadAnyFile({ documentData, fileName: row.title });
    } catch (err) {
      console.error('Error downloading document:', err);
      toast({
        title: _(msg`Something went wrong`),
        description: _(msg`An error occurred while downloading your document.`),
        variant: 'destructive',
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

        {/* <DropdownMenuItem disabled={!canManageDocument || isComplete} asChild>
          <Link to={formatPath}>
            <Edit className="mr-2 h-4 w-4" />
            <Trans>Edit</Trans>
          </Link>
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
        {canManageDocument && (
          <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            <Trans>Delete</Trans>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>

      <FilesDeleteDialog
        id={row.id}
        status={row.status}
        documentTitle={row.title}
        open={isDeleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        teamId={team?.id}
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
