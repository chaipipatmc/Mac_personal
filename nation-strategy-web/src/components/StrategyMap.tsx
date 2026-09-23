import { useApp } from '../lib/appContext'
import { r1DiscussedFunctions, workstreams, type Workstream } from '../data/nationPlan'
import { SceneShell } from './SceneShell'
import { Icon, WS_ICON } from './Icon'

function WsNode({ w }: { w: Workstream }) {
  const { select, isSelected, openInTimeline } = useApp()
  return (
    <div className={`ws-node ws-${w.group}${isSelected('workstream', w.id) ? ' is-selected' : ''}`}>
      <button type="button" className="ws-main" aria-haspopup="dialog" onClick={(e) => select({ kind: 'workstream', id: w.id }, e.currentTarget)}>
        <span className="ws-ico"><Icon name={WS_ICON[w.id]} size={26} /></span>
        <span className="ws-text">
          <span className="ws-id">{w.id}</span>
          <span className="ws-title">{w.title}</span>
        </span>
      </button>
      <div className="ws-actions">
        {w.id === 'R1' && (
          <button type="button" className="mini-btn" onClick={(e) => select({ kind: 'r1func', id: 'R1' }, e.currentTarget)} aria-label="ฟังก์ชันที่หารือ 6 รายการ">
            <Icon name="plus" size={16} />{r1DiscussedFunctions.length} Functions
          </button>
        )}
        <button type="button" className="mini-btn" onClick={() => openInTimeline({ workstream: w.id })} aria-label={`ดู ${w.id} ใน Timeline`}>
          <Icon name="calendar" size={16} />Timeline
        </button>
      </div>
    </div>
  )
}

export function StrategyMap() {
  const org = workstreams.filter((w) => w.group === 'org')
  const biz = workstreams.filter((w) => w.group === 'business')
  const base = workstreams.find((w) => w.group === 'foundation')!
  return (
    <SceneShell
      id="plan"
      headline="7 Workstreams เดินพร้อมกัน"
      badges={['meeting', 'proposal']}
      intro={<p>จัดกลุ่มงานจากร่างแผน — ไม่ใช่ 7 หน่วยงานใหม่</p>}
      takeaway="BU เป็น Owner ของผลลัพธ์ · Mac เชื่อม Workflow, Data และ AI"
    >
      <div className="smap">
        <div className="smap-top">
          <div className="layer layer-org">
            <h3 className="layer-h"><Icon name="people" size={18} />Organization</h3>
            <div className="layer-nodes">{org.map((w) => <WsNode key={w.id} w={w} />)}</div>
          </div>
          <div className="smap-bridge" aria-label="บทบาท Mac">
            <span className="bridge-line" aria-hidden="true" />
            <span className="bridge-label"><Icon name="link" size={20} />Mac<br /><small>Integrator</small></span>
            <span className="bridge-line" aria-hidden="true" />
          </div>
          <div className="layer layer-biz">
            <h3 className="layer-h"><Icon name="growth" size={18} />Business</h3>
            <div className="layer-nodes">{biz.map((w) => <WsNode key={w.id} w={w} />)}</div>
          </div>
        </div>
        <div className="smap-pillars" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="layer layer-base">
          <h3 className="layer-h"><Icon name="stack" size={18} />Shared Foundation</h3>
          <WsNode w={base} />
        </div>
      </div>
    </SceneShell>
  )
}
