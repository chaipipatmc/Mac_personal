import { useState } from 'react'
import { useApp } from '../lib/appContext'
import { r1DiscussedFunctions, workstreams, type Workstream } from '../data/nationPlan'
import { SceneShell } from './SceneShell'
import { Icon, WS_ICON } from './Icon'
import { E } from './Editable'
import { patchWorkstream, resetItem } from '../lib/planStore'

function WsNode({ w }: { w: Workstream }) {
  const { select, isSelected, openInTimeline } = useApp()
  return (
    <div className={`ws-node ws-${w.group}${isSelected('workstream', w.id) ? ' is-selected' : ''}`}>
      <button type="button" className="ws-main" aria-haspopup="dialog" onClick={(e) => select({ kind: 'workstream', id: w.id }, e.currentTarget)}>
        <span className="ws-ico"><Icon name={WS_ICON[w.id]} size={26} /></span>
        <span className="ws-text">
          <span className="ws-id">{w.id}</span>
          <E className="ws-title" value={w.title} onSave={(t) => patchWorkstream(w.id, { title: t })} onReset={() => resetItem(w.id)} label={`${w.id} title`} />
        </span>
      </button>
      <p className={`ws-owner${/TBC/.test(w.ownerLabel) ? ' is-tbc' : ''}`}>
        <Icon name="user" size={15} />
        <E value={w.ownerLabel} onSave={(v) => patchWorkstream(w.id, { ownerLabel: v })} label={`${w.id} owner`} multiline />
      </p>
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
  const { select } = useApp()
  const [sideOpen, setSideOpen] = useState(false)
  const org = workstreams.filter((w) => w.group === 'org' && w.focus)
  const biz = workstreams.filter((w) => w.group === 'business' && w.focus)
  const base = workstreams.find((w) => w.group === 'foundation')!
  const side = workstreams.filter((w) => !w.focus)
  return (
    <SceneShell
      id="plan"
      headline="6 งานโฟกัส · 1 งานแยกติดตาม"
      badges={['meeting26', 'proposal']}
      intro="จัดกลุ่มงานจากร่างแผน — ไม่ใช่ 7 หน่วยงานใหม่"
      takeaway="BU เป็น Owner ของผลลัพธ์ · Mac เชื่อม Workflow, Data และ AI"
    >
      <div className="smap">
        <div className="smap-top">
          <div className="layer layer-org">
            <h3 className="layer-h"><Icon name="people" size={18} /><E k="plan.layer.org" v="Organization" /></h3>
            <div className="layer-nodes">{org.map((w) => <WsNode key={w.id} w={w} />)}</div>
          </div>
          <div className="smap-bridge" aria-label="บทบาท Mac">
            <span className="bridge-line" aria-hidden="true" />
            <span className="bridge-label"><Icon name="link" size={20} /><E k="plan.bridge.who" v="Mac" /><small><E k="plan.bridge.role" v="Integrator" /></small></span>
            <span className="bridge-line" aria-hidden="true" />
          </div>
          <div className="layer layer-biz">
            <h3 className="layer-h"><Icon name="growth" size={18} /><E k="plan.layer.biz" v="Business" /></h3>
            <div className="layer-nodes">{biz.map((w) => <WsNode key={w.id} w={w} />)}</div>
          </div>
        </div>
        <div className="smap-pillars" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="layer layer-base">
          <h3 className="layer-h"><Icon name="stack" size={18} /><E k="plan.layer.base" v="Shared Foundation" /></h3>
          <WsNode w={base} />
        </div>
        <div className="smap-foot">
          <button type="button" className="btn btn-primary owners-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'owners', id: 'owners' }, e.currentTarget)}>
            <Icon name="userCheck" size={18} /><E k="plan.owners.btn" v="Owners · ใครรับผิดชอบอะไร" label="Button" />
          </button>
          {side.length > 0 && (
            <div className="side-track">
              <button type="button" className="side-toggle" aria-expanded={sideOpen} onClick={() => setSideOpen((o) => !o)}>
                <span aria-hidden="true">{sideOpen ? '▾' : '▸'}</span> <E k="plan.side.label" v="Related business initiative — ไม่อยู่ใน AI scope รอบนี้" label="Label" /> ({side.map((w) => w.id).join(', ')})
              </button>
              {sideOpen && <div className="side-nodes">{side.map((w) => <WsNode key={w.id} w={w} />)}</div>}
            </div>
          )}
        </div>
      </div>
    </SceneShell>
  )
}
