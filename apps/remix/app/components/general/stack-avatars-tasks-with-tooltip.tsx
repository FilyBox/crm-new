import { useLingui } from '@lingui/react';

import { usereAbbreviation } from '@documenso/lib/utils/recipient-formatter';
import { PopoverHover } from '@documenso/ui/primitives/popover';

import { StackAvatarTask } from './stack-avatar-task';
import { StackAvatarsTasks } from './stack-avatars-tasks';

type enhancedAssignees = {
  name: string | null;
  email: string;
};

export type StackAvatarsWithTooltipProps = {
  enhancedAssignees: Array<{
    name: string | null;
    email: string;
  }>;
  position?: 'top' | 'bottom';
  children?: React.ReactNode;
};

export const StackAvatarsTasksWithTooltip = ({
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
      trigger={children || <StackAvatarsTasks enhancedAssignees={enhancedAssignees} />}
      contentProps={{
        className: 'flex flex-col gap-y-5 py-2',
        side: position,
      }}
    >
      {enhancedAssignees.length > 0 && (
        <div>
          {enhancedAssignees.map((enhancedAssignees: enhancedAssignees) => (
            <div key={enhancedAssignees.email} className="my-1 flex items-center gap-2">
              <StackAvatarTask
                first={true}
                key={enhancedAssignees.email}
                fallbackText={usereAbbreviation(enhancedAssignees)}
              />

              <div>
                <p className="text-muted-foreground text-sm">{enhancedAssignees.email}</p>
                <p className="text-muted-foreground/70 text-xs">{enhancedAssignees.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </PopoverHover>
  );
};
