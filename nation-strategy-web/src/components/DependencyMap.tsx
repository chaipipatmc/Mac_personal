import { useApp } from '../lib/appContext'
import { dependencyPaths, wsById } from '../data/nationPlan'
import { SceneShell } from './SceneShell'
import { Icon, type IconName } from './Icon'

const PATH_ICON: Record<string, IconName> = { people: 'people', data: 'data', business: 'growth', local: 'local' }
/** Proposed no-skip gates (shown with a lock). */
const NO_SKIP = new Set(['p3', 'p5', 'd2', 'd4', 'l1'])
const PARALLEL: Record<string, string> = {
  people: 'Survey คน + งาน + ระบบพร้อมกัน',
  data: 'Prototype ด้วย Mock/Allowed Data ได้ก่อน',
  business: 'Gov ไม่รอ Audience ID · Community Plan ไม่รอ Platform',
  local: 'เตรียมคู่ขนาน · ไม่รอ AI Pilots',
}

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
      headline="Dependency Map"
      badges={['proposal']}
      intro={<p>ลำดับที่เสนอ (ไม่ใช่ Critical Path ที่คำนวณแล้ว) · แตะเพื่อดู Before / Next</p>}
      takeaway="เชื่อมระบบเท่าที่จำเป็น — ไม่ให้ทุกงานต้องรอกัน"
    >
      <div className="dep-legend" aria-label="คำอธิบายเส้น">
        <span><i className="lg-solid" aria-hidden="true" /> Hard Gate</span>
        <span><Icon name="lock" size={16} /> No-skip</span>
        <span><i className="lg-dash" aria-hidden="true" /> Support / Parallel</span>
        {hood && <button type="button" className="mini-btn" onClick={close}>Clear</button>}
      </div>
      <div className={`depmap${hood ? ' has-focus' : ''}`}>
        <button type="button" className={`r3-rail${selection?.kind === 'workstream' && selection.id === 'R3' ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'workstream', id: 'R3' }, e.currentTarget)}>
          <Icon name="data" size={26} />
          <span className="ws-id">R3</span>
          <span className="rail-title">{r3.title}</span>
          <span className="rail-note">Shared Foundation · ใช้เท่าที่จำเป็น</span>
        </button>
        <div className="dep-paths">
          {dependencyPaths.map((p) => (
            <div key={p.id} className={`dep-path${p.usesR3 ? ' uses-r3' : ''}${hood && hood.path !== p.id ? ' path-dim' : ''}`}>
              <div className="dep-path-head">
                <h3><Icon name={PATH_ICON[p.id]} size={20} />{p.title}</h3>
                {p.usesR3 && <span className="r3-tag">┄ uses R3</span>}
              </div>
              {p.lanes.map((lane, li) => (
                <div key={li} className="dep-lane">
                  {lane.label && <p className="dep-lane-label">{lane.label}</p>}
                  <ol className="dep-chain">
                    {lane.nodes.map((n) => (
                      <li key={n.id} className={`dep-item${stateOf(n.id)}`}>
                        <button type="button" className="dep-node" aria-haspopup="dialog" aria-pressed={n.id === selectedId} onClick={(e) => select({ kind: 'depnode', id: n.id }, e.currentTarget)}>
                          {hood && n.id === hood.prev && <span className="dep-rel">Before</span>}
                          {hood && n.id === hood.next && <span className="dep-rel">Next</span>}
                          <span className="dep-label">{NO_SKIP.has(n.id) && <Icon name="lock" size={14} />}{n.label}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
              <p className="dep-parallel"><Icon name="parallel" size={16} />{PARALLEL[p.id]}</p>
            </div>
          ))}
        </div>
      </div>
    </SceneShell>
  )
}
