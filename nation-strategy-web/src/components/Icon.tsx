// Minimal line-icon set (24×24, stroke = currentColor). Drawn for this page —
// symbols only, no robots/brains or brand marks.
const P: Record<string, string> = {
  people: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.5a4 4 0 0 1 0 7.5M22 21v-1a6 6 0 0 0-4-5.6',
  flow: 'M4 5h5v5H4zM15 14h5v5h-5zM9 7.5h4a3 3 0 0 1 3 3V14M15 5h5v5h-5z',
  data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  content: 'M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7',
  community: 'M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 20v-1a5 5 0 0 1 10 0v1M2 18v-.5A3.5 3.5 0 0 1 5.5 14M22 18v-.5a3.5 3.5 0 0 0-3.5-3.5',
  gov: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18',
  local: 'M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  ai: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  tech: 'M4 5h16v11H4zM8 20h8M12 16v4',
  process: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  agile: 'M13 2L4 14h7l-1 8 9-12h-7z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  growth: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  cart: 'M3 4h2l2.5 11h10L20 8H7M9 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2',
  unlock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2M12 15v2',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
  rocket: 'M5 15c-1 1-1.5 4-1.5 4.5.5 0 3.5-.5 4.5-1.5M9 15l-3-3c1-4 4-8 11-9 0 7-5 10-9 11zM15 9a1.5 1.5 0 1 0 0-.01M9 12H5l2-4h4M12 15v4l4-2v-4',
  scale: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2.2.3-1.3-1.3.3-2.2-3-1-1 2h-1.6l-1-2-3 1 .3 2.2L6.2 7.3 4 7 3 10l2 1v1.6l-2 1 1 3 2.2-.3 1.3 1.3L7.2 21l3 1 1-2h1.6l1 2 3-1-.3-2.2 1.3-1.3 2.2.3 1-3-2-1z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  check: 'M4 12l5 5L20 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  briefcase: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18',
  event: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4M9 15l2 2 4-4',
  user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a7 7 0 0 1 14 0v1',
  userCheck: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a7 7 0 0 1 11-5.7M15 18l2 2 5-5',
  key: 'M8 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 11h10M18 11v3M21 11v2',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  handoff: 'M3 12h7l3-3M21 12h-7l-3 3M8 7l-5 5 5 5M16 7l5 5-5 5',
  gauge: 'M12 20a8 8 0 1 1 8-8M12 12l4-4M4 20h16',
  swap: 'M4 8h14l-3-3M20 16H6l3 3',
  parallel: 'M4 7h16M4 12h16M4 17h16',
  arrow: 'M4 12h16M14 6l6 6-6 6',
  review: 'M4 4h16v12H8l-4 4zM8 9h8M8 12h5',
  stack: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  money: 'M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 10v.01M18 14v.01',
  decision: 'M12 3v18M5 7h14M5 7l-2 6a3 3 0 0 0 4 0zM19 7l-2 6a3 3 0 0 0 4 0zM8 21h8',
  page: 'M4 4h16v16H4zM4 9h16M9 9v11',
  plus: 'M12 5v14M5 12h14',
  building: 'M4 21V5l8-3v19M12 8h8v13M8 8h.01M8 12h.01M8 16h.01M16 12h.01M16 16h.01M2 21h20',
}

export type IconName = keyof typeof P

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg className={`ico${className ? ` ${className}` : ''}`} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={P[name]} />
    </svg>
  )
}

export const WS_ICON: Record<string, IconName> = {
  R1: 'people', R2: 'flow', R3: 'data', R4: 'content', R5: 'community', R6: 'gov', R7: 'local',
}
