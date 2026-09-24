import { useEffect, useRef } from 'react'
import { useApp } from '../lib/appContext'
import { getDetail, type Field, type LinkItem } from '../data/details'
import { sourceById, taskById } from '../data/nationPlan'
import { Badge } from './Badge'
import { EditForm } from './EditForm'

const ROWS = [
  ['what', 'What'],
  ['why', 'Why'],
  ['owner', 'Owner'],
  ['timing', 'Timing'],
  ['prereq', 'Before Start'],
  ['deliverable', 'Deliverable / Done'],
  ['unlocks', 'Unlocks'],
  ['pending', 'TBC'],
] as const

function FieldView({ field }: { field: Field }) {
  return (
    <>
      <p>{field.text}</p>
      {field.more && (
        <details className="more">
          <summary>More ({field.more.length})</summary>
          <ul>{field.more.map((m) => <li key={m}>{m}</li>)}</ul>
        </details>
      )}
    </>
  )
}

function Links({ items }: { items?: LinkItem[] }) {
  const { select } = useApp()
  if (!items?.length) return null
  const seen = new Set<string>()
  const uniq = items.filter((l) => { const k = `${l.sel.kind}:${l.sel.id}`; if (seen.has(k)) return false; seen.add(k); return true })
  return (
    <div className="chip-links">
      {uniq.map((l) => (
        <button key={`${l.sel.kind}:${l.sel.id}`} type="button" className="chip-link" onClick={() => select(l.sel, null)}>{l.label}</button>
      ))}
    </div>
  )
}

export function DetailPanel() {
  const { selection, close, openInTimeline, editMode } = useApp()
  const headRef = useRef<HTMLHeadingElement>(null)
  const key = selection ? `${selection.kind}:${selection.id}` : ''

  useEffect(() => {
    if (!selection) return
    headRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); close() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!selection) return null
  if (selection.kind === 'task' && !taskById[selection.id]) return null
  const d = getDetail(selection)
  // App marks the active scene on <body>; no Timeline button needed while already there.
  const timelineVisible = document.body.dataset.scene === 'timeline'

  return (
    <>
      <div className="panel-backdrop" onClick={close} aria-hidden="true" />
      <aside className="panel" role="dialog" aria-modal="false" aria-labelledby="panel-title" key={key}>
        <div className="panel-grip" aria-hidden="true" />
        <header className="panel-head">
          <div>
            <p className="panel-kind">{d.kindLabel}{d.code ? ` · ${d.code}` : ''}</p>
            <h2 id="panel-title" ref={headRef} tabIndex={-1}>{d.title}</h2>
            <div className="badges">{d.badges.map((b) => <Badge key={b} kind={b} small />)}</div>
          </div>
          <button type="button" className="panel-close" onClick={close} aria-label="ปิดรายละเอียด (Esc)">✕<span className="sr-only"> ปิด</span></button>
        </header>
        <div className="panel-body">
          {editMode && <EditForm sel={selection} onRemoved={close} />}
          <dl className="detail-rows">
            {ROWS.map(([k, label]) => {
              const field = d[k]
              return (
                <div key={k} className={`drow drow-${k}`}>
                  <dt>{label}</dt>
                  <dd>
                    {field ? <FieldView field={field} /> : <p className="muted">—</p>}
                    {k === 'prereq' && <Links items={d.prereqLinks} />}
                    {k === 'unlocks' && <Links items={d.unlockLinks} />}
                  </dd>
                </div>
              )
            })}
          </dl>
          {d.extra && (
            <div className={`extra ${d.extra.tone === 'caution' ? 'extra-caution' : ''}`}>
              <h3>{d.extra.heading}</h3>
              <ul>{d.extra.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          )}
          <details className="sources">
            <summary>Sources ({d.sourceRefs.length})</summary>
            <ul>
              {d.sourceRefs.map((s, i) => (
                <li key={i}>
                  <strong>{s.source}{s.sections ? ` ${s.sections}` : ''}</strong> — {s.note}
                  <br /><span className="muted">{sourceById[s.source].title}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
        {d.timeline && !timelineVisible && (
          <footer className="panel-foot">
            <button type="button" className="btn btn-primary" onClick={() => openInTimeline(d.timeline!)}>ดูใน Timeline →</button>
          </footer>
        )}
      </aside>
    </>
  )
}
