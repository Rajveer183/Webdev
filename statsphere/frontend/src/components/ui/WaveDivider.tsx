import type { SVGProps } from 'react'

export interface WaveDividerProps extends SVGProps<SVGSVGElement> {
  color?: string
  isBand?: boolean
  variant?: 'wave-1' | 'wave-2'
  className?: string
}

export function WaveDivider({
  color,
  isBand = false,
  variant = 'wave-1',
  className = '',
  ...props
}: WaveDividerProps) {
  const fillValue = isBand ? 'url(#wave-band-grad)' : color || 'currentColor'

  return (
    <div className="relative w-full overflow-hidden leading-none pointer-events-none -mb-[1px]">
      <svg
        viewBox="0 0 1440 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={`block w-full h-7 sm:h-11 lg:h-14 ${className}`}
        aria-hidden="true"
        {...props}
      >
        {isBand && (
          <defs>
            <linearGradient id="wave-band-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--hero-from)" />
              <stop offset="100%" stopColor="var(--hero-to)" />
            </linearGradient>
          </defs>
        )}
        {variant === 'wave-1' ? (
          <path
            d="M0,22 C320,44 540,6 740,24 C960,42 1200,8 1440,22 L1440,50 L0,50 Z"
            fill={fillValue}
          />
        ) : (
          <path
            d="M0,18 C380,44 760,4 1140,32 C1260,40 1360,28 1440,20 L1440,50 L0,50 Z"
            fill={fillValue}
          />
        )}
      </svg>
    </div>
  )
}
