import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

import { cn } from './cn';

/**
 * The one call-to-action primitive. Renders a `<button>`, an in-app `<Link>`
 * (`to`) or a plain `<a>` (`href`) — never a `div` with a click handler, so
 * keyboard operation and the global focus ring come for free.
 *
 * Colour rules (see src/styles/tokens.ts): `brand-500` is a fill colour only.
 * White text sits on `brand-700` (5.1:1); on dark grounds the fill flips to
 * `brand-500` with `ink-900` text (8.7:1).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'onDark';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-md text-center font-semibold ' +
  'transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-stone-50 hover:bg-ink-900',
  secondary: 'bg-stone-50 text-ink-900 border border-stone-200 hover:border-brand-600',
  ghost: 'text-brand-700 underline-offset-4 hover:text-ink-900 hover:underline',
  onDark: 'bg-brand-500 text-ink-900 hover:bg-brand-300',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'text-small px-4 py-2',
  md: 'text-body px-5 py-2.5',
  lg: 'text-body px-7 py-3.5',
};

type CommonProps = {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  fullWidth?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
};

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    to?: undefined;
    href?: undefined;
  };

type RouterLinkProps = CommonProps &
  Omit<LinkProps, 'className' | 'children' | 'to'> & { to: string; href?: undefined };

type ExternalLinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & {
    href: string;
    to?: undefined;
  };

export type ButtonProps = NativeButtonProps | RouterLinkProps | ExternalLinkProps;

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  extra?: string,
): string {
  return cn(base, variantClass[variant], sizeClass[size], extra);
}

export function Button(props: ButtonProps) {
  const { variant, size, fullWidth = false, className, children } = props;
  const classes = buttonClasses(variant, size, cn(fullWidth && 'w-full', className));

  if (props.to !== undefined) {
    const {
      variant: _variant,
      size: _size,
      fullWidth: _fullWidth,
      className: _className,
      children: _children,
      href: _href,
      to,
      ...rest
    } = props;

    return (
      <Link {...rest} to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (props.href !== undefined) {
    const {
      variant: _variant,
      size: _size,
      fullWidth: _fullWidth,
      className: _className,
      children: _children,
      to: _to,
      href,
      ...rest
    } = props;

    return (
      <a {...rest} href={href} className={classes}>
        {children}
      </a>
    );
  }

  const {
    variant: _variant,
    size: _size,
    fullWidth: _fullWidth,
    className: _className,
    children: _children,
    to: _to,
    href: _href,
    type,
    ...rest
  } = props;

  return (
    <button {...rest} type={type ?? 'button'} className={classes}>
      {children}
    </button>
  );
}
