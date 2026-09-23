import { useApp } from '../lib/appContext'
import { pilotCandidates, priorities, planState } from '../data/nationPlan'
import { SceneShell } from './SceneShell'

export function PriorityLanes() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="priority"
      chapter="บท B · Roadmap ที่ Mac เสนอ"
      headline="ปลดล็อกก่อน ทดลองคู่ขนาน ขยายเมื่อพร้อม"
      badges={['proposal']}
      intro={<p>สี่ระดับคือระดับการเตรียมความพร้อมและการลงทุน ไม่ใช่การจัดอันดับความสำคัญของฝ่าย · P1 กับ P2 ไม่ต้องรอกันทั้งหมด</p>}
      takeaway="ไม่เริ่มทุกระบบพร้อมกัน และไม่หยุดงานธุรกิจเพื่อรอแพลตฟอร์มใหญ่"
    >
      <div className="lanes">
        <div className="parallel-ribbon" aria-label="ทำคู่ขนาน">
          <strong>เริ่มคู่ขนานได้เลย:</strong> เตรียม Community / AE / Local ไม่ต้องรอสร้างระบบทั้งกลุ่ม — การเปิดใช้งานจริงต้องผ่านเงื่อนไขของงานนั้น
        </div>
        {priorities.map((p) => (
          <div key={p.id} className={`lane lane-${p.id.toLowerCase()}${isSelected('priority', p.id) ? ' is-selected' : ''}`}>
            <button type="button" className="lane-head" aria-haspopup="dialog" onClick={(e) => select({ kind: 'priority', id: p.id }, e.currentTarget)}>
              <span className="lane-id">{p.id}</span>
              <span className="lane-label">{p.label}</span>
              <span className="lane-reason">{p.reason}</span>
              <span className="more-cue">ดูรายละเอียด</span>
            </button>
            <div className="lane-body">
              {p.id === 'P2' ? (
                <>
                  <p className="pick-note"><span aria-hidden="true">◌</span> เลือก 2–3 Pilot ที่ M2 <span className="muted">· {planState.selectedPilotIds ? 'เลือกแล้ว' : 'ยังไม่เลือก'}</span></p>
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
                    <span className="cand-id">Local</span>
                    <span className="cand-title">Southern Pilot — อนุมัติแยก ไม่กินโควตา AI Pilot</span>
                  </button>
                </>
              ) : (
                <ul className="lane-items">{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
              )}
              <p className="lane-exit"><span>จบเมื่อ</span> {p.exitCondition}</p>
            </div>
          </div>
        ))}
      </div>
    </SceneShell>
  )
}
