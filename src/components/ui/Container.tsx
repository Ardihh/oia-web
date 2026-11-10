import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

export function Container({ children, className, id }: ContainerProps) {
  return (
    <div id={id} className={cn('mx-auto max-w-[1200px] px-5 sm:px-8 lg:px-12', className)}>
      {children}
    </div>
  );
}
