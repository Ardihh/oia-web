import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
  className?: string;
}

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = 'left',
  light = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-3xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className
      )}
    >
      {kicker && (
        <p
          className={cn(
            'text-[12px] sm:text-[13px] font-medium uppercase tracking-[0.12em] mb-3',
            light ? 'text-blue-300' : 'text-ink-soft'
          )}
        >
          {kicker}
        </p>
      )}
      <h2
        className={cn(
          'font-serif text-3xl sm:text-4xl lg:text-[42px] font-normal leading-[1.15] tracking-[-0.02em]',
          light ? 'text-paper' : 'text-ink'
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'mt-4 text-base sm:text-lg leading-[1.65] max-w-[64ch]',
            light ? 'text-blue-200/90' : 'text-ink-soft'
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

