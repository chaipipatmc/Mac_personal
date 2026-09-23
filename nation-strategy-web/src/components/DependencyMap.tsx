import { useApp } from '../lib/appContext'
import { dependencyPaths, wsById } from '../data/nationPlan'
import { SceneShell } from './SceneShell'

/** Ids of the selected node and its direct previous/next neighbours. */
function neighbourhood(selected: string | null) {
  if (!selected) return null
  for (const p of dependencyPaths) for (const lane of p.lanes) {
    const i = lane.nodes.findIndex((n) => n.id === selected)
    if (i >= 0) {
      return {
        path: p.id,
        prev: lane.nodes[i - 1]?.id,
        next: lane.nodes[i + 1]?.id,
      }
    }
  }
  return null
}

export function DependencyMap() {
  const { select, selection, close } = useApp()
  const selectedId = selection?.kind === 'depnode' ? selection.id : null
  const hood = neighbourhood(selectedId)
  const stateOf = (id: string) => {
    if (!hood) return ''
    if (id === selectedId) return ' is-selected'
    if (id === hood.prev) return ' is-prev'
    if (id === hood.next) return ' is-next'
    return ' is-dim'
  }
  const r3 = wsById.R3
  return (
    <SceneShell
      id="dependency"
      headline="ทำก่อน เพราะงานถัดไปต้องใช้"
      badges={['proposal']}
      intro={<p>ลำดับงานที่เสนอ 4 เส้นทาง — ไม่ใช่ Critical Path ที่คำนวณแล้ว เพราะยังไม่มีข้อมูลทรัพยากรและระยะเวลางานย่อยที่ยืนยัน · แตะงานเพื่อไฮไลต์งานก่อนหน้าและถัดไป</p>}
      takeaway="เชื่อมระบบเฉพาะส่วนที่จำเป็น ไม่สร้างเงื่อนไขให้ทุกงานรอกัน"
    >
      <div className="dep-legend" aria-label="คำอธิบายเส้น">
        <span><i className="lg-solid" aria-hidden="true" /> เส้นทึบ = เงื่อนไขก่อนผ่านจุดตรวจ</span>
        <span><i className="lg-dash" aria-hidden="true" /> เส้นประ = สนับสนุน ทำคู่ขนานได้</span>
        {hood && <button type="button" className="mini-btn" onClick={close}>ล้างการเลือก</button>}
      </div>
      <div className={`depmap${hood ? ' has-focus' : ''}`}>
        <button type="button" className={`r3-rail${selection?.kind === 'workstream' && selection.id === 'R3' ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'workstream', id: 'R3' }, e.currentTarget)}>
          <span className="ws-id">R3</span>
          <span className="rail-title">{r3.title}</span>
          <span className="rail-note">ฐานเชื่อม · สนับสนุนเฉพาะส่วนที่ใช้</span>
        </button>
        <div className="dep-paths">
          {dependencyPaths.map((p) => (
            <div key={p.id} className={`dep-path${p.usesR3 ? ' uses-r3' : ''}${hood && hood.path !== p.id ? ' path-dim' : ''}`}>
              <div className="dep-path-head">
                <h3>{p.title}</h3>
                {p.usesR3 && <span className="r3-tag">ใช้ข้อมูลจาก R3 <span aria-hidden="true">┄</span></span>}
              </div>
              {p.lanes.map((lane, li) => (
                <div key={li} className="dep-lane">
                  {lane.label && <p className="dep-lane-label">{lane.label}</p>}
                  <ol className="dep-chain">
                    {lane.nodes.map((n) => (
                      <li key={n.id} className={`dep-item${stateOf(n.id)}`}>
                        <button type="button" className="dep-node" aria-haspopup="dialog" aria-pressed={n.id === selectedId} onClick={(e) => select({ kind: 'depnode', id: n.id }, e.currentTarget)}>
                          {hood && n.id === hood.prev && <span className="dep-rel">ก่อนหน้า</span>}
                          {hood && n.id === hood.next && <span className="dep-rel">ถัดไป</span>}
                          {n.label}
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <p className="dep-parallel"><span className="lg-dash-inline" aria-hidden="true" /> คู่ขนาน: {p.parallel}</p>
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  )
}
