import { useApp } from '../lib/appContext'
import { msById, notEqual, responsibility, yearEndCheckpoints } from '../data/nationPlan'
import { fmtDate } from '../lib/dates'
import { SceneShell } from './SceneShell'
import { E } from './Editable'
import { Icon, type IconName } from './Icon'

const K_ICON: Record<string, IconName> = { K1: 'people', K2: 'rocket', K3: 'gauge' }
const R_ICON: IconName[] = ['decision', 'link', 'briefcase', 'data']

export function AcceptanceScene() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="acceptance"
      headline="Year-end Acceptance"
      badges={['proposal']}
      intro="ตรวจรับจาก Evidence ไม่ใช่สถานะสีเขียว · ยังไม่มีจุดใดผ่าน"
      takeaway="Backlog ต้องแสดงตามจริง — ย้ายไปปีหน้า ≠ ปิดงาน"
    >
      <ol className="checkpoints">
        {yearEndCheckpoints.map((k) => (
          <li key={k.id}>
            <button type="button" className={`ckpt${isSelected('checkpoint', k.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'checkpoint', id: k.id }, e.currentTarget)}>
              <span className="ckpt-no" aria-hidden="true"><Icon name={K_ICON[k.id]} size={28} /></span>
              <E className="ckpt-title" k={`ckpt.${k.id}.title`} v={k.title} />
              <E className="ckpt-sum" k={`ckpt.${k.id}.summary`} v={k.summary} multiline />
              <span className="ckpt-ms"><Icon name="flag" size={14} />{k.milestones.map((m) => `${m} ${fmtDate(msById[m].date, false)}`).join(' · ')}</span>
              <span className="ckpt-status"><span aria-hidden="true">◌</span> TBC</span>
            </button>
          </li>
        ))}
      </ol>

      <ul className="neq" aria-label="สิ่งที่ไม่เท่ากัน">
        {notEqual.map(([a, b]) => (
          <li key={a}><E k={`neq.${a}.a`} v={a} /><span className="neq-sign" aria-label="ไม่เท่ากับ">≠</span><E k={`neq.${a}.b`} v={b} /></li>
        ))}
      </ul>

      <div className="resp">
        <ol className="resp-chain" aria-label="Roles">
          {responsibility.map((r, i) => (
            <li key={r.who}><Icon name={R_ICON[i]} size={20} /><E className="resp-who" k={`resp.${i}.who`} v={r.who} label="Who" /><E className="resp-role" k={`resp.${i}.role`} v={r.role} label="Role" /></li>
          ))}
        </ol>
        <button type="button" className={`mini-btn${isSelected('weekly', 'W') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'weekly', id: 'W' }, e.currentTarget)}>
          <Icon name="clock" size={16} />Weekly Review 30 min (Proposal)
        </button>
      </div>
    </SceneShell>
  )
}
