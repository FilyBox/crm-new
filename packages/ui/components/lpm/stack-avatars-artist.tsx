import { artistAbbreviation } from '@documenso/lib/utils/recipient-formatter';

import { StackAvatarArtist } from './stack-avatar-artist';

type enhancedAssignees = {
  artistName: string | null;
  id: number;
};
export function StackAvatarsArtist({
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
          <StackAvatarArtist
            key="extra-recipient"
            first={first}
            zIndex={String(zIndex - index * 10)}
            fallbackText={`+${remainingItems + 1}`}
          />
        );
      }

      return (
        <StackAvatarArtist
          key={enhancedAssignees.id}
          first={first}
          zIndex={String(zIndex - index * 10)}
          fallbackText={artistAbbreviation(enhancedAssignees)}
        />
      );
    });
  };

  return <>{renderStackAvatars(enhancedAssignees)}</>;
}
