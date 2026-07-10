import { useId } from 'react'

/**
 * The PrintEase brand mark, recreated as SVG from the Flutter app's
 * code-drawn icon (lib/widgets/app_icon.dart): a crisp white sheet with a
 * folded corner and bold printed lines rising out of a floating dock, on a
 * top-lit dark tile with dot-grid texture — and the single green
 * "ready to collect" status dot.
 */
export function AppIcon({ size = 40, className }: { size?: number; className?: string }) {
  const id = useId()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-tile`} x1="256" y1="0" x2="256" y2="512" gradientUnits="userSpaceOnUse">
          <stop stopColor="#212127" />
          <stop offset="1" stopColor="#0B0B0D" />
        </linearGradient>
        <linearGradient id={`${id}-dock`} x1="256" y1="352" x2="256" y2="434" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2C2C33" />
          <stop offset="1" stopColor="#121216" />
        </linearGradient>
        <pattern id={`${id}-dots`} width="52" height="52" patternUnits="userSpaceOnUse">
          <circle cx="26" cy="26" r="3.4" fill="#FFFFFF" fillOpacity="0.07" />
        </pattern>
        <clipPath id={`${id}-clip`}>
          <rect width="512" height="512" rx="120" />
        </clipPath>
        <filter id={`${id}-sheetShadow`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="9" floodColor="#000000" floodOpacity="0.38" />
        </filter>
        <filter id={`${id}-dockShadow`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000000" floodOpacity="0.45" />
        </filter>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        {/* tile + texture + inner hairline */}
        <rect width="512" height="512" fill={`url(#${id}-tile)`} />
        <rect width="512" height="512" fill={`url(#${id}-dots)`} />
        <rect x="3" y="3" width="506" height="506" rx="118" stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="6" />

        {/* paper sheet with folded corner + print lines */}
        <g transform="translate(256 225) rotate(-8)" filter={`url(#${id}-sheetShadow)`}>
          <path
            d="M -95 -161 L 59 -161 L 125 -95 L 125 131 Q 125 161 95 161 L -95 161 Q -125 161 -125 131 L -125 -131 Q -125 -161 -95 -161 Z"
            fill="#FFFFFF"
          />
          <path d="M 59 -161 L 125 -95 L 59 -95 Z" fill="#E2E2E8" />
          <path d="M 59 -161 L 125 -95" stroke="#CFCFD6" strokeWidth="3" />
          <rect x="-85" y="-56" width="118" height="26" rx="13" fill="#17171B" />
          <rect x="-85" y="-8" width="166" height="26" rx="13" fill="#17171B" />
          <rect x="-85" y="40" width="92" height="26" rx="13" fill="#C9C9CF" />
        </g>

        {/* floating dock bar */}
        <g filter={`url(#${id}-dockShadow)`}>
          <rect x="90" y="352" width="332" height="82" rx="41" fill={`url(#${id}-dock)`} />
          <rect x="92" y="354" width="328" height="78" rx="39" stroke="#FFFFFF" strokeOpacity="0.16" strokeWidth="4" />
        </g>

        {/* the single green "ready to collect" status dot */}
        <circle cx="376" cy="393" r="20" fill="#34C759" fillOpacity="0.22" />
        <circle cx="376" cy="393" r="12" fill="#34C759" />
      </g>
    </svg>
  )
}
