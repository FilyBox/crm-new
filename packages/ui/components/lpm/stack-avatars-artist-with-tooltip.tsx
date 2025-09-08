import { useLingui } from '@lingui/react';

import { artistAbbreviation } from '@documenso/lib/utils/recipient-formatter';
import { PopoverHover } from '@documenso/ui/primitives/popover';

import { StackAvatarArtist } from './stack-avatar-artist';
import { StackAvatarsArtist } from './stack-avatars-artist';

type enhancedAssignees = {
  artistName: string | null;
  id: number;
};

export type StackAvatarsWithTooltipProps = {
  enhancedAssignees: Array<{
    artistName: string | null;
    id: number;
  }>;
  position?: 'top' | 'bottom';
  children?: React.ReactNode;
};

export const StackAvatarsArtistWithTooltip = ({
  enhancedAssignees,
  position,
  children,
}: StackAvatarsWithTooltipProps) => {
  const { _ } = useLingui();

  // const waitingRecipients = recipients.filter(
  //   (recipient) => getRecipientType(recipient) === RecipientStatusType.WAITING,
  // );

  // const openedRecipients = recipients.filter(
  //   (recipient) => getRecipientType(recipient) === RecipientStatusType.OPENED,
  // );

  // const completedRecipients = recipients.filter(
  //   (recipient) => getRecipientType(recipient) === RecipientStatusType.COMPLETED,
  // );

  // const uncompletedRecipients = recipients.filter(
  //   (recipient) => getRecipientType(recipient) === RecipientStatusType.UNSIGNED,
  // );

  // const rejectedRecipients = recipients.filter(
  //   (recipient) => getRecipientType(recipient) === RecipientStatusType.REJECTED,
  // );

  // const sortedRecipients = useMemo(() => {
  //   const otherRecipients = recipients.filter(
  //     (recipient) => getRecipientType(recipient) !== RecipientStatusType.REJECTED,
  //   );

  //   return [
  //     ...rejectedRecipients.sort((a, b) => a.id - b.id),
  //     ...otherRecipients.sort((a, b) => {
  //       return a.id - b.id;
  //     }),
  //   ];
  // }, [recipients]);

  return (
    <PopoverHover
      trigger={children || <StackAvatarsArtist enhancedAssignees={enhancedAssignees} />}
      contentProps={{
        className: 'flex flex-col gap-y-5 py-2',
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
                fallbackText={artistAbbreviation(enhancedAssignees)}
              />

              <div>
                <p className="text-muted-foreground/70 text-xs">{enhancedAssignees.artistName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PopoverHover>
  );
};
