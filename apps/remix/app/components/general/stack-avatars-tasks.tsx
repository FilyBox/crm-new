import { usereAbbreviation } from '@documenso/lib/utils/recipient-formatter';

import { StackAvatarTask } from './stack-avatar-task';

type enhancedAssignees = {
  name: string | null;
  email: string;
};
export function StackAvatarsTasks({
  enhancedAssignees,
}: {
  enhancedAssignees: enhancedAssignees[];
}) {
  const renderStackAvatars = (enhancedAssignees: enhancedAssignees[]) => {
    const zIndex = 50;
    const itemsToRender = enhancedAssignees.slice(0, 5);
    const remainingItems = enhancedAssignees.length - itemsToRender.length;

    return itemsToRender.map((enhancedAssignees: enhancedAssignees, index: number) => {
      const first = index === 0;

      if (index === 4 && remainingItems > 0) {
        return (
          <StackAvatarTask
            key="extra-recipient"
            first={first}
            zIndex={String(zIndex - index * 10)}
            fallbackText={`+${remainingItems + 1}`}
          />
        );
      }

      return (
        <StackAvatarTask
          key={enhancedAssignees.email}
          first={first}
          zIndex={String(zIndex - index * 10)}
          fallbackText={usereAbbreviation(enhancedAssignees)}
        />
      );
    });
  };

  return <>{renderStackAvatars(enhancedAssignees)}</>;
}
