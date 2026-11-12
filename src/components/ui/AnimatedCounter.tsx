'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';

interface AnimatedCounterProps {
  value: string | number;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = '',
  duration = 1.4,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const target = parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!isInView || target <= 0) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      // Ease-out cubic: starts quickly and smoothly rolls to a stop at the target
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(easeOut * target);

      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      <span>{isInView ? count.toLocaleString('id-ID') : 0}</span>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}
