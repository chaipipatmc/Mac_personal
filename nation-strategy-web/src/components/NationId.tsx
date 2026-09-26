import { useState } from 'react'
import { useApp } from '../lib/appContext'
import { idDomains, idOutcomes, manySystems, nationIdBoxes, phase1Ids, storySteps } from '../data/upgrade26'
import { SceneShell } from './SceneShell'
import { E } from './Editable'
import { Badge } from './Badge'
import { Icon, type IconName } from './Icon'

const BOX_ICON: Record<string, IconName> = { identity: 'userCheck', journey: 'flow', interest: 'target', activation: 'rocket' }
const P1_ICON: Record<string, IconName> = { Person: 'user', Organization: 'building', Content: 'content', Topic: 'target', 'Event / Session': 'event', Activity: 'gear' }

export function NationId() {
  const { select, isSelected } = useApp()
  const [step, setStep] = useState(-1)
  const [anon, setAnon] = useState(false)
  const cur = step >= 0 ? storySteps[step] : null
  const lit = cur?.box
  const anonNow = anon && !!cur
  return (
    <SceneShell
      id="nation-id"
      headline="Nation ID: รหัสกลางของทุกสิ่ง"
      badges={['meeting26', 'proposal', 'pending']}
      intro="ภาพแนวคิด — ไม่ใช่ระบบจริง · รหัสทั้งหมดเป็นตัวอย่าง · หน้านี้ไม่เก็บข้อมูลใด ๆ"
      takeaway="Many systems, one truth — CRM · DAM · LINE มี ID ของตัวเอง แล้วโยงกลับ Nation ID"
    >
      <p className="nid-banner">
        <Icon name="target" size={26} />
        <strong><E k="nid.banner" v="One real-world entity = One Nation ID" label="Banner" /></strong>
        <span><E k="nid.banner.sub" v="สิ่งเดียวกันในโลกจริง มีรหัสกลางเดียว แล้วค่อยเชื่อม Role / Relationship / Activity" label="Sub" multiline /></span>
      </p>

      <div className="idmap">
        <div className={`idmap-core${anonNow ? ' is-anon' : ''}`}>
          <Icon name={anonNow ? 'user' : 'key'} size={26} />
          <strong><E k="nid.core" v="Nation ID" label="Core" /></strong>
          <small>{anonNow ? 'Anonymous — ยังไม่ผูก Person' : <E k="nid.core.sub2" v="Canonical ID · ผู้ใช้ไม่ต้องจำเลข" label="Sub" />}</small>
        </div>
        <ul className="idmap-domains">
          {idDomains.map((g) => (
            <li key={g.id}>
              <button type="button" className={`iddom iddom-${g.id}${isSelected('iddomain', g.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'iddomain', id: g.id }, e.currentTarget)}>
                <span className="iddom-head"><Icon name={g.icon} size={22} /><strong>{g.label}</strong></span>
                <span className="iddom-th">{g.th}</span>
                <span className="iddom-ids">{g.ids.map((i) => <span key={i.code} className="idchip">{i.label}</span>)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button type="button" className={`phase1${isSelected('phase1', 'phase1') ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'phase1', id: 'phase1' }, e.currentTarget)}>
        <span className="phase1-head"><Icon name="flag" size={18} /><strong><E k="nid.phase1" v="Phase 1: Start with 6 IDs" label="Label" /></strong><Badge kind="proposal" small /><span className="phase1-sub"><E k="nid.phase1.sub" v="แค่ Forum Pilot ก็เริ่มสร้าง Graph ได้" label="Sub" /></span></span>
        <span className="phase1-chain">
          {phase1Ids.map((p, i) => (
            <span key={p.code} className="p1-step">
              <span className="p1-ico"><Icon name={P1_ICON[p.code] ?? 'plus'} size={18} /></span>
              <span className="p1-t"><strong>{p.code}</strong><small>{p.q}</small></span>
              {i < phase1Ids.length - 1 && <Icon name="arrow" size={14} className="p1-arrow" />}
            </span>
          ))}
        </span>
      </button>

      <ol className="vloop" aria-label="จาก ID สู่คุณค่า">
        {nationIdBoxes.map((b) => (
          <li key={b.id}>
            <button type="button" className={`vl-box${lit === b.id ? ' is-lit' : ''}${isSelected('nid', b.id) ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'nid', id: b.id }, e.currentTarget)}>
              <Icon name={BOX_ICON[b.id]} size={20} />
              <E className="vl-h" k={`nid.${b.id}`} v={b.label} label="Label" />
              <E className="vl-s" k={`nid.${b.id}.short`} v={b.short ?? ''} label="Short" />
            </button>
          </li>
        ))}
        <li className="vl-out">{idOutcomes.map((o) => <span key={o}><Icon name={o === 'Community' ? 'community' : 'growth'} size={16} />{o}</span>)}</li>
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
          {cur
            ? <><strong>{step + 1}. {cur.title}</strong> — {anon && cur.anonymous ? cur.anonymous : cur.detail} <code className="story-code">{anon && cur.anonCode ? cur.anonCode : cur.code}</code></>
            : <span className="muted">กด Start เพื่อไล่ตัวอย่างการเดินทางของผู้อ่าน 1 คน</span>}
        </p>
      </div>

      <div className="nid-more">
        <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'idrules', id: 'idrules' }, e.currentTarget)}><Icon name="shield" size={16} />หลัก 3 ข้อ + 5 แนวคิด</button>
        <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'alias', id: 'alias' }, e.currentTarget)}><Icon name="key" size={16} />Master vs Alias</button>
        <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'lineflow', id: 'lineflow' }, e.currentTarget)}><Icon name="review" size={16} />ดู Flow LINE</button>
        <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'r5lanes', id: 'R5' }, e.currentTarget)}><Icon name="parallel" size={16} />R5: On-ground · Online · Legacy</button>
      </div>
      <ul className="systems" aria-label="Many systems, one truth">
        {manySystems.map((m) => <li key={m.sys}><strong>{m.sys}</strong><small>{m.own}</small></li>)}
        <li className="systems-to"><Icon name="arrow" size={18} /><strong>Nation ID</strong></li>
      </ul>
    </SceneShell>
  )
}
