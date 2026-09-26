import { useApp } from '../lib/appContext'
import { focusTiers } from '../data/upgrade26'
import { SceneShell } from './SceneShell'
import { E } from './Editable'
import { Badge } from './Badge'
import { Icon, WS_ICON, type IconName } from './Icon'
import type { Selection } from '../lib/selection'

const F_ICON: Record<string, IconName> = { F1: 'rocket', F2: 'parallel', F3: 'scale', F4: 'local' }

/** Items that have their own drawer (R6 tracks) open that; everything else opens the Workstream. */
const itemSel = (ws: string, text: string): Selection =>
  ws === 'R6' && /^6[AB]/.test(text) ? { kind: 'r6track', id: text.slice(0, 2) } : ws === 'R5' ? { kind: 'r5lanes', id: 'R5' } : { kind: 'workstream', id: ws }

export function PriorityLanes() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="priority"
      chapter="B · Focus"
      headline="R6 + R5 เริ่มก่อน"
      badges={['meeting26', 'proposal']}
      intro="ลำดับเริ่มงาน — ไม่ใช่ Ranking ความสำคัญของฝ่าย"
      takeaway="Government ก่อน → Sales เอกชนตามมา · งานองค์กรเดินคู่ขนาน"
    >
      <ol className="tiers">
        {focusTiers.map((t, i) => (
          <li key={t.id} className={`tier tier-${i}${isSelected('focus', t.id) ? ' is-selected' : ''}`}>
            <button type="button" className="tier-head" aria-haspopup="dialog" onClick={(e) => select({ kind: 'focus', id: t.id }, e.currentTarget)}>
              <Icon name={F_ICON[t.id]} size={26} />
              <span className="tier-no">{i + 1}</span>
              <E className="tier-label" k={`focus.${t.id}.label`} v={t.label} label="Label" />
              <Badge kind={t.basis} small />
            </button>
            <ul className="tier-items">
              {t.items.map((it, ii) => (
                <li key={it.text}>
                  <button type="button" className="tier-item" aria-haspopup="dialog" onClick={(e) => select(itemSel(it.ws, it.text), e.currentTarget)}>
                    <Icon name={WS_ICON[it.ws]} size={18} /><span className="ws-id">{it.ws}</span>
                    <E k={`focus.${t.id}.item${ii}`} v={it.text} label="Item" />
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <p className="parallel-ribbon"><Icon name="parallel" size={20} /><span><strong>Parallel:</strong> <E k="priority.parallel2" v="R1 · R2 · R3 เตรียมคู่ขนานได้ — Go-live ต้องผ่าน Gate ของตัวเอง" multiline /></span></p>
      <button type="button" className="link-btn history-link" aria-haspopup="dialog" onClick={(e) => select({ kind: 'decision', id: 'D3' }, e.currentTarget)}>ประวัติ: ข้อเสนอเดิม P0–P3 / C1–C4 → D3</button>
    </SceneShell>
  )
}
