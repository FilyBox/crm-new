import { useEffect, useRef, useState } from 'react';
import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { ExpandIcon } from 'lucide-react';

import { cn } from '@documenso/ui/lib/utils';
import { Button } from '@documenso/ui/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@documenso/ui/primitives/card';

import { useIsActiveStore } from '~/storage/active-full-container';

import { MessageInput } from './chat/message-input';

type ChartLineLabelProps = {
  className?: string;
  title: string;
  description?: string;
  Icon?: LucideIcon;
  children: React.ReactNode;
  noFullSizeChildren?: React.ReactNode;
  identifier: string;
  fullScreenButton?: boolean;
  cardContentClassName?: string;
};

export function FullSizeCard({
  title,
  description,
  Icon,
  children,
  identifier,
  className,
  cardContentClassName,
  fullScreenButton = true,
}: ChartLineLabelProps) {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { setIsActive } = useIsActiveStore();

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setActiveGame(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setIsActive(activeGame !== null);
  }, [activeGame, setIsActive]);

  return (
    <>
      <AnimatePresence>
        {activeGame ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overlay bg-[#F7F7F7] dark:bg-[#1f1e1e]"
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {activeGame ? (
          <div className="active-game fixed bottom-0 z-50 flex items-center justify-center">
            <motion.div
              layoutId={`card-${identifier || title}`}
              className="inner mb-5"
              style={{ borderRadius: 12 }}
              ref={ref}
            >
              <Card className="col-span-1 h-full w-full px-2 pt-2">
                <CardHeader className="flex max-h-8 flex-col items-start gap-0 px-2">
                  <motion.div
                    layoutId={`title-header-${title}`}
                    className="flex w-full items-center justify-between gap-2"
                  >
                    <div className="game-title flex items-center gap-2">
                      {Icon && <Icon className="text-primary h-5 w-5" />}
                      <CardTitle className="text-base font-bold md:text-xl">{title}</CardTitle>
                    </div>

                    <Button
                      onClick={() => setActiveGame(null)}
                      size={'icon'}
                      variant={'ghost'}
                      className="-mr-1 h-fit w-fit !p-1"
                    >
                      <ExpandIcon size={16} />
                    </Button>
                  </motion.div>

                  <motion.div layoutId={`description-${title}`}>
                    <CardDescription className="text-foreground text-base">
                      {description}
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                <CardContent style={{ containerType: 'size' }} className="h-full px-2">
                  <motion.div layoutId={`content-${title}`} className="h-full">
                    {children}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <motion.div
        layoutId={`card-${identifier || title}`}
        className={cn('h-full w-full', className)}
      >
        <Card className={cn('flex h-full w-full flex-col gap-0', className)}>
          <CardHeader className="flex flex-col items-start gap-0 p-4 pb-0">
            <motion.div
              layoutId={`title-header-${title}`}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="game-title flex items-center gap-2">
                {Icon && <Icon className="text-primary h-5 w-5" />}
                <CardTitle className="text-base font-bold md:text-xl">Chat</CardTitle>
              </div>
              {fullScreenButton && (
                <Button
                  onClick={() => setActiveGame(title)}
                  size={'icon'}
                  variant={'ghost'}
                  className="-mr-1 h-fit w-fit !p-1"
                >
                  <ExpandIcon size={16} />
                </Button>
              )}
            </motion.div>

            <motion.div layoutId={`description-${title}`}>
              <CardDescription className="text-foreground line-clamp-2 text-base">
                {description}
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className={cn('p-4 pt-0', cardContentClassName)}>
            <motion.div layoutId={`content-${title}`} className="h-fit">
              <div onClick={() => setActiveGame(title)} className="z-10 h-fit w-full">
                <MessageInput className="" allowAttachments={false} value="" isGenerating />
              </div>
              <div className="h-0 overflow-hidden">{children}</div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
