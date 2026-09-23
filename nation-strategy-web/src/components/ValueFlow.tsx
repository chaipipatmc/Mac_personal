import { useApp } from '../lib/appContext'
import { fourC, valueExtras, valuePaths } from '../data/nationPlan'
import { SceneShell } from './SceneShell'
import { Badge } from './Badge'

export function ValueFlow() {
  const { select, isSelected } = useApp()
  return (
    <SceneShell
      id="value"
      headline="จากข้อมูล ไปสู่ผลลัพธ์ธุรกิจ"
      badges={['meeting', 'pending']}
      intro={<p>รักษาแนวทาง 4C ที่หารือ แล้วแสดงเส้นทางตัวอย่างที่เสนอให้ทดลอง — เป็นผลที่ต้องพิสูจน์ ไม่ใช่ผลที่เกิดแล้ว</p>}
      takeaway="Data ต้องเปลี่ยนการทำงาน การขาย หรือการสร้างธุรกิจได้"
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
              <span className="fourc-step" aria-hidden="true">{i + 1}</span>
              <span className="fourc-label">{n.label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="vpaths">
        <div className="vpaths-head">
          <h3>เส้นทางตัวอย่างที่เสนอให้ทดลอง</h3>
          <Badge kind="proposal" small />
        </div>
        <ul className="vpath-list">
          {valuePaths.map((p) => (
            <li key={p.id}>
              <button type="button" className={`vpath${isSelected('path', p.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'path', id: p.id }, e.currentTarget)}>
                <span className="vpath-steps">
                  {p.steps.map((s, i) => (
                    <span key={s} className="vstep">{s}{i < p.steps.length - 1 && <span className="varrow" aria-hidden="true">→</span>}</span>
                  ))}
                </span>
                <span className="vpath-proof"><span className="proof-tag">ต้องพิสูจน์</span>{p.proof}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="vextras">
          {valueExtras.map((x) => (
            <button key={x.id} type="button" className={`mini-btn${isSelected('extra', x.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'extra', id: x.id }, e.currentTarget)}>
              {x.title}
            </button>
          ))}
        </div>
      </div>
    </SceneShell>
  )
}
