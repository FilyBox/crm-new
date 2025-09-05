import { type MouseEvent, useEffect, useState } from 'react';

import {
  type MotionStyle,
  type MotionValue,
  motion,
  useMotionTemplate,
  useMotionValue,
} from 'framer-motion';

import { cn } from '../lib/utils';

type WrapperStyle = MotionStyle & {
  '--x': MotionValue<string>;
  '--y': MotionValue<string>;
};

interface CardProps {
  className?: string;
}

export function FeatureCard({
  className,
  children,
}: CardProps & {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const isMobile = useIsMobile();

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    if (isMobile) return;
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <motion.div
      className="animated-cards relative w-full rounded-lg"
      onMouseMove={handleMouseMove}
      style={
        {
          '--x': useMotionTemplate`${mouseX}px`,
          '--y': useMotionTemplate`${mouseY}px`,
        } as WrapperStyle
      }
    >
      <div
        className={cn(
          'bg-background border-foreground/10 group relative w-full overflow-hidden rounded-lg border-2',
          'p-6 md:hover:border-transparent',
          className,
        )}
      >
        <div className="min-h-[550px] w-full">{mounted ? children : null}</div>
      </div>
    </motion.div>
  );
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSmall = window.matchMedia('(max-width: 768px)').matches;
    const isMobile = Boolean(
      /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.exec(userAgent),
    );

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) setIsMobile(isSmall || isMobile);

    setIsMobile(isSmall && isMobile);
  }, []);

  return isMobile;
}
