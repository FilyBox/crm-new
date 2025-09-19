import { useLingui } from '@lingui/react';

import { artistTaskAbbreviation } from '@documenso/lib/utils/recipient-formatter';
import { PopoverHover } from '@documenso/ui/primitives/popover';

import { StackAvatarArtist } from './stack-avatar-artist';
import { StackAvatarsArtistNew } from './stack-avatars-artist-new';

type enhancedAssignees = {
  name: string;
  id: number;
};

export type StackAvatarsWithTooltipProps = {
  enhancedAssignees: Array<{
    name: string;
    id: number;
  }>;
  position?: 'top' | 'bottom';
  children?: React.ReactNode;
};

export const StackAvatarsArtistWithTooltipNew = ({
  enhancedAssignees,
  position,
  children,
}: StackAvatarsWithTooltipProps) => {
  const { _ } = useLingui();

  return (
    <PopoverHover
      trigger={children || <StackAvatarsArtistNew enhancedAssignees={enhancedAssignees} />}
      contentProps={{
        className: 'flex flex-col gap-y-5 py-2 ',
        side: position,
      }}
    >
      {enhancedAssignees.length > 0 && (
        <div>
          {enhancedAssignees.map((enhancedAssignees: enhancedAssignees) => (
            <div key={enhancedAssignees.id} className="my-1 flex items-center gap-2">
              <StackAvatarArtist
                first={true}
                key={enhancedAssignees.id}
                fallbackText={artistTaskAbbreviation(enhancedAssignees)}
              />

              <div>
                <p className="text-muted-foreground/70 text-xs">{enhancedAssignees.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PopoverHover>
  );
};
