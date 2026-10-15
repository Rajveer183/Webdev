import { brand } from '../../config/brand'

/** An uploaded business logo (Admin → Settings → Logos) on a white disc so it stays legible in dark mode. Renders nothing until one is uploaded. */
export function LogoMark({ className = 'h-10 w-10', src }: { className?: string; src?: string | null }) {
  if (!src) return null
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white p-0.5 ring-1 ring-line ${className}`}>
      <img src={src} alt="" width={40} height={40} className="h-full w-full object-contain" />
    </span>
  )
}

export function Logo({ name = brand.name, imageUrl }: { name?: string; imageUrl?: string | null }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark src={imageUrl} />
      <span className="text-[1.02rem] font-semibold tracking-tight text-[var(--header-text)]">{name}</span>
    </span>
  )
}
