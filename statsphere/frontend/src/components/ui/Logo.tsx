import { brand } from '../../config/brand'

/** The SGT University seal (or an uploaded replacement) on a white disc so it stays legible in dark mode. */
export function LogoMark({ className = 'h-10 w-10', src }: { className?: string; src?: string | null }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-white p-0.5 ring-1 ring-line ${className}`}>
      <img src={src || brand.logo} alt="" width={40} height={40} className="h-full w-full object-contain" />
    </span>
  )
}

export function Logo({ name = brand.name, imageUrl }: { name?: string; imageUrl?: string | null }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark src={imageUrl} />
      <span className="flex flex-col leading-none">
        <span className="text-[1.02rem] font-semibold tracking-tight text-[var(--header-text)]">{name}</span>
        <span className="mt-1 text-[0.7rem] font-medium tracking-wide text-[var(--header-muted)]">{brand.institution.name}</span>
      </span>
    </span>
  )
}
