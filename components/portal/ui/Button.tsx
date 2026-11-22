import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  // Filled variants carry a subtle top-light gradient and bloom on hover so
  // they read as lit objects rather than flat swatches.
  //
  // The gradient must be spelled `bg-linear-to-*` (the Tailwind v4 name). The
  // v3 spelling `bg-gradient-to-*` still generates CSS, but tailwind-merge 3
  // does not recognise it, reads it as a background *colour*, and lets it
  // override bg-brand / the accent / bg-signal-danger in cn() — every filled
  // button rendered with a transparent background until this was changed.
  primary:
    'text-brand-contrast bg-brand shadow-sm hover:opacity-95 hover:shadow',
  accent:
    'text-accent-contrast bg-[color:rgb(var(--accent-vivid))] shadow-sm hover:opacity-95 hover:shadow',
  secondary:
    'bg-surface-raised text-ink border border-hairline-strong shadow-e-1 ' +
    'hover:bg-surface-sunken hover:border-ink-faint',
  outline:
    'border border-hairline-strong text-ink bg-transparent ' +
    'hover:bg-surface-sunken hover:border-ink-faint hover:shadow-e-1',
  ghost:
    'text-ink-muted bg-transparent hover:bg-surface-sunken hover:text-ink',
  danger:
    'text-white bg-signal-danger shadow-sm hover:opacity-95 hover:shadow',
  link:
    'text-accent bg-transparent underline-offset-4 hover:underline p-0 h-auto shadow-none',
};

const sizes: Record<Size, string> = {
  sm: 'h-10 md:h-9 px-3.5 text-caption gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-caption gap-2 rounded-xl',
  lg: 'h-12 px-6 text-body gap-2.5 rounded-xl',
  xl: 'h-14 px-8 text-body-lg gap-3 rounded-2xl',
  icon: 'h-10 w-10 p-0 gap-0 rounded-xl',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'relative inline-flex items-center justify-center font-semibold font-display',
        'whitespace-nowrap select-none',
        'transition-all duration-200 ease-editorial',
        'active:scale-[0.98]',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant !== 'link' && sizes[size],
        variants[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />
      ) : (
        leftIcon
      )}
      {children != null && children !== false && <span>{children}</span>}
      {!isLoading && rightIcon}
    </button>
  )
);

Button.displayName = 'Button';
