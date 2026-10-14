import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'light' | 'outline-light'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--primary)] text-white dark:text-[#060D1F] hover:bg-[var(--primary-hover)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
  secondary:
    'border-[1.5px] border-[var(--primary)] bg-transparent text-[var(--primary)] hover:bg-[var(--accent-soft)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2',
  ghost: 'text-[var(--text-body)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]',
  accent: 'bg-[var(--accent)] text-[#060D1F] hover:bg-[var(--accent-hover)] font-semibold',
  light: 'bg-[var(--bg-control)] text-[var(--primary)] hover:bg-[var(--bg-dropdown)] shadow-sm border border-[var(--border)]',
  'outline-light': 'border border-white/30 text-white hover:bg-white/10',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: LinkProps & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {children}
    </Link>
  )
}
