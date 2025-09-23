import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Link } from 'react-router';

import { Button } from '@documenso/ui/primitives/button';
import { PopoverHover } from '@documenso/ui/primitives/popover';

export type StackAvatarsWithTooltipProps = {
  Links?: Array<{
    name: string;
    id: number;
    url: string;
    publishedAt?: Date;
  }>;
  position?: 'top' | 'bottom';
};

export const LinksWithTooltip = ({ Links, position }: StackAvatarsWithTooltipProps) => {
  if (!Links || Links.length === 0) {
    return null;
  }
  return (
    <PopoverHover
      trigger={<div>Ver</div>}
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
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(links.publishedAt), 'd MMM yyyy', { locale: es })}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">
                  {format(new Date(), 'd MMM yyyy', { locale: es })}
                </p>
                <Button variant="link" className="line-clamp-1 h-fit w-fit p-0 text-xs" asChild>
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
