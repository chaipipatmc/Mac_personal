import { useApp } from '../lib/appContext'
import { meta, outcomes, pillars } from '../data/nationPlan'
import { fmtDate } from '../lib/dates'
import { SceneShell } from './SceneShell'

export function DirectionScene() {
  const { select, isSelected, goScene } = useApp()
  return (
    <SceneShell
      id="direction"
      chapter="บท A · ทิศทางจากประชุม"
      headline="Nation สู่ Media Tech"
      badges={['meeting']}
      intro={<>
        <p className="lede">{meta.keyMessage}</p>
        <p>สรุปทิศทางจากประชุม {fmtDate(meta.dataAsOf)} โดย {meta.presenter} · การจัดภาพเป็นการสังเคราะห์เพื่อสื่อสาร ไม่ใช่โครงสร้างที่อนุมัติ</p>
      </>}
      takeaway="เปลี่ยนทั้งองค์กรและวิธีทำธุรกิจ ไม่ใช่เพิ่มเครื่องมือ AI"
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
                <span className="outcome-label">{o.label}</span>
                <span className="outcome-tags">{o.expands.join(' · ')}</span>
                <span className="more-cue">ดูรายละเอียด</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="pillars" aria-label="องค์ประกอบของการเปลี่ยน">
          {pillars.map((p, i) => (
            <span key={p} className="pillar">{p}{i < pillars.length - 1 && <span className="plus" aria-hidden="true">+</span>}</span>
          ))}
        </div>
        <div className="dir-questions">
          <p>คำถามที่หน้านี้ตอบ</p>
          <ol>
            {[['value', 'เราจะไปไหน'], ['plan', 'ต้องทำอะไร'], ['dependency', 'อะไรเชื่อมกัน'], ['priority', 'เริ่มอะไรก่อน'], ['timeline', 'ส่งมอบเมื่อไร'], ['decision', 'ต้องตัดสินใจอะไร']].map(([id, q], i) => (
              <li key={q}><button type="button" className="q-chip" onClick={() => goScene(id as 'plan')}>{i + 1}. {q}</button></li>
            ))}
          </ol>
        </div>
      </div>
    </SceneShell>
  )
}
