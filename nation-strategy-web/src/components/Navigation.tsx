import { useState } from 'react'
import { useApp } from '../lib/appContext'
import { SCENES, type SceneId } from '../lib/selection'
import { meta } from '../data/nationPlan'
import { fmtDate } from '../lib/dates'
import { Badge } from './Badge'
import { ModeSwitch } from './EditDock'

export function TopBar({ active }: { active: SceneId }) {
  const { goScene, select } = useApp()
  const idx = SCENES.findIndex((s) => s.id === active)
  return (
    <header className="topbar">
      <div className="topbar-row">
        <button type="button" className="brand" onClick={() => goScene('direction')}>
          <span className="brand-word">NATION</span>
          <span className="brand-sub">Strategy to Execution</span>
        </button>
        <nav className="topnav" aria-label="ฉาก">
          <ol>
            {SCENES.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={s.id === active ? 'step' : undefined}
                  className={i < idx ? 'done' : undefined}
                  onClick={(e) => { e.preventDefault(); goScene(s.id) }}
                >
                  <span className="nav-no">{s.no}</span>{s.nav}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <StepButtons active={active} />
        <ModeSwitch />
        <button type="button" className="meta-chip" onClick={(e) => select({ kind: 'about', id: 'about' }, e.currentTarget)}>
          <span className="meta-long">{meta.presenter} · {fmtDate(meta.dataAsOf)}</span>
          <span className="meta-short">{meta.presenter}</span>
          <Badge kind="pending" small />
        </button>
      </div>
      <div className="progress" aria-hidden="true"><span style={{ width: `${((idx + 1) / SCENES.length) * 100}%` }} /></div>
    </header>
  )
}

export function StepButtons({ active }: { active: SceneId }) {
  const { goScene } = useApp()
  const i = SCENES.findIndex((s) => s.id === active)
  const prev = SCENES[i - 1]
  const next = SCENES[i + 1]
  return (
    <div className="stepper" role="group" aria-label="เลื่อนฉาก">
      <button type="button" disabled={!prev} onClick={() => prev && goScene(prev.id)} aria-label={prev ? `ก่อนหน้า: ${prev.nav}` : 'ก่อนหน้า'}>←</button>
      <span className="stepper-count">{SCENES[i].no}/{String(SCENES.length).padStart(2, '0')}</span>
      <button type="button" disabled={!next} onClick={() => next && goScene(next.id)} aria-label={next ? `ถัดไป: ${next.nav}` : 'ถัดไป'}>→</button>
    </div>
  )
}

export function BottomNav({ active }: { active: SceneId }) {
  const { goScene } = useApp()
  const [open, setOpen] = useState(false)
  const i = SCENES.findIndex((s) => s.id === active)
  const prev = SCENES[i - 1]
  const next = SCENES[i + 1]
  return (
    <nav className="bottomnav" aria-label="ฉาก (มือถือ)">
      {open && (
        <ol className="bottom-menu" id="bottom-menu">
          {SCENES.map((s) => (
            <li key={s.id}>
              <button type="button" aria-current={s.id === active ? 'step' : undefined} onClick={() => { setOpen(false); goScene(s.id) }}>
                <span className="nav-no">{s.no}</span>{s.nav}
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className="bottom-row">
        <button type="button" className="bn-step" disabled={!prev} onClick={() => prev && goScene(prev.id)} aria-label={prev ? `ก่อนหน้า: ${prev.nav}` : 'ก่อนหน้า'}>‹</button>
        <button type="button" className="bn-current" aria-expanded={open} aria-controls="bottom-menu" onClick={() => setOpen((o) => !o)}>
          <span className="nav-no">{SCENES[i].no}/{String(SCENES.length).padStart(2, '0')}</span> {SCENES[i].nav} <span aria-hidden="true">{open ? '▾' : '▴'}</span>
        </button>
        <button type="button" className="bn-step" disabled={!next} onClick={() => next && goScene(next.id)} aria-label={next ? `ถัดไป: ${next.nav}` : 'ถัดไป'}>›</button>
      </div>
      <div className="progress" aria-hidden="true"><span style={{ width: `${((i + 1) / SCENES.length) * 100}%` }} /></div>
    </nav>
  )
}
