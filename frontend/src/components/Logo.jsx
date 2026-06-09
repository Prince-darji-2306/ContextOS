export function Logo({ size = 28, showText = true }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stopColor="#6C63FF" />
            <stop offset="100%" stopColor="#0FCEAC" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" stroke="url(#lg)" strokeWidth="2" />
        <circle cx="16" cy="16" r="3" fill="url(#lg)" />
        <circle cx="6" cy="10" r="2" fill="#6C63FF" />
        <circle cx="26" cy="10" r="2" fill="#0FCEAC" />
        <circle cx="6" cy="22" r="2" fill="#0FCEAC" />
        <circle cx="26" cy="22" r="2" fill="#6C63FF" />
        <line x1="16" y1="16" x2="6" y2="10" stroke="url(#lg)" strokeWidth="1" opacity="0.5" />
        <line x1="16" y1="16" x2="26" y2="10" stroke="url(#lg)" strokeWidth="1" opacity="0.5" />
        <line x1="16" y1="16" x2="6" y2="22" stroke="url(#lg)" strokeWidth="1" opacity="0.5" />
        <line x1="16" y1="16" x2="26" y2="22" stroke="url(#lg)" strokeWidth="1" opacity="0.5" />
      </svg>
      {showText && <span className="font-bold tracking-tight text-base">ContextOS</span>}
    </div>
  )
}
