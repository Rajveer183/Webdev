import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'light' | 'outline-light'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-150 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap'

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-brand-fg hover:bg-brand-hover shadow-sm',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink hover:bg-surface-2',
  accent: 'bg-accent text-white hover:bg-accent-strong dark:text-[#04201d]',
  light: 'bg-white text-[#0b1736] hover:bg-slate-100 shadow-sm',
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
