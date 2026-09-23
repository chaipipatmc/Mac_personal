import { useApp } from '../lib/appContext'
import { decisions, meta, msById, nextSteps } from '../data/nationPlan'
import { fmtDate } from '../lib/dates'
import { SceneShell } from './SceneShell'

export function DecisionSummary() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="decision"
      headline="ยืนยัน 4 เรื่อง แล้วเริ่มตาม Milestone"
      badges={['proposal', 'pending']}
      intro={<p>ทุกเรื่องยังรอหารือ/อนุมัติ · หน้านี้ใช้ประกอบการหารือเท่านั้น ไม่มีการส่งผลตัดสินใจจากเว็บ</p>}
      takeaway={meta.closing}
    >
      <ul className="decisions">
        {decisions.map((d, i) => (
          <li key={d.id} className={`dcard${isSelected('decision', d.id) ? ' is-selected' : ''}`}>
            <span className="dcard-no" aria-hidden="true">{i + 1}</span>
            <h3>{d.title}</h3>
            <p>{d.question}</p>
            <span className="dcard-status"><span aria-hidden="true">◌</span> {d.status}</span>
            <button type="button" className="btn btn-ghost" aria-haspopup="dialog" onClick={(e) => select({ kind: 'decision', id: d.id }, e.currentTarget)}>ดูเงื่อนไข</button>
          </li>
        ))}
      </ul>

      <ol className="nextsteps" aria-label="ขั้นตอนถัดไปที่เสนอ">
        {nextSteps.map((s) => {
          const m = msById[s.milestoneId]
          return (
            <li key={s.milestoneId}>
              <button type="button" className="ns" aria-haspopup="dialog" onClick={(e) => select({ kind: 'milestone', id: m.id }, e.currentTarget)}>
                <span className="ns-date">{fmtDate(m.date, false)}</span>
                <span className="ns-label">{s.label}</span>
                <span className="ns-basis">{m.dateBasis === 'proposed' ? 'วันที่เสนอ' : 'วันที่ในบันทึก'}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </SceneShell>
  )
}
