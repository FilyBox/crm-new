import { Avatar, AvatarFallback } from '@documenso/ui/primitives/avatar';

const ZIndexes: { [key: string]: string } = {
  '10': 'z-10',
  '20': 'z-20',
  '30': 'z-30',
  '40': 'z-40',
  '50': 'z-50',
};

export type StackAvatarProps = {
  first?: boolean;
  zIndex?: string;
  fallbackText?: string;
};

export const StackAvatarTask = ({ first, zIndex, fallbackText = '' }: StackAvatarProps) => {
  const classes = '';
  let zIndexClass = '';
  const firstClass = first ? '' : '-ml-3';

  if (zIndex) {
    zIndexClass = ZIndexes[zIndex] ?? '';
  }

  return (
    <Avatar
      className={` ${zIndexClass} ${firstClass} dark:border-border h-8 w-8 border-2 border-solid border-white`}
    >
      <AvatarFallback className={'flex items-center justify-center bg-black p-1 text-[10px]'}>
        {fallbackText}
      </AvatarFallback>
    </Avatar>
  );
};
