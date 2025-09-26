import { addDays, format, setHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router';

import { Button } from '@documenso/ui/primitives/button';
import { PopoverHover } from '@documenso/ui/primitives/popover';

export type StackAvatarsWithTooltipProps = {
  Links?: Array<{
    name: string;
    id: number;
    url: string;
    publishedAt?: Date | null;
    lyrics?: string | null;
  }>;
  position?: 'top' | 'bottom';
};

export const LinksWithTooltip = ({ Links, position }: StackAvatarsWithTooltipProps) => {
  if (!Links || Links.length === 0) {
    return null;
  }
  return (
    <PopoverHover
      trigger={
        <Button
          onClick={(e) => e.stopPropagation()}
          size={'sm'}
          variant={'secondary'}
          className="w-fit min-w-28 text-center"
        >
          Show
        </Button>
      }
      contentProps={{
        className: 'flex flex-col gap-y-5 py-2 ',
        side: position,
      }}
      className="dark:bg-backgroundDark min-w-96 rounded-2xl"
    >
      {Links.length > 0 && (
        <div className="flex flex-col items-center justify-start gap-y-3">
          {Links.map((links) => (
            <div
              key={links.id}
              className="bg-muted-foreground/10 my-1 flex w-full items-center rounded-xl p-2"
            >
              <div className="flex flex-col items-start justify-start gap-0">
                <p className="text-foregroundtext-sm">{links.name}</p>
                {links.publishedAt && (
                  <>
                    {/* {console.log('normal fecha', links.publishedAt)}
                    {console.log('fecha modificada', addDays(setHours(links.publishedAt, 0), 1))}
                    {console.log('==============================================')} */}
                    <p className="text-muted-foreground text-xs">
                      {format(addDays(setHours(links.publishedAt, 0), 1), 'd MMM yyyy', {
                        locale: es,
                      })}
                    </p>
                  </>
                )}
                <Button
                  onClick={(e) => e.stopPropagation()}
                  variant="link"
                  className="line-clamp-1 h-fit w-fit p-0 text-xs"
                  asChild
                >
                  <Link to={links.url} target="_blank" rel="noreferrer">
                    {links.url}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PopoverHover>
  );
};
