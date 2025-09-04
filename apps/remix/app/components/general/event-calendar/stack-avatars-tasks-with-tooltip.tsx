import { Trans } from '@lingui/react/macro';

import { artistTaskAbbreviation } from '@documenso/lib/utils/recipient-formatter';
import { Faceted, FacetedBadgeList } from '@documenso/ui/primitives/faceted';
import { PopoverHover } from '@documenso/ui/primitives/popover';

import { StackAvatarTask } from './stack-avatar-task';

type artist = {
  name: string;
  id: number;
  // email: string;
};

export type StackAvatarsWithTooltipProps = {
  artist:
    | Array<{
        name: string;
        id: number;
      }>
    | undefined;
  position?: 'top' | 'bottom';
  children?: React.ReactNode;
};

export const StackAvatarsTasksWithTooltip = ({
  artist,
  position,
  children,
}: StackAvatarsWithTooltipProps) => {
  const artistNamesArray = artist?.map((member) => member.name) || [];
  return (
    <>
      {artist && artist.length > 0 ? (
        <Faceted
          modal={true}
          value={artistNamesArray}
          // onValueChange={(value) => {
          //   setSelectedArtists(value);
          // }}
          multiple={true}
        >
          <PopoverHover
            trigger={
              children || (
                <FacetedBadgeList
                  max={2}
                  options={artist?.map((member) => ({
                    label: member.name,
                    value: member.id.toString(),
                  }))}
                  altTextSelection="artists"
                  // placeholder={_(msg`Select artists...`)}
                  className="h-fit w-fit"
                />
              )
            }
            contentProps={{
              className: 'flex flex-col gap-y-5 py-2 ',
              side: position,
            }}
          >
            {artist && artist.length > 0 && (
              <div>
                {artist.map((artist: artist) => (
                  <div key={artist.id} className="my-1 flex items-center gap-2">
                    <StackAvatarTask
                      first={true}
                      key={artist.id}
                      fallbackText={artistTaskAbbreviation(artist)}
                    />

                    <div>
                      <p className="text-foreground text-xs">{artist.name}</p>
                    </div>
                  </div>
                ))}

                {/* <FacetedBadgeList
                  max={3}
                  options={artist?.map((member) => ({
                    label: member.name,
                    value: member.id.toString(),
                  }))}
                  // placeholder={_(msg`Select artists...`)}
                  className="h-fit"
                /> */}
              </div>
            )}
          </PopoverHover>
        </Faceted>
      ) : (
        <p className="text-muted-foreground/70 text-xs">
          <Trans>No artists specified</Trans>
        </p>
      )}
    </>
  );
};
