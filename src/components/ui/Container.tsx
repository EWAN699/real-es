import type { ElementType, ReactNode } from 'react';

import { cn } from './cn';

/**
 * Horizontal gutter + max measure — the single place the page width is decided.
 *
 * `mx-*` and `px-*` compile to `margin-inline` / `padding-inline` in Tailwind v4,
 * so they are already logical and safe under RTL.
 */
export type ContainerWidth = 'default' | 'narrow' | 'prose';

const widthClass: Record<ContainerWidth, string> = {
  default: 'max-w-[80rem]',
  narrow: 'max-w-4xl',
  prose: 'max-w-2xl',
};

export type ContainerProps = {
  as?: ElementType | undefined;
  width?: ContainerWidth | undefined;
  className?: string | undefined;
  id?: string | undefined;
  children: ReactNode;
};

export function Container({
  as: Tag = 'div',
  width = 'default',
  className,
  id,
  children,
}: ContainerProps) {
  return (
    <Tag
      id={id}
      className={cn('mx-auto w-full px-5 md:px-10', widthClass[width], className)}
    >
      {children}
    </Tag>
  );
}
