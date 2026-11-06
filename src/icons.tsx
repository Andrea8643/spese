const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const S = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...P}>
    {children}
  </svg>
)
export const IHome = () => <S><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></S>
export const IList = () => <S><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></S>
export const IChart = () => <S><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></S>
export const IPiggy = () => <S><path d="M19 9.5c1 .5 2 1.6 2 3 0 1-1 1.5-1 1.5l-1 3h-3v-1.5a8 8 0 0 1-5 0V17H8l-1-2.5C5.5 13.5 4 12 4 10a6 6 0 0 1 6-6h3a6 6 0 0 1 4.5 2L20 5l-1 4.5ZM15 9h.01" /></S>
export const ISettings = () => <S><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></S>
export const IPlus = () => <S><path d="M12 5v14M5 12h14" /></S>
export const IChevL = () => <S><path d="m15 18-6-6 6-6" /></S>
export const IChevR = () => <S><path d="m9 18 6-6-6-6" /></S>
export const IX = () => <S><path d="M18 6 6 18M6 6l12 12" /></S>
export const ITrash = () => <S><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></S>
export const IRepeat = () => <S><path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" /></S>
export const ISearch = () => <S><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></S>
export const ISpark = () => <S><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></S>
export const ILogout = () => <S><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></S>
export const IWarn = () => <S><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01" /></S>
export const ICheck = () => <S><path d="M20 6 9 17l-5-5" /></S>
