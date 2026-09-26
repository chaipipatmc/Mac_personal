import { useEffect, useRef } from 'react'
import { useApp } from '../lib/appContext'
import { getDetail, type Field, type LinkItem } from '../data/details'
import { sourceById, taskById } from '../data/nationPlan'
import { Badge } from './Badge'
import { EditForm } from './EditForm'
import { BackupTool, EntitiesTable, IssuesList, LineFlowView, OwnersBoard, R5Lanes, R6Tracks } from './PanelTools'
import { E } from './Editable'
import { patchMilestone, patchTask, patchWorkstream } from '../lib/planStore'
import type { Selection } from '../lib/selection'
import { msById, wsById, type MilestoneId, type WorkstreamId } from '../data/nationPlan'

const CUSTOM = { owners: OwnersBoard, backup: BackupTool, issues: IssuesList, entities: EntitiesTable, lineflow: LineFlowView, r6: R6Tracks, r5: R5Lanes }

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

/** Owner text lives in plan data for tasks, milestones and workstreams; everything else is a wording override. */
function ownerBinding(sel: Selection): { value: string; onSave: (v: string) => void } | null {
  if (sel.kind === 'task' && taskById[sel.id]) return { value: taskById[sel.id].owner ?? wsById[taskById[sel.id].workstreamId].ownerLabel, onSave: (v) => patchTask(sel.id, { owner: v }) }
  if (sel.kind === 'milestone') return { value: msById[sel.id as MilestoneId].owner, onSave: (v) => patchMilestone(sel.id as MilestoneId, { owner: v }) }
  if (sel.kind === 'workstream') return { value: wsById[sel.id as WorkstreamId].ownerLabel, onSave: (v) => patchWorkstream(sel.id as WorkstreamId, { ownerLabel: v }) }
  return null
}

function FieldView({ field, k, owner, open }: { field: Field; k: string; owner?: { value: string; onSave: (v: string) => void } | null; open?: boolean }) {
  return (
    <>
      <p>{owner ? <E value={owner.value} onSave={owner.onSave} label="Owner" multiline /> : <E k={k} v={field.text} label="Detail" multiline />}</p>
      {field.more && (
        <details className="more" open={open}>
          <summary>More ({field.more.length})</summary>
          <ul>{field.more.map((m, i) => <li key={m}><E k={`${k}.more${i}`} v={m} label="Detail" multiline /></li>)}</ul>
        </details>
      )}
    </>
  )
}

function titleBinding(sel: Selection, fallback: string) {
  if (sel.kind === 'task' && taskById[sel.id]) return <E value={taskById[sel.id].title} onSave={(v) => patchTask(sel.id, { title: v })} label="Title" />
  if (sel.kind === 'milestone') return <E value={msById[sel.id as MilestoneId].label} onSave={(v) => patchMilestone(sel.id as MilestoneId, { label: v })} label="Label" />
  if (sel.kind === 'workstream') return <E value={wsById[sel.id as WorkstreamId].title} onSave={(v) => patchWorkstream(sel.id as WorkstreamId, { title: v })} label="Title" />
  if (sel.kind === 'outcome') return <E k={`outcome.${sel.id}.label`} v={fallback} label="Outcome" />
  return <E k={`d.${sel.kind}.${sel.id}.title`} v={fallback} label="Title" />
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
            <h2 id="panel-title" ref={headRef} tabIndex={-1}>{titleBinding(selection, d.title)}</h2>
            <div className="badges">{d.badges.map((b) => <Badge key={b} kind={b} small />)}</div>
          </div>
          <button type="button" className="panel-close" onClick={close} aria-label="ปิดรายละเอียด (Esc)">✕<span className="sr-only"> ปิด</span></button>
        </header>
        <div className="panel-body">
          {editMode && <EditForm sel={selection} onRemoved={close} />}
          {d.custom && (() => { const C = CUSTOM[d.custom]; return <div className={`custom custom-${d.custom}`}><C /></div> })()}
          {!d.hideRows && <dl className="detail-rows">
            {ROWS.map(([k, label]) => {
              const field = d[k]
              return (
                <div key={k} className={`drow drow-${k}`}>
                  <dt>{label}</dt>
                  <dd>
                    {field ? <FieldView field={field} k={`d.${selection.kind}.${selection.id}.${k}`} owner={k === 'owner' ? ownerBinding(selection) : null} open={editMode} /> : <p className="muted">—</p>}
                    {k === 'prereq' && <Links items={d.prereqLinks} />}
                    {k === 'unlocks' && <Links items={d.unlockLinks} />}
                  </dd>
                </div>
              )
            })}
          </dl>}
          {d.extra && (
            <div className={`extra ${d.extra.tone === 'caution' ? 'extra-caution' : ''}`}>
              <h3>{d.extra.heading}</h3>
              <ul>{d.extra.items.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          )}
          {d.sourceRefs.length > 0 && <details className="sources">
            <summary>Sources ({d.sourceRefs.length})</summary>
            <ul>
              {d.sourceRefs.map((s, i) => (
                <li key={i}>
                  <strong>{s.source}{s.sections ? ` ${s.sections}` : ''}</strong> — {s.note}
                  <br /><span className="muted">{sourceById[s.source].title}</span>
                </li>
              ))}
            </ul>
          </details>}
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
