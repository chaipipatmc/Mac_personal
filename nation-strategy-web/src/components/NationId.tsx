import { useState } from 'react'
import { useApp } from '../lib/appContext'
import { idOutcomes, idSources, nationIdBoxes, storySteps } from '../data/upgrade26'
import { SceneShell } from './SceneShell'
import { E } from './Editable'
import { Icon, type IconName } from './Icon'

const SRC_ICON: Record<string, IconName> = { LINE: 'review', Website: 'tech', Event: 'event', 'ฐานสมาชิกเดิม': 'data' }
const BOX_ICON: Record<string, IconName> = { identity: 'userCheck', journey: 'flow', interest: 'target', activation: 'rocket' }

export function NationId() {
  const { select, isSelected } = useApp()
  const [step, setStep] = useState(-1)
  const [anon, setAnon] = useState(false)
  const cur = step >= 0 ? storySteps[step] : null
  const lit = cur?.box
  return (
    <SceneShell
      id="nation-id"
      headline="Nation ID → Community + Commercial"
      badges={['meeting26', 'proposal', 'pending']}
      intro="ภาพแนวคิด — ไม่ใช่ระบบจริง · หน้านี้ไม่เก็บข้อมูลใด ๆ"
      takeaway="ตัวตนที่ยืนยันได้ + การแจ้งใช้ข้อมูล → คุณค่าที่วัดได้"
    >
      <div className="nid">
        <ul className="nid-sources" aria-label="แหล่งข้อมูล">
          {idSources.map((s) => <li key={s}><Icon name={SRC_ICON[s] ?? 'plus'} size={18} />{s}</li>)}
        </ul>
        <span className="nid-fan" aria-hidden="true"><Icon name="arrow" size={26} /></span>
        <div className={`nid-core${anon && cur ? ' is-anon' : ''}`}>
          <Icon name={anon && cur ? 'user' : 'userCheck'} size={34} />
          <strong><E k="nid.core" v="Nation Person ID" label="Core" /></strong>
          <small>{anon && cur ? 'Anonymous — ไม่สร้าง ID' : <E k="nid.core.sub" v="ผู้ใช้ไม่ต้องจำเลข" label="Sub" />}</small>
        </div>
        <span className="nid-fan" aria-hidden="true"><Icon name="arrow" size={26} /></span>
        <ul className="nid-outcomes">
          {idOutcomes.map((o) => <li key={o}><Icon name={o === 'Community' ? 'community' : 'growth'} size={20} />{o}</li>)}
        </ul>
      </div>

      <ol className="nid-boxes">
        {nationIdBoxes.map((b, i) => (
          <li key={b.id}>
            <button type="button" className={`nid-box${lit === b.id ? ' is-lit' : ''}${isSelected('nid', b.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'nid', id: b.id }, e.currentTarget)}>
              <span className="nid-box-no">{i + 1}</span>
              <Icon name={BOX_ICON[b.id]} size={26} />
              <E className="nid-box-h" k={`nid.${b.id}`} v={b.label} label="Label" />
              <E className="nid-box-s" k={`nid.${b.id}.short`} v={b.short ?? ''} label="Short" />
            </button>
          </li>
        ))}
      </ol>

      <div className="story" aria-label="Story mode">
        <div className="story-bar">
          <span className="story-h"><Icon name="user" size={18} />Story (สมมติ)</span>
          <button type="button" className="seg" onClick={() => setStep((s) => Math.max(-1, s - 1))} disabled={step < 0} aria-label="ขั้นก่อนหน้า">‹</button>
          <ol className="story-dots">
            {storySteps.map((s, i) => (
              <li key={s.id}><button type="button" className={`dot${i === step ? ' on' : ''}${i < step ? ' done' : ''}`} aria-label={`ขั้น ${i + 1}: ${s.title}`} aria-current={i === step ? 'step' : undefined} onClick={() => setStep(i)}>{i + 1}</button></li>
            ))}
          </ol>
          <button type="button" className="seg" onClick={() => setStep((s) => Math.min(storySteps.length - 1, s + 1))} disabled={step >= storySteps.length - 1}>{step < 0 ? 'Start ›' : 'Next ›'}</button>
          <label className="anon-toggle"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />ยังไม่ Login</label>
        </div>
        <p className="story-line" aria-live="polite">
          {cur ? <><strong>{step + 1}. {cur.title}</strong> — {anon && cur.anonymous ? cur.anonymous : cur.detail}</> : <span className="muted">กด Start เพื่อไล่ตัวอย่างการเดินทางของผู้อ่าน 1 คน</span>}
        </p>
      </div>

      <div className="nid-more">
        <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'entities', id: 'entities' }, e.currentTarget)}><Icon name="link" size={16} />ดูสิ่งที่เชื่อมกัน</button>
        <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'lineflow', id: 'lineflow' }, e.currentTarget)}><Icon name="review" size={16} />ดู Flow LINE</button>
        <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'r5lanes', id: 'R5' }, e.currentTarget)}><Icon name="parallel" size={16} />R5: On-ground · Online · Legacy</button>
      </div>
    </SceneShell>
  )
}
