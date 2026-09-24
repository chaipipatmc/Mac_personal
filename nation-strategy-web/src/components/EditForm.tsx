import { useEffect, useState } from 'react'
import { msById, taskById, wsById, type MilestoneId, type WorkstreamId } from '../data/nationPlan'
import {
  baselineMilestone, baselineTask, isEdited, patchMilestone, patchTask, patchWorkstream, removeTask, resetItem,
} from '../lib/planStore'
import type { Selection } from '../lib/selection'
import { fmtDate } from '../lib/dates'

/** Text/date input that commits on blur or Enter — one save per finished edit, not per keystroke. */
function Field({ id, label, value, onCommit, type = 'text', multiline, min }: {
  id: string; label: string; value: string; onCommit: (v: string) => void; type?: 'text' | 'date'; multiline?: boolean; min?: string
}) {
  const [v, setV] = useState(value)
  useEffect(() => setV(value), [value])
  const commit = () => { const t = v.trim(); if (t && t !== value) onCommit(t); else setV(value) }
  return (
    <label className="ef-field" htmlFor={id}>
      <span>{label}</span>
      {multiline
        ? <textarea id={id} rows={2} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} />
        : <input id={id} type={type} value={v} min={min} onChange={(e) => { setV(e.target.value); if (type === 'date' && e.target.value) onCommit(e.target.value) }} onBlur={type === 'text' ? commit : undefined} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />}
    </label>
  )
}

export function EditForm({ sel, onRemoved }: { sel: Selection; onRemoved: () => void }) {
  const [confirmDel, setConfirmDel] = useState(false)
  if (sel.kind === 'task' && taskById[sel.id]) {
    const t = taskById[sel.id]
    const base = baselineTask(t.id)
    return (
      <div className="edit-form">
        <p className="ef-title">✎ Edit {t.id}{isEdited(t.id) ? ' · แก้ไขแล้ว' : ''}</p>
        <Field id={`ef-${t.id}-title`} label="Title" value={t.title} onCommit={(v) => patchTask(t.id, { title: v })} />
        <Field id={`ef-${t.id}-short`} label="Short label (บนแถบ)" value={t.short ?? ''} onCommit={(v) => patchTask(t.id, { short: v })} />
        <div className="ef-row">
          <Field id={`ef-${t.id}-start`} label="Start" type="date" value={t.start} onCommit={(v) => patchTask(t.id, { start: v, end: v > t.end ? v : t.end })} />
          <Field id={`ef-${t.id}-end`} label="End" type="date" value={t.end} min={t.start} onCommit={(v) => { if (v >= t.start) patchTask(t.id, { end: v }) }} />
        </div>
        <Field id={`ef-${t.id}-note`} label="What (สรุป)" value={t.note} multiline onCommit={(v) => patchTask(t.id, { note: v })} />
        <Field id={`ef-${t.id}-deliv`} label="Deliverable" value={t.deliverable} multiline onCommit={(v) => patchTask(t.id, { deliverable: v })} />
        {base && isEdited(t.id) && <p className="ef-base">Baseline: {fmtDate(base.start, false)} – {fmtDate(base.end, false)} · “{base.title}”</p>}
        <div className="ef-actions">
          {base && isEdited(t.id) && <button type="button" className="seg" onClick={() => resetItem(t.id)}>Reset to baseline</button>}
          {t.custom && (confirmDel
            ? <><button type="button" className="seg danger" onClick={() => { removeTask(t.id); onRemoved() }}>ลบ {t.id}</button><button type="button" className="seg" onClick={() => setConfirmDel(false)}>Cancel</button></>
            : <button type="button" className="seg" onClick={() => setConfirmDel(true)}>Delete task</button>)}
        </div>
      </div>
    )
  }
  if (sel.kind === 'milestone' && msById[sel.id as MilestoneId]) {
    const m = msById[sel.id as MilestoneId]
    const base = baselineMilestone(m.id)!
    return (
      <div className="edit-form">
        <p className="ef-title">✎ Edit {m.id}{isEdited(m.id) ? ' · แก้ไขแล้ว' : ''}</p>
        <Field id={`ef-${m.id}-label`} label="Label" value={m.label} onCommit={(v) => patchMilestone(m.id, { label: v })} />
        <Field id={`ef-${m.id}-date`} label="Date" type="date" value={m.date} onCommit={(v) => patchMilestone(m.id, { date: v })} />
        <Field id={`ef-${m.id}-deliv`} label="Deliverables" value={m.deliverables} multiline onCommit={(v) => patchMilestone(m.id, { deliverables: v })} />
        {isEdited(m.id) && <p className="ef-base">Baseline: {fmtDate(base.date)} · “{base.label}”</p>}
        {isEdited(m.id) && <div className="ef-actions"><button type="button" className="seg" onClick={() => resetItem(m.id)}>Reset to baseline</button></div>}
      </div>
    )
  }
  if (sel.kind === 'workstream' && wsById[sel.id as WorkstreamId]) {
    const w = wsById[sel.id as WorkstreamId]
    return (
      <div className="edit-form">
        <p className="ef-title">✎ Edit {w.id}{isEdited(w.id) ? ' · แก้ไขแล้ว' : ''}</p>
        <Field id={`ef-${w.id}-title`} label="Title" value={w.title} onCommit={(v) => patchWorkstream(w.id, { title: v })} />
        <Field id={`ef-${w.id}-short`} label="Short title (มือถือ)" value={w.shortTitle} onCommit={(v) => patchWorkstream(w.id, { shortTitle: v })} />
        <Field id={`ef-${w.id}-owner`} label="Owner" value={w.ownerLabel} multiline onCommit={(v) => patchWorkstream(w.id, { ownerLabel: v })} />
        {isEdited(w.id) && <div className="ef-actions"><button type="button" className="seg" onClick={() => resetItem(w.id)}>Reset to baseline</button></div>}
      </div>
    )
  }
  return null
}
