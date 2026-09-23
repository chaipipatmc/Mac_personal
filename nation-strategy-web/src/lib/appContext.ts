import { createContext, useContext } from 'react'
import type { SceneId, Selection, TimelineFocus } from './selection'

export interface AppApi {
  selection: Selection | null
  /** Open the detail panel. `trigger` gets focus back when the panel closes. */
  select: (sel: Selection, trigger?: HTMLElement | null) => void
  close: () => void
  goScene: (scene: SceneId, focus?: TimelineFocus) => void
  /** Jump to the Timeline scene with a row/milestone/task selected. */
  openInTimeline: (focus: TimelineFocus) => void
  timelineFocus: TimelineFocus
  isSelected: (kind: Selection['kind'], id: string) => boolean
}

export const AppContext = createContext<AppApi | null>(null)

export function useApp(): AppApi {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('AppContext missing')
  return ctx
}
