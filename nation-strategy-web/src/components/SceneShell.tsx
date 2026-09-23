import type { ReactNode } from 'react'
import type { Basis } from '../data/nationPlan'
import { SCENES, type SceneId } from '../lib/selection'
import { Badge } from './Badge'

interface Props {
  id: SceneId
  chapter?: string
  headline: string
  badges: Basis[]
  intro: ReactNode
  takeaway: string
  children: ReactNode
  wide?: boolean
}

export function SceneShell({ id, chapter, headline, badges, intro, takeaway, children, wide }: Props) {
  const scene = SCENES.find((s) => s.id === id)!
  return (
    <section id={id} className={`scene${wide ? ' scene-wide' : ''}`} aria-labelledby={`${id}-h`}>
      <div className="scene-inner">
        {chapter && <p className="chapter">{chapter}</p>}
        <header className="scene-head">
          <p className="scene-no">ฉาก {scene.no} · {scene.nav}</p>
          <h2 id={`${id}-h`}>{headline}</h2>
          <div className="badges">{badges.map((b) => <Badge key={b} kind={b} />)}</div>
          <div className="intro">{intro}</div>
        </header>
        <div className="visual">{children}</div>
        <p className="takeaway"><span className="takeaway-label">สรุป</span>{takeaway}</p>
      </div>
    </section>
  )
}
