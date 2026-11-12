'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion, motion } from 'motion/react';

interface AnimatedCounterProps {
  value: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = '',
  duration = 1.8,
  className = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const shouldReduceMotion = useReducedMotion();

  // If reduced motion is requested, immediately show the full value
  const [count, setCount] = useState<string>(shouldReduceMotion ? value : '0');
  const [isFinished, setIsFinished] = useState(shouldReduceMotion);

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(value);
      setIsFinished(true);
      return;
    }

    if (!isInView) return;

    // Extract numeric part (e.g. "45", "120")
    const cleanNumber = value.replace(/[^0-9]/g, '');
    const numericTarget = parseInt(cleanNumber, 10);

    if (isNaN(numericTarget) || numericTarget === 0) {
      setCount(value);
      setIsFinished(true);
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animateStep = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);

      // Smooth custom ease-out quart curve: fast initial acceleration, graceful deceleration
      const ease = 1 - Math.pow(1 - progress, 4);
      const currentNumber = Math.floor(ease * numericTarget);

      setCount(currentNumber.toLocaleString('id-ID'));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateStep);
      } else {
        setCount(numericTarget.toLocaleString('id-ID'));
        setIsFinished(true);
      }
    };

    animationFrame = requestAnimationFrame(animateStep);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration, shouldReduceMotion]);

  return (
    <span
      ref={ref}
      className={`relative inline-flex items-baseline font-serif tabular-nums tracking-tight ${className}`}
    >
      <span className="text-paper drop-shadow-xs transition-colors">
        {shouldReduceMotion ? value : count}
      </span>

      {suffix && (
        <motion.span
          initial={{ opacity: 0, scale: 0.6, y: -2 }}
          animate={
            isFinished || shouldReduceMotion
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0.3, scale: 0.8, y: -1 }
          }
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 18,
          }}
          className="ml-1 text-accent font-sans font-normal text-[0.8em] select-none inline-block origin-bottom"
        >
          {suffix}
        </motion.span>
      )}
    </span>
  );
}
