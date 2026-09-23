import { useApp } from '../lib/appContext'
import { msById, notEqual, responsibility, yearEndCheckpoints } from '../data/nationPlan'
import { fmtDate } from '../lib/dates'
import { SceneShell } from './SceneShell'

export function AcceptanceScene() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="acceptance"
      headline="จบงานจากหลักฐาน ไม่ใช่สถานะสีเขียว"
      badges={['proposal']}
      intro={<p>สิ้นปีตรวจรับจาก 3 จุดตรวจ แต่ละจุดมีหลักฐานที่ต้องเห็น · ยังไม่มีจุดใดผ่าน — สถานะจริงยังไม่ยืนยัน</p>}
      takeaway="งานค้างต้องแสดงตามจริง การย้ายไปปีหน้าไม่เท่ากับปิดงาน"
    >
      <ol className="checkpoints">
        {yearEndCheckpoints.map((k, i) => (
          <li key={k.id}>
            <button type="button" className={`ckpt${isSelected('checkpoint', k.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'checkpoint', id: k.id }, e.currentTarget)}>
              <span className="ckpt-no" aria-hidden="true">{i + 1}</span>
              <span className="ckpt-title">{k.title}</span>
              <span className="ckpt-sum">{k.summary}</span>
              <span className="ckpt-ms">{k.milestones.map((m) => `${m} ${fmtDate(msById[m].date, false)}`).join(' · ')}</span>
              <span className="ckpt-status"><span aria-hidden="true">◌</span> ยังไม่ยืนยัน</span>
              <span className="more-cue">ดูหลักฐานที่ต้องมี</span>
            </button>
          </li>
        ))}
      </ol>

      <ul className="neq" aria-label="สิ่งที่ไม่เท่ากัน">
        {notEqual.map(([a, b]) => (
          <li key={a}><span>{a}</span><span className="neq-sign" aria-label="ไม่เท่ากับ">≠</span><span>{b}</span></li>
        ))}
      </ul>

      <div className="resp">
        <ol className="resp-chain" aria-label="แถบความรับผิดชอบ">
          {responsibility.map((r) => (
            <li key={r.who}><span className="resp-who">{r.who}</span><span className="resp-role">{r.role}</span></li>
          ))}
        </ol>
        <button type="button" className={`mini-btn${isSelected('weekly', 'W') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'weekly', id: 'W' }, e.currentTarget)}>
          ข้อเสนอ Weekly Review 30 นาที — ดูรายละเอียด
        </button>
      </div>
    </SceneShell>
  )
}
