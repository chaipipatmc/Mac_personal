import type { ReactNode } from 'react'
import type { Basis } from '../data/nationPlan'
import { SCENES, type SceneId } from '../lib/selection'
import { Badge } from './Badge'
import { E } from './Editable'

interface Props {
  id: SceneId
  chapter?: string
  headline: string
  badges: Basis[]
  intro?: ReactNode
  takeaway: string
  children: ReactNode
  wide?: boolean
}

export function SceneShell({ id, chapter, headline, badges, intro, takeaway, children, wide }: Props) {
  const scene = SCENES.find((s) => s.id === id)!
  return (
    <section id={id} className={`scene${wide ? ' scene-wide' : ''}`} aria-labelledby={`${id}-h`}>
      <div className="scene-inner">
        <header className="scene-head">
          <p className="scene-no">
            {chapter && <span className="chapter">{chapter}</span>}
            <span>{scene.no} · {scene.nav}</span>
          </p>
          <h2 id={`${id}-h`}><E k={`${id}.headline`} v={headline} label="Headline" /></h2>
          <div className="head-meta">
            <div className="badges">{badges.map((b) => <Badge key={b} kind={b} />)}</div>
            {intro && <div className="intro">{typeof intro === 'string' ? <p><E k={`${id}.intro`} v={intro} label="Intro" multiline /></p> : intro}</div>}
          </div>
        </header>
        <div className="visual">{children}</div>
        <p className="takeaway"><span className="takeaway-label">Key</span><E k={`${id}.takeaway`} v={takeaway} label="Key message" /></p>
      </div>
    </section>
  )
}
