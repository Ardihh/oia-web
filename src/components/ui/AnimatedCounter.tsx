'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

interface AnimatedCounterProps {
  value: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = '',
  duration = 0.8, // 800ms per DESIGN.md Section 7
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = useReducedMotion();
  const [count, setCount] = useState<string>(value);

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;

    const numeric = parseInt(value, 10);
    if (!isNaN(numeric) && numeric > 0) {
      let startTime: number | null = null;
      let animationFrame: number;

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        // Easing per DESIGN.md
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * numeric);
        setCount(current.toString());

        if (progress < 1) {
          animationFrame = requestAnimationFrame(step);
        } else {
          setCount(value);
        }
      };

      animationFrame = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, value, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      <span>{count}</span>
      {suffix && <span className="ml-0.5">{suffix}</span>}
    </span>
  );
}
