import { useApp } from '../lib/appContext'
import { connectedApps, connectedNodes, hubChips } from '../data/upgrade26'
import { SceneShell } from './SceneShell'
import { E } from './Editable'
import { Icon, type IconName } from './Icon'

const APP_ICON: Record<string, IconName> = { Sales: 'growth', Finance: 'coin', HR: 'people', Procurement: 'cart', Asset: 'building' }
const SPLIT: [IconName, string, string][] = [
  ['briefcase', 'Business Data', 'Executive AI'],
  ['content', 'Content Archive', 'Content AI'],
  ['community', 'Audience Data', 'Nation ID'],
]

export function ConnectedOrg() {
  const { select, isSelected } = useApp()
  const node = (id: string) => connectedNodes.find((n) => n.id === id)!
  const open = (id: string) => (e: React.MouseEvent<HTMLElement>) => select({ kind: 'connected', id }, e.currentTarget)
  return (
    <SceneShell
      id="connected-organization"
      headline="Connected Organization"
      badges={['meeting26', 'proposal']}
      intro="แอปแต่ละฝ่าย → Data Hub → Executive AI"
      takeaway="เชื่อมเฉพาะที่มีเหตุผลและสิทธิ — Database กลาง ≠ ทุกคนเห็นทุกอย่าง"
    >
      <div className="cx">
        <button type="button" className={`cx-col cx-apps${isSelected('connected', 'apps') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={open('apps')}>
          <span className="cx-h"><E k="cx.apps" v={node('apps').label} label="Label" /></span>
          <span className="cx-app-list">
            {connectedApps.map((a) => <span key={a} className="cx-app"><Icon name={APP_ICON[a] ?? 'tech'} size={18} />{a}</span>)}
          </span>
        </button>
        <span className="cx-arrow" aria-hidden="true"><Icon name="arrow" size={26} /></span>
        <button type="button" className={`cx-col cx-hub${isSelected('connected', 'hub') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={open('hub')}>
          <Icon name="data" size={40} />
          <span className="cx-h"><E k="cx.hub" v={node('hub').label} label="Label" /></span>
          <span className="cx-chips">{hubChips.map((c, i) => <span key={c} className="cx-chip"><Icon name="check" size={14} /><E k={`cx.hubchip${i}`} v={c} label="Chip" /></span>)}</span>
          <span className="cx-when">ต.ค.–พ.ย. → ใช้ได้บางส่วน ธ.ค.</span>
        </button>
        <span className="cx-arrow" aria-hidden="true"><Icon name="arrow" size={26} /></span>
        <button type="button" className={`cx-col cx-ai${isSelected('connected', 'ai') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={open('ai')}>
          <Icon name="ai" size={40} />
          <span className="cx-h"><E k="cx.ai" v={node('ai').label} label="Label" /></span>
          <span className="cx-sub"><E k="cx.ai.sub" v="ถามจุดเดียว · Read-only ก่อน" label="Sub" /></span>
        </button>
        <span className="cx-arrow" aria-hidden="true"><Icon name="arrow" size={26} /></span>
        <div className="cx-col cx-answer">
          <Icon name="review" size={32} />
          <span className="cx-h"><E k="cx.answer" v="คำตอบ + แหล่งข้อมูล" label="Label" /></span>
          <span className="cx-sub"><E k="cx.answer.sub" v="เวลาอัปเดต · ข้อจำกัด" label="Sub" /></span>
        </div>
      </div>
      <button type="button" className={`cx-split${isSelected('connected', 'split') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={open('split')}>
        <span className="cx-split-h"><Icon name="shield" size={18} /><E k="cx.split" v={node('split').label} label="Label" /></span>
        {SPLIT.map(([ic, a, b]) => (
          <span key={a} className="cx-split-item"><Icon name={ic} size={18} />{a}<Icon name="arrow" size={14} /><strong>{b}</strong></span>
        ))}
      </button>
      <button type="button" className={`mini-btn kg-btn${isSelected('kgraph', 'kgraph') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'kgraph', id: 'kgraph' }, e.currentTarget)}>
        <Icon name="link" size={16} /><E k="cx.kgraph" v="AI เข้าใจบริบทได้อย่างไร (Knowledge Graph)" label="Button" />
      </button>
    </SceneShell>
  )
}
