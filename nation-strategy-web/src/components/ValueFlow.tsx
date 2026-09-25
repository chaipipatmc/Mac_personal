import { useApp } from '../lib/appContext'
import { fourC, valueExtras, valuePaths } from '../data/nationPlan'
import { SceneShell } from './SceneShell'
import { E } from './Editable'
import { Badge } from './Badge'
import { Icon, type IconName } from './Icon'

const FLOW_ICON: Record<string, IconName> = { F1: 'content', F2: 'community', F3: 'data', F4: 'cart', F5: 'coin' }
const STEP_ICON: Record<string, IconName> = {
  Docs: 'content', 'AI + Human Review': 'ai', 'New Workflow': 'flow',
  'Verified Gov Leads': 'gov', 'Screening/QC': 'filter', 'AE Follow-up': 'briefcase',
  Register: 'user', Join: 'event', 'Follow-up': 'review',
}
const PROOF: Record<string, string> = {
  V1: 'Time ↓ · Rework ↓ · Quality เทียบ Before/After',
  V2: 'Lead มี Owner — ไม่ใช่แค่ List โครงการ',
  V3: 'วัด Conversion — ไม่หยุดที่ Followers',
}

export function ValueFlow() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="value"
      headline="Data → Business Value"
      badges={['meeting', 'pending']}
      intro="แนวทาง 4C จากประชุม + 3 Use Cases ที่ต้องพิสูจน์"
      takeaway="Data ต้องเปลี่ยน Workflow, Sales หรือ Business ได้จริง"
    >
      <ol className="fourc" aria-label="ลำดับ 4C">
        {fourC.map((n, i) => (
          <li key={n.id} className="fourc-item">
            <button
              type="button"
              className={`fourc-node fourc-${i + 1}${isSelected('flow', n.id) ? ' is-selected' : ''}`}
              aria-haspopup="dialog"
              onClick={(e) => select({ kind: 'flow', id: n.id }, e.currentTarget)}
            >
              <Icon name={FLOW_ICON[n.id]} size={30} />
              <E className="fourc-label" k={`flow.${n.id}`} v={n.label} label="4C step" />
            </button>
          </li>
        ))}
      </ol>

      <div className="vpaths">
        <div className="vpaths-head">
          <h3><E k="value.usecases" v="Pilot Use Cases" /></h3>
          <Badge kind="proposal" small />
        </div>
        <ul className="vpath-list">
          {valuePaths.map((p) => (
            <li key={p.id}>
              <button type="button" className={`vpath${isSelected('path', p.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'path', id: p.id }, e.currentTarget)}>
                <span className="vpath-steps">
                  {p.steps.map((s, i) => (
                    <span key={s} className="vstep">
                      <span className="vstep-ico"><Icon name={STEP_ICON[s] ?? 'plus'} size={22} /></span>
                      <E className="vstep-t" k={`path.${p.id}.step${i}`} v={s} label="Step" />
                      {i < p.steps.length - 1 && <span className="varrow" aria-hidden="true"><Icon name="arrow" size={18} /></span>}
                    </span>
                  ))}
                </span>
                <span className="vpath-proof"><span className="proof-tag">Proof</span><E k={`path.${p.id}.proof`} v={PROOF[p.id]} label="Proof" /></span>
              </button>
            </li>
          ))}
        </ul>
        <div className="vextras">
          {valueExtras.map((x) => (
            <button key={x.id} type="button" className={`mini-btn${isSelected('extra', x.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'extra', id: x.id }, e.currentTarget)}>
              <Icon name={x.id === 'X1' ? 'content' : 'local'} size={16} /><E k={`extra.${x.id}`} v={x.title} label="Extra" />
            </button>
          ))}
        </div>
      </div>
    </SceneShell>
  )
}
