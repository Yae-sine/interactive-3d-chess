interface CrestProps {
  size?: number
  className?: string
}

/** Brass monogram crest — brand mark for the Atelier & Magnus. */
export function Crest({ size = 34, className }: CrestProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <circle cx="20" cy="20" r="19" fill="#16110c" stroke="url(#g-brass)" strokeWidth="1.6" />
      <circle cx="20" cy="20" r="13.5" fill="none" stroke="url(#g-brass)" strokeWidth="0.8" opacity="0.65" />
      <path
        d="M13 25.5 V14.5 L20 20.5 L27 14.5 V25.5"
        fill="none"
        stroke="url(#g-brass)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="9.2" r="1.15" fill="#e8c98a" />
    </svg>
  )
}