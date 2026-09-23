import { useApp } from '../lib/appContext'
import { pilotCandidates, priorities, planState } from '../data/nationPlan'
import { SceneShell } from './SceneShell'
import { Icon, type IconName } from './Icon'

const P_ICON: Record<string, IconName> = { P0: 'unlock', P1: 'gear', P2: 'rocket', P3: 'scale' }
const P_GATE: Record<string, string> = { P0: 'M2', P1: 'M3', P2: 'M4 → M5 → M6', P3: 'ยังไม่กำหนดวัน' }

export function PriorityLanes() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="priority"
      chapter="B · Mac Proposal"
      headline="Unblock → Pilot → Scale"
      badges={['proposal']}
      intro={<p>ระดับความพร้อมและการลงทุน — ไม่ใช่ Ranking ความสำคัญของฝ่าย</p>}
      takeaway="ไม่เริ่มทุกระบบพร้อมกัน · ไม่หยุด Business เพื่อรอ Platform ใหญ่"
    >
      <div className="stairs">
        {priorities.map((p, i) => (
          <div key={p.id} className={`step step-${p.id.toLowerCase()}${isSelected('priority', p.id) ? ' is-selected' : ''}`} style={{ ['--lift' as string]: i }}>
            <button type="button" className="step-head" aria-haspopup="dialog" onClick={(e) => select({ kind: 'priority', id: p.id }, e.currentTarget)}>
              <Icon name={P_ICON[p.id]} size={28} />
              <span className="step-id">{p.id}</span>
              <span className="step-label">{p.label}</span>
            </button>
            <div className="step-body">
              {p.id === 'P2' ? (
                <>
                  <p className="pick-note">เลือก 2–3 ที่ M2 <span className="muted">· {planState.selectedPilotIds ? 'selected' : 'ยังไม่เลือก'}</span></p>
                  <ul className="cands">
                    {pilotCandidates.map((c) => (
                      <li key={c.id}>
                        <button type="button" className={`cand${isSelected('candidate', c.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'candidate', id: c.id }, e.currentTarget)}>
                          <span className="cand-box" aria-hidden="true" />
                          <span className="cand-id">{c.id}</span>
                          <span className="cand-title">{c.title}</span>
                          <span className="cand-status">รอเลือก</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className={`cand cand-local${isSelected('workstream', 'R7') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'workstream', id: 'R7' }, e.currentTarget)}>
                    <Icon name="local" size={18} />
                    <span className="cand-title">Local Pilot · อนุมัติแยก</span>
                  </button>
                </>
              ) : (
                <ul className="step-items">{p.items.map((it) => <li key={it}>{it}</li>)}</ul>
              )}
              <p className="step-gate"><Icon name="flag" size={16} />{P_GATE[p.id]}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="parallel-ribbon"><Icon name="parallel" size={20} /><span><strong>Parallel:</strong> Community / AE / Local เริ่มเตรียมได้เลย — Go-live ต้องผ่าน Gate ของตัวเอง</span></p>
    </SceneShell>
  )
}
