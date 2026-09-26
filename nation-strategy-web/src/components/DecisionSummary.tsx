import { useApp } from '../lib/appContext'
import { decisions, meta, msById, nextSteps } from '../data/nationPlan'
import { fmtDate } from '../lib/dates'
import { SceneShell } from './SceneShell'
import { E } from './Editable'
import { Icon, type IconName } from './Icon'

const D_ICON: Record<string, IconName> = { D1: 'target', D2: 'userCheck', D3: 'people', D4: 'calendar', D5: 'swap', D6: 'key' }

export function DecisionSummary() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="decision"
      headline="6 Decisions เพื่อเริ่ม"
      badges={['proposal', 'pending']}
      intro="ทุกข้อรอหารือ/อนุมัติ · เว็บนี้ไม่ส่งผลการตัดสินใจ"
      takeaway={meta.closing}
    >
      <ul className="decisions decisions-6">
        {decisions.map((d) => (
          <li key={d.id} className={`dcard${isSelected('decision', d.id) ? ' is-selected' : ''}`}>
            <span className="dcard-no" aria-hidden="true"><Icon name={D_ICON[d.id]} size={24} /></span>
            <h3><E k={`decision.${d.id}.title`} v={d.title} /></h3>
            <p><E k={`decision.${d.id}.question`} v={d.question} multiline /></p>
            <span className="dcard-status"><span aria-hidden="true">◌</span> {d.status}</span>
            <button type="button" className="btn btn-ghost" aria-haspopup="dialog" onClick={(e) => select({ kind: 'decision', id: d.id }, e.currentTarget)}>ดูเงื่อนไข</button>
          </li>
        ))}
      </ul>

      <ol className="nextsteps" aria-label="Next Steps">
        {nextSteps.map((s) => {
          const m = msById[s.milestoneId]
          return (
            <li key={s.milestoneId}>
              <button type="button" className="ns" aria-haspopup="dialog" onClick={(e) => select({ kind: 'milestone', id: m.id }, e.currentTarget)}>
                <span className="ns-date"><Icon name="calendar" size={16} />{fmtDate(m.date, false)}</span>
                <E className="ns-label" k={`next.${s.milestoneId}`} v={s.label} />
                <span className="ns-basis">{m.dateBasis === 'proposed' ? 'Proposed' : 'From Meeting'}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </SceneShell>
  )
}
