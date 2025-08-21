import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Plural, Trans } from '@lingui/react/macro';
import { FolderType } from '@prisma/client';
import {
  ArrowRightIcon,
  FolderIcon,
  FolderPlusIcon,
  MoreVerticalIcon,
  PinIcon,
  SettingsIcon,
  TrashIcon,
} from 'lucide-react';
import { Link } from 'react-router';

import {
  formatDocumentsPath,
  formatFilesPath,
  formatTemplatesPath,
} from '@documenso/lib/utils/teams';
import { type TFolderWithSubfolders } from '@documenso/trpc/server/folder-router/schema';
import { Button } from '@documenso/ui/primitives/button';
import { Card, CardContent } from '@documenso/ui/primitives/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@documenso/ui/primitives/dropdown-menu';

import { useCurrentTeam } from '~/providers/team';

export type FolderCardProps = {
  folder: TFolderWithSubfolders;
  onMove: (folder: TFolderWithSubfolders) => void;
  onPin: (folderId: string) => void;
  onUnpin: (folderId: string) => void;
  onSettings: (folder: TFolderWithSubfolders) => void;
  onDelete: (folder: TFolderWithSubfolders) => void;
};

export const FolderCard = ({
  folder,
  onMove,
  onPin,
  onUnpin,
  onSettings,
  onDelete,
}: FolderCardProps) => {
  const team = useCurrentTeam();
  const { _ } = useLingui();

  const formatPath = () => {
    const rootPath =
      folder.type === FolderType.DOCUMENT
        ? formatDocumentsPath(team.url)
        : folder.type === FolderType.TEMPLATE
          ? formatTemplatesPath(team.url)
          : formatFilesPath(team.url);

    return `${rootPath}/f/${folder.id}`;
  };

  return (
    <Link to={formatPath()} key={folder.id}>
      <Card className="hover:bg-muted/50 border-border h-full border transition-all">
        <CardContent className="p-4">
          <div className="flex min-w-0 items-center gap-3">
            <FolderIcon className="text-documenso h-6 w-6 flex-shrink-0" />

            <div className="flex w-full min-w-0 items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="flex min-w-0 items-center gap-2 font-medium">
                  <span className="truncate">{folder.name}</span>
                  {folder.pinned && <PinIcon className="text-documenso h-3 w-3 flex-shrink-0" />}
                </h3>

                <div className="text-muted-foreground mt-1 flex space-x-2 truncate text-xs">
                  <span>
                    {(() => {
                      const typeMap: Record<
                        FolderType,
                        { count: number; one: string; other: string }
                      > = {
                        DOCUMENT: {
                          count: folder._count.documents,
                          one: _(msg`1 document`),
                          other: _(msg`${folder._count.documents} documents`),
                        },
                        TEMPLATE: {
                          count: folder._count.templates,
                          one: _(msg`1 template`),
                          other: _(msg`${folder._count.templates} templates`),
                        },
                        CHAT: {
                          count: folder._count.documents,
                          one: _(msg`1 file`),
                          other: _(msg`# files`),
                        },
                        CONTRACT: {
                          count: folder._count.documents,
                          one: _(msg`1 contract`),
                          other: _(msg`# contracts`),
                        },
                        FILE: {
                          count: folder._count.files,
                          one: _(msg`1 file`),
                          other: _(msg`${folder._count.files} files`),
                        },
                      };
                      const { count, one, other } = typeMap[folder.type];
                      return (
                        <Plural
                          value={count}
                          one={<Trans>{one}</Trans>}
                          other={<Trans>{other}</Trans>}
                        />
                      );
                    })()}
                  </span>
                  <span>•</span>
                  <span>
                    <Plural
                      value={folder._count.subfolders}
                      one={<Trans># folder</Trans>}
                      other={<Trans># folders</Trans>}
                    />
                  </span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    data-testid="folder-card-more-button"
                  >
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent onClick={(e) => e.stopPropagation()} align="end">
                  <DropdownMenuItem onClick={() => onMove(folder)}>
                    <ArrowRightIcon className="mr-2 h-4 w-4" />
                    <Trans>Move</Trans>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => (folder.pinned ? onUnpin(folder.id) : onPin(folder.id))}
                  >
                    <PinIcon className="mr-2 h-4 w-4" />
                    {folder.pinned ? <Trans>Unpin</Trans> : <Trans>Pin</Trans>}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onSettings(folder)}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <Trans>Settings</Trans>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => onDelete(folder)}>
                    <TrashIcon className="mr-2 h-4 w-4" />
                    <Trans>Delete</Trans>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export const FolderCardEmpty = ({ type }: { type: FolderType }) => {
  return (
    <Card className="hover:bg-muted/50 border-border h-full border transition-all">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <FolderPlusIcon className="text-muted-foreground/60 h-6 w-6" />

          <div>
            <h3 className="text-muted-foreground flex items-center gap-2 font-medium">
              <Trans>Create folder</Trans>
            </h3>

            <div className="text-muted-foreground/60 mt-1 flex space-x-2 truncate text-xs">
              {type === FolderType.DOCUMENT ? (
                <Trans>Organise your documents</Trans>
              ) : (
                <Trans>Organise your templates</Trans>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
