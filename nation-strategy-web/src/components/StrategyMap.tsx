import { useApp } from '../lib/appContext'
import { r1DiscussedFunctions, workstreams, type Workstream } from '../data/nationPlan'
import { SceneShell } from './SceneShell'

function WsNode({ w }: { w: Workstream }) {
  const { select, isSelected, openInTimeline } = useApp()
  return (
    <div className={`ws-node ws-${w.group}${isSelected('workstream', w.id) ? ' is-selected' : ''}`}>
      <button type="button" className="ws-main" aria-haspopup="dialog" onClick={(e) => select({ kind: 'workstream', id: w.id }, e.currentTarget)}>
        <span className="ws-id">{w.id}</span>
        <span className="ws-title">{w.title}</span>
        <span className="ws-short">{w.shortTitle}</span>
        <span className="more-cue">ดูรายละเอียด</span>
      </button>
      <div className="ws-actions">
        {w.id === 'R1' && (
          <button type="button" className="mini-btn" onClick={(e) => select({ kind: 'r1func', id: 'R1' }, e.currentTarget)}>
            ฟังก์ชันที่หารือ ({r1DiscussedFunctions.length})
          </button>
        )}
        <button type="button" className="mini-btn" onClick={() => openInTimeline({ workstream: w.id })} aria-label={`ดู ${w.id} ใน Timeline`}>ดูใน Timeline →</button>
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
      headline="7 งานหลัก เดินไปด้วยกัน"
      badges={['meeting', 'proposal']}
      intro={<p>ปรับองค์กรและสร้างธุรกิจเดินคู่กัน โดยมีระบบและข้อมูลเป็นฐานร่วม · ชื่อ 7 Workstreams เป็นการจัดกลุ่มจากร่างแผน ไม่ใช่ 7 หน่วยงานใหม่</p>}
      takeaway="ฝ่ายธุรกิจเป็นเจ้าของผลลัพธ์ — Mac เชื่อมแผน Workflow, Data และ AI"
    >
      <div className="smap">
        <div className="smap-top">
          <div className="layer layer-org">
            <h3 className="layer-h">ปรับองค์กร</h3>
            <div className="layer-nodes">{org.map((w) => <WsNode key={w.id} w={w} />)}</div>
          </div>
          <div className="smap-bridge" aria-label="บทบาท Mac">
            <span className="bridge-line" aria-hidden="true" />
            <span className="bridge-label">Mac เชื่อม<br />Workflow · Data · AI</span>
            <span className="bridge-line" aria-hidden="true" />
          </div>
          <div className="layer layer-biz">
            <h3 className="layer-h">สร้างธุรกิจ</h3>
            <div className="layer-nodes">{biz.map((w) => <WsNode key={w.id} w={w} />)}</div>
          </div>
        </div>
        <div className="smap-pillars" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="layer layer-base">
          <h3 className="layer-h">ฐานร่วมด้านระบบและข้อมูล</h3>
          <WsNode w={base} />
        </div>
      </div>
    </SceneShell>
  )
}
