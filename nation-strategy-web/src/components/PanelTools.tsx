import { useState } from 'react'
import { useApp } from '../lib/appContext'
import { tasksOf, workstreams, wsById, type WorkstreamId } from '../data/nationPlan'
import { entities, lineFlow, r5Lanes, r6Tracks } from '../data/upgrade26'
import { exportEdits, getLoadNotice, getText, importEdits, patchTask, patchWorkstream, setText } from '../lib/planStore'
import { dateIssues } from '../lib/validate'
import { Badge } from './Badge'
import { E } from './Editable'
import { Icon, WS_ICON } from './Icon'

/** Text box that commits on blur / Enter (Edit mode), plain text otherwise. */
function Field({ value, placeholder, onSave, label }: { value: string; placeholder?: string; onSave: (v: string) => void; label: string }) {
  const { editMode } = useApp()
  const [draft, setDraft] = useState<string | null>(null)
  if (!editMode) return <span className={value ? 'of-val' : 'of-val muted'}>{value || placeholder || 'TBC'}</span>
  const commit = () => { if (draft !== null && draft.trim() !== value) onSave(draft.trim()); setDraft(null) }
  return (
    <input
      className="of-input"
      aria-label={label}
      value={draft ?? value}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur() } if (e.key === 'Escape') setDraft(null) }}
    />
  )
}

export function OwnersBoard() {
  const { editMode, setEditMode, select } = useApp()
  const [open, setOpen] = useState<WorkstreamId | null>(null)
  return (
    <div className="owners">
      {!editMode && (
        <p className="owners-hint"><Icon name="review" size={16} />ต้องการ Assign / แก้ชื่อ?{' '}
          <button type="button" className="mini-btn" onClick={() => setEditMode(true)}>เปิด Edit mode</button>
        </p>
      )}
      <ul className="owners-list">
        {workstreams.map((w) => {
          const ts = tasksOf(w.id)
          return (
            <li key={w.id} className={`of-row${w.focus ? '' : ' of-side'}`}>
              <div className="of-head">
                <button type="button" className="of-ws" onClick={() => select({ kind: 'workstream', id: w.id }, null)}>
                  <Icon name={WS_ICON[w.id]} size={18} /><span className="ws-id">{w.id}</span><span>{w.shortTitle}</span>
                </button>
                {!w.focus && <span className="of-tag">แยกติดตาม</span>}
              </div>
              <label className="of-line"><span className="of-k">Owner</span>
                <Field label={`${w.id} owner`} value={w.ownerLabel} onSave={(v) => patchWorkstream(w.id, { ownerLabel: v || 'TBC' })} />
              </label>
              <label className="of-line"><span className="of-k">Support</span>
                <Field label={`${w.id} support`} value={w.support} placeholder="—" onSave={(v) => patchWorkstream(w.id, { support: v })} />
              </label>
              {w.id === 'R6' && r6Tracks.map((t) => (
                <label key={t.id} className="of-line of-sub"><span className="of-k">{t.id}</span>
                  <Field label={`${t.id} ${t.title} owner`} value={getText(`d.r6track.${t.id}.owner`, t.owner)} onSave={(v) => setText(`d.r6track.${t.id}.owner`, v === t.owner ? null : v)} />
                </label>
              ))}
              <button type="button" className="of-more" aria-expanded={open === w.id} onClick={() => setOpen(open === w.id ? null : w.id)}>
                {open === w.id ? '▾' : '▸'} {ts.length} Tasks
              </button>
              {open === w.id && (
                <ul className="of-tasks">
                  {ts.map((t) => (
                    <li key={t.id}>
                      <button type="button" className="of-tid" onClick={() => select({ kind: 'task', id: t.id }, null)}>{t.id}</button>
                      <span className="of-tt">{t.title}</span>
                      <Field label={`${t.id} owner`} value={t.owner ?? ''} placeholder={`= ${wsById[t.workstreamId].ownerLabel}`} onSave={(v) => patchTask(t.id, { owner: v || undefined })} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      <p className="muted small">ช่องว่าง = ใช้ Owner ของ Workstream · ชื่อที่ยังไม่ยืนยันให้ใส่ "TBC" · บันทึกอัตโนมัติ</p>
    </div>
  )
}

export function BackupTool() {
  const [text, setTextVal] = useState('')
  const [msg, setMsg] = useState('')
  const notice = getLoadNotice()
  const doExport = async () => {
    const json = exportEdits()
    setTextVal(json)
    try { await navigator.clipboard.writeText(json); setMsg('คัดลอก JSON แล้ว') } catch { setMsg('คัดลอกจากกล่องด้านล่างได้') }
  }
  return (
    <div className="backup">
      {notice && <p className="load-notice" role="status">{notice}</p>}
      <div className="backup-row">
        <button type="button" className="btn btn-ghost" onClick={() => void doExport()}>Export (Copy JSON)</button>
        <button type="button" className="btn btn-ghost" disabled={!text.trim()} onClick={() => { const r = importEdits(text); setMsg(r.message) }}>Import</button>
      </div>
      <textarea className="backup-text" aria-label="Edits JSON" rows={8} value={text} placeholder="วาง JSON ที่ Export ไว้ แล้วกด Import" onChange={(e) => setTextVal(e.target.value)} />
      {msg && <p role="status" className="muted">{msg}</p>}
      <p className="muted small">เก็บเฉพาะการแก้ไข (คำ วันที่ Owner) — ไม่มีข้อมูลส่วนบุคคลหรือข้อมูลจริงของระบบ</p>
    </div>
  )
}

export function IssuesList() {
  const { select } = useApp()
  const issues = dateIssues()
  if (!issues.length) return <p className="ok-line"><Icon name="check" size={18} />ไม่พบวันที่ขัดกัน</p>
  return (
    <div className="issues">
      <p className="muted">แจ้งเตือนเท่านั้น — ระบบไม่ย้ายวันให้อัตโนมัติ · ปรับใน Edit mode หรือบันทึกเหตุผล</p>
      <ul>
        {issues.map((i) => (
          <li key={i.id}>
            <span className="issue-t">⚠ {i.text}</span>
            {i.ref && <button type="button" className="chip-link" onClick={() => select({ kind: i.ref!.kind, id: i.ref!.id }, null)}>เปิด {i.ref.id}</button>}
            <span className="issue-note"><Icon name="review" size={14} /><E k={`issue.${i.id}.note`} v="—" label="เหตุผล / Acknowledge" multiline /></span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function EntitiesTable() {
  return (
    <table className="ent-table">
      <thead><tr><th>Entity</th><th>บทบาท</th></tr></thead>
      <tbody>{entities.map((e) => <tr key={e.entity}><th scope="row">{e.entity}</th><td>{e.role}</td></tr>)}</tbody>
    </table>
  )
}

export function LineFlowView() {
  return (
    <div className="lineflow">
      <div className="lf-lanes">
        <div className="lf-lane lf-ok">
          <h4><Icon name="userCheck" size={18} />ยืนยันแล้ว</h4>
          <ol>{lineFlow.verified.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
        <div className="lf-lane lf-anon">
          <h4><Icon name="user" size={18} />ยังไม่ Login</h4>
          <ol>{lineFlow.anonymous.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
      </div>
      <p className="lf-ref">{lineFlow.teamReference}</p>
      <details className="more">
        <summary>ข้อเท็จจริงทางเทคนิค ({lineFlow.techFacts.length})</summary>
        <ul>{lineFlow.techFacts.map((f) => <li key={f}>{f}</li>)}</ul>
      </details>
      <details className="more">
        <summary>Web references</summary>
        <ul className="small">{lineFlow.webRefs.map((f) => <li key={f}>{f}</li>)}</ul>
      </details>
    </div>
  )
}

export function R6Tracks() {
  const { select } = useApp()
  return (
    <div className="tracks">
      {r6Tracks.map((t, i) => (
        <button key={t.id} type="button" className={`track track-${i}`} onClick={() => select({ kind: 'r6track', id: t.id }, null)}>
          <span className="track-head"><span className="track-id">{t.id}</span>{t.title}<span className="track-order">{i === 0 ? '① ' : '② '}{t.order}</span></span>
          <span className="track-flow">{t.flow.map((s, si) => <span key={s} className="tf-step">{s}{si < t.flow.length - 1 && <Icon name="arrow" size={14} />}</span>)}</span>
          <span className="track-owner"><Icon name="user" size={14} />{getText(`d.r6track.${t.id}.owner`, t.owner)}</span>
        </button>
      ))}
    </div>
  )
}

export function R5Lanes() {
  return (
    <ul className="r5lanes">
      {r5Lanes.map((l) => (
        <li key={l.id} className={`r5lane r5-${l.id}`}>
          <span className="r5-head"><Icon name={l.id === 'onground' ? 'event' : l.id === 'online' ? 'tech' : 'data'} size={18} />{l.title}<Badge kind={l.basis} small /></span>
          <span className="r5-does">{l.does}</span>
          <span className="r5-status">{l.status}</span>
        </li>
      ))}
    </ul>
  )
}
