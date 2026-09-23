import { useApp } from '../lib/appContext'
import { meta, outcomes, pillars } from '../data/nationPlan'
import { SceneShell } from './SceneShell'
import { Icon, type IconName } from './Icon'

const OUTCOME_ICON: Record<string, IconName> = { O1: 'agile', O2: 'link', O3: 'growth' }
const TAG_ICON: Record<string, IconName> = {
  Workforce: 'people', Workflow: 'flow', 'JD/KPI': 'target', Delayer: 'stack',
  'Internal System': 'tech', CRM: 'user', 'Audience Data': 'data', 'Content Archive': 'content',
  '4C Community': 'community', 'Gov Intelligence': 'gov', 'Local Network': 'local',
}
const PILLAR_ICON: Record<string, IconName> = { People: 'people', Process: 'process', Data: 'data', Technology: 'tech', AI: 'ai' }

export function DirectionScene() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="direction"
      chapter="A · From Meeting"
      headline="Nation → Media Tech"
      badges={['meeting']}
      intro={<p className="lede">{meta.keyMessage}</p>}
      takeaway="เปลี่ยนทั้งองค์กรและ Business Model — ไม่ใช่แค่เพิ่ม AI Tools"
    >
      <div className="direction">
        <div className="dir-core" aria-label="NATION สู่ MEDIA TECH">
          <span className="dir-from">NATION</span>
          <span className="dir-arrow" aria-hidden="true" />
          <span className="dir-to">MEDIA TECH</span>
        </div>
        <svg className="dir-fan" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50 0 V14 M50 14 C50 26 16.7 22 16.7 40 M50 14 V40 M50 14 C50 26 83.3 22 83.3 40" />
        </svg>
        <ul className="dir-outcomes">
          {outcomes.map((o, i) => (
            <li key={o.id}>
              <button
                type="button"
                className={`outcome outcome-${i + 1}${isSelected('outcome', o.id) ? ' is-selected' : ''}`}
                onClick={(e) => select({ kind: 'outcome', id: o.id }, e.currentTarget)}
                aria-haspopup="dialog"
              >
                <span className="outcome-ico"><Icon name={OUTCOME_ICON[o.id]} size={30} /></span>
                <span className="outcome-label">{o.label}</span>
                <span className="icon-tags">
                  {o.expands.map((t) => <span key={t} className="itag"><Icon name={TAG_ICON[t] ?? 'plus'} size={16} />{t}</span>)}
                </span>
                <span className="more-cue">Details</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="pillars" aria-label="องค์ประกอบของการเปลี่ยน">
          {pillars.map((p, i) => (
            <span key={p} className="pillar"><Icon name={PILLAR_ICON[p]} size={18} />{p}{i < pillars.length - 1 && <span className="plus" aria-hidden="true">+</span>}</span>
          ))}
        </div>
      </div>
    </SceneShell>
  )
}
