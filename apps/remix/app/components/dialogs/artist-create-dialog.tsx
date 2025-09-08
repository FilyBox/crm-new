import { useState } from 'react';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Trans } from '@lingui/react/macro';
import { FilePlus } from 'lucide-react';
import { toast } from 'sonner';

import { useSession } from '@documenso/lib/client-only/providers/session';
import { trpc } from '@documenso/trpc/react';
import { Button } from '@documenso/ui/primitives/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@documenso/ui/primitives/dialog';
import { Input } from '@documenso/ui/primitives/input';

type ArtistCreateDialogProps = {
  teamId?: number;
};

type Role = 'USER' | 'ADMIN'; // Enum según tu backend

export const ArtistCreateDialog = ({ teamId: _teamId }: ArtistCreateDialogProps) => {
  const { user } = useSession();
  const { _ } = useLingui();

  const { mutateAsync: createArtist } = trpc.artist.createArtist.useMutation();

  const [showArtistCreateDialog, setShowArtistCreateDialog] = useState(false);
  const [isCreatingArtist, setIsCreatingArtist] = useState(false);
  const [artistData, setArtistData] = useState<{
    name: string;
    role: Role[];
    event: string[];
    song: string[];
    url: string;
    disabled?: boolean;
    teamId?: number;
  }>({
    name: '',
    role: [],
    event: [],
    song: [],
    url: '',
    disabled: false,
    teamId: _teamId,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'teamId') {
      setArtistData((prev) => ({ ...prev, teamId: value ? Number(value) : undefined }));
    } else {
      setArtistData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setArtistData((prev) => ({ ...prev, [name]: value ? [value as Role] : [] }));
  };

  const onCreateArtist = async () => {
    if (isCreatingArtist || !user.id) return;
    setIsCreatingArtist(true);
    try {
      toast.promise(
        createArtist({
          name: artistData.name,
          // role: artistData.role,
          // event: artistData.event,
          // song: artistData.song,
          // url: artistData.url,
          // disabled: artistData.disabled,
        }),
        {
          loading: _(msg`Creating artists...`),
          success: _(msg`Artist created successfully`),
          position: 'bottom-center',
          className: 'mb-16',
        },
      );
      const artist = await createArtist({
        name: artistData.name,
        // role: artistData.role,
        // event: artistData.event,
        // song: artistData.song,
        // url: artistData.url,
        // disabled: artistData.disabled,
      });

      setShowArtistCreateDialog(false);
      setIsCreatingArtist(false);
    } catch (error) {
      if (error.message === 'Artist already exists') {
        toast.error(_(msg`An artist with this name already exists.`), {
          className: 'mb-16',
          position: 'bottom-center',
        });

        setIsCreatingArtist(false);
        return;
      }
      toast.error(_(msg`Fail to create artist: ${error.message}`), {
        className: 'mb-16',
        position: 'bottom-center',
      });

      setIsCreatingArtist(false);
    }
  };

  const canCreateArtist = Boolean(user.id) && !isCreatingArtist && artistData.name;

  return (
    <Dialog
      open={showArtistCreateDialog}
      onOpenChange={(value) => !isCreatingArtist && setShowArtistCreateDialog(value)}
    >
      <DialogTrigger asChild>
        <Button className="w-full cursor-pointer sm:w-fit" disabled={!user.emailVerified}>
          <FilePlus className="-ml-1 mr-2 h-4 w-4" />
          <Trans>New Artist</Trans>
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle>
            <Trans>Create New Artist</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Create a new artist with details like name, roles, events, songs, and url.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-100">
              <Trans>Name</Trans>
            </label>
            <Input
              disabled={isCreatingArtist}
              id="name"
              name="name"
              value={artistData.name}
              onChange={handleInputChange}
              className="mt-1"
              required
            />
          </div>

          {/* <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-100">
              <Trans>Role</Trans>
            </label>
            <select
              id="role"
              name="role"
              value={artistData.role[0] || ''}
              onChange={handleSelectChange}
              className="mt-1"
            >
              <option value="">
                <Trans>Select role</Trans>
              </option>
              <option value="USER">
                <Trans>user</Trans>
              </option>
              <option value="ADMIN">
                <Trans>admin</Trans>
              </option>
            </select>
          </div>

          <div>
            <label htmlFor="teamId" className="block text-sm font-medium text-gray-100">
              <Trans>Team Id</Trans>
            </label>
            <Input
              id="teamId"
              name="teamId"
              type="number"
              value={artistData.teamId ?? ''}
              onChange={handleInputChange}
              className="mt-1"
            />
          </div> */}
        </div>

        {/* {isCreatingArtist && (
          <div className="flex items-center justify-center rounded-lg py-4">
            <Loader className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        )} */}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isCreatingArtist}>
              <Trans>Cancel</Trans>
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={onCreateArtist}
            loading={isCreatingArtist}
            disabled={!canCreateArtist}
          >
            <Trans>Create Artist</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
