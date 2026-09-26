import {
  candById, decisions, dependencyPaths, fourC, meta, msById, outcomes, pilotCandidates, pilotSelectionCriteria,
  priorities, r1DiscussedFunctions, sources, supportTeamNote, taskById, tasksOf, valueExtras, valuePaths, weeklyReview,
  wsById, yearEndCheckpoints, relations, noSkipRules, planState,
  type Basis, type MilestoneId, type SourceRef, type WorkstreamId,
} from './nationPlan'
import {
  connectedNodes, focusTiers, idDomains, idFrameworkSources, manySystems, nationIdBoxes, openQuestions26, phase1Ids, proposedCheckpoints, r6Tracks, type InfoNode,
} from './upgrade26'
import { checkpointTasks, milestonesFedBy, successorsOf } from '../lib/graph'
import { fmtDate, fmtRange } from '../lib/dates'
import type { Selection, TimelineFocus } from '../lib/selection'

export interface Field { text: string; more?: string[] }
export interface LinkItem { label: string; sel: Selection }

export interface DetailContent {
  kindLabel: string
  code?: string
  title: string
  badges: Basis[]
  what: Field | null
  why: Field | null
  owner: Field | null
  timing: Field | null
  prereq: Field | null
  prereqLinks?: LinkItem[]
  deliverable: Field | null
  unlocks: Field | null
  unlockLinks?: LinkItem[]
  pending: Field | null
  sourceRefs: SourceRef[]
  timeline?: TimelineFocus
  extra?: { heading: string; items: string[]; tone?: 'caution' | 'plain' }
  /** Interactive block rendered by the panel (owners board, backup, flows…). */
  custom?: 'owners' | 'backup' | 'issues' | 'principles' | 'alias' | 'buckets' | 'kgraph' | 'lineflow' | 'r6' | 'r5'
  /** Hide the What/Why/… rows (tool panels). */
  hideRows?: boolean
}

const f = (text: string, more?: string[]): Field => ({ text, more: more?.length ? more : undefined })
const UNCONFIRMED = 'ยังไม่ยืนยัน'

const linkOf = (id: string): LinkItem => {
  if (id in msById) {
    const m = msById[id as MilestoneId]
    return { label: `${m.id} ${m.label}`, sel: { kind: 'milestone', id } }
  }
  if (taskById[id]) return { label: `${id} ${taskById[id].title}`, sel: { kind: 'task', id } }
  const w = wsById[id as WorkstreamId]
  return { label: `${w.id} ${w.shortTitle}`, sel: { kind: 'workstream', id } }
}

const basisLabel = (b: string) =>
  b === 'meeting_date' ? 'วันที่ในบันทึกประชุม' : b === 'meeting_year_end' ? 'กรอบสิ้นปีจากประชุม' : 'วันที่เสนอ'

function workstreamDetail(id: WorkstreamId): DetailContent {
  const w = wsById[id]
  const ts = tasksOf(id)
  const rels = relations.filter((r) => r.from === id || r.to === id)
  return {
    kindLabel: 'Workstream', code: w.id, title: w.title,
    badges: [w.ownerBasis === 'meeting26' ? 'meeting26' : 'meeting', 'proposal', ...(w.ownerBasis === 'pending' || /TBC/.test(w.ownerLabel) ? (['pending'] as Basis[]) : [])],
    what: f(w.what, [`ทิศทางจากประชุม: ${w.meetingDirection}`]),
    why: f(w.why),
    owner: f(w.ownerLabel, [`Support: ${w.support}`, w.ownerBasis === 'pending' ? 'สถานะ: รอยืนยัน' : w.ownerBasis === 'meeting26' ? 'ที่มา: ประชุม 26 ก.ย. — ชื่อยังแก้ไขได้' : 'สถานะ: เสนอ — รออนุมัติ']),
    timing: f(`${fmtRange(ts[0].start, ts[ts.length - 1].end)} · วันที่เสนอ`, ts.map((t) => `${t.id} ${t.title}: ${fmtRange(t.start, t.end)}`)),
    prereq: f('เริ่มสำรวจได้ทันที ไม่ต้องรอ Workstream อื่น', rels.filter((r) => r.to === id || r.bidirectional).map((r) => `${r.from === id ? r.to : r.from} → ${id}: ${r.shortReason} (สนับสนุน)`)),
    deliverable: f(w.proposedOutcome, [`ตรวจรับจาก: ${w.acceptance}`]),
    unlocks: f(w.unlocks, rels.filter((r) => r.from === id).map((r) => `${id} → ${r.to}: ${r.shortReason}`)),
    unlockLinks: rels.map((r) => linkOf(r.from === id ? r.to : r.from)),
    pending: f(w.pending[0], w.pending.slice(1)),
    prereqLinks: ts.map((t) => linkOf(t.id)),
    sourceRefs: [...w.sourceRefs, { source: 'E01', note: 'สิ่งส่งมอบ/ตรวจรับเป็นข้อเสนอจากร่าง v0.1' }],
    timeline: { workstream: id },
    custom: id === 'R6' ? 'r6' : id === 'R5' ? 'r5' : undefined,
    extra: id === 'R1'
      ? { heading: 'ฟังก์ชันที่หารือว่าจะเพิ่มได้ (ไม่ใช่ Org Chart ที่อนุมัติ)', items: r1DiscussedFunctions, tone: 'caution' }
      : id === 'R3'
        ? { heading: 'หมายเหตุชื่อระบบ', items: ['Nation House = Internal System', 'Nation ID = รหัสกลางของคน องค์กร เนื้อหา และกิจกรรม', 'ชื่อและขอบเขตยังต้องยืนยัน — ไม่ใช่ฐานข้อมูลเดียวกันที่ทุกฝ่ายเข้าถึงได้ทั้งหมด'], tone: 'caution' }
        : undefined,
  }
}

function taskDetail(id: string): DetailContent {
  const t = taskById[id]
  const w = wsById[t.workstreamId]
  const cand = t.conditionalOn && t.conditionalOn !== 'LOCAL_APPROVAL' ? candById[t.conditionalOn] : null
  const succ = [...successorsOf(id), ...milestonesFedBy(id)]
  const cps = t.checkpoints.map((c) => c.milestoneId
    ? `${c.milestoneId} ${fmtDate(msById[c.milestoneId].date, false)}: ${c.label}`
    : `${fmtDate(c.date!, false)}: ${c.label}`)
  const pendingItems: string[] = []
  if (cand) pendingItems.push(`Candidate ${cand.id} — ${cand.title}: รอเลือกที่ M2 (${planState.selectedPilotIds ? 'เลือกแล้ว' : 'ยังไม่เลือก'})`)
  if (t.conditionalOn === 'LOCAL_APPROVAL') pendingItems.push('ต้องได้รับอนุมัติธุรกิจแยก · วันเริ่มจริงรอยืนยัน')
  pendingItems.push(`สถานะจริง: ${UNCONFIRMED} · ความคืบหน้า: —`)
  return {
    kindLabel: 'Work Package', code: t.id, title: t.title,
    badges: ['proposal', ...(t.conditionalOn ? (['pending'] as Basis[]) : [])],
    what: f(t.note, t.scope?.length ? ['ขอบเขตจากประชุม 26 ก.ย.:', ...t.scope] : undefined),
    why: f(w.why),
    owner: f(t.owner ?? w.ownerLabel),
    timing: f(`${fmtRange(t.start, t.end)} · ${basisLabel(t.dateBasis)}`, cps.length ? ['จุดตรวจระหว่างทาง (อยู่ภายในแถบ ไม่ใช่เงื่อนไขก่อนเริ่ม):', ...cps] : undefined),
    prereq: f(t.predecessors.length ? t.predecessors.map((p) => linkOf(p).label).join(' + ') : 'ไม่มี — เริ่มได้ทันที'),
    prereqLinks: t.predecessors.map(linkOf),
    deliverable: f(t.deliverable, [`เกณฑ์จบ: ${t.acceptance}`]),
    unlocks: f(succ.length ? succ.map((s) => linkOf(s).label).join(', ') : 'ส่งต่อไปยังการตรวจรับตาม Gate ภายในแถบ'),
    unlockLinks: succ.map(linkOf),
    pending: f(pendingItems[0], pendingItems.slice(1)),
    sourceRefs: [...t.sourceRefs, ...w.sourceRefs],
    timeline: { task: id, workstream: t.workstreamId },
  }
}

function milestoneDetail(id: MilestoneId): DetailContent {
  const m = msById[id]
  const unlock = successorsOf(id)
  const inside = checkpointTasks(id)
  return {
    kindLabel: 'Milestone', code: m.id, title: m.label,
    badges: [m.dateBasis === 'proposed' ? 'proposal' : 'meeting', 'pending'],
    what: f(m.deliverables),
    why: f(m.acceptance),
    owner: f(m.owner, [`ผู้รับรอง: ${m.approver}`]),
    timing: f(`${fmtDate(m.date)} · ${m.dateBasisNote}`),
    prereq: m.fedBy.length
      ? f(m.fedBy.map((t) => linkOf(t).label).join(', '), m.acceptanceConditions.map((c) => `ตรวจ: ${c}`))
      : f('ตรวจตามเงื่อนไข Gate', m.acceptanceConditions),
    prereqLinks: m.fedBy.map(linkOf),
    deliverable: f(m.acceptance, [...m.acceptanceConditions.map((c) => `✓ ${c}`), 'ยังไม่มี Gate ใดผ่านแล้ว — สถานะจริง: ยังไม่ยืนยัน']),
    unlocks: f(unlock.length ? unlock.map((t) => linkOf(t).label).join(', ') : inside.length ? `ตรวจภายในแถบ: ${inside.join(', ')}` : '—'),
    unlockLinks: [...unlock, ...inside].map(linkOf),
    pending: f('เกณฑ์ Gate เป็นข้อเสนอ แม้วันที่บางรายการมาจากบันทึก',
      proposedCheckpoints.filter((c) => c.gate === id).map((c) => `Checkpoint ที่เสนอ ${c.id} ${c.label} · ${c.windowText}`)),
    sourceRefs: m.sourceRefs,
    timeline: { milestone: id },
  }
}

function outcomeDetail(id: string): DetailContent {
  const o = outcomes.find((x) => x.id === id)!
  return {
    kindLabel: 'ผลลัพธ์ที่มุ่งหวัง', title: o.label, badges: ['meeting'],
    what: f(o.expands.join(' · ')),
    why: f('เปลี่ยนทั้งองค์กรและวิธีทำธุรกิจ ไม่ใช่เพิ่มเครื่องมือ AI'),
    owner: f('ฝ่ายธุรกิจเป็นเจ้าของผลลัพธ์ — Mac เชื่อมแผน'),
    timing: f('กรอบ Reform สิ้นปี 2026 (จากประชุม)'),
    prereq: null,
    deliverable: f('ดูเกณฑ์ตรวจรับของแต่ละ Workstream'),
    unlocks: f(o.workstreams.map((w) => `${w} ${wsById[w].shortTitle}`).join(' · ')),
    unlockLinks: o.workstreams.map(linkOf),
    pending: f('การจัดกลุ่มเป็นภาพสังเคราะห์เพื่อสื่อสาร ไม่ใช่โครงสร้างองค์กรที่อนุมัติ'),
    sourceRefs: o.sourceRefs,
  }
}

function flowDetail(id: string): DetailContent {
  const n = fourC.find((x) => x.id === id)!
  return {
    kindLabel: '4C', title: n.label, badges: ['meeting'],
    what: f(n.text, n.detail), why: f('Data ต้องเปลี่ยนการทำงาน การขาย หรือการสร้างธุรกิจได้'),
    owner: f(wsById[n.workstreamId].ownerLabel), timing: null, prereq: null,
    deliverable: null, unlocks: f(`${n.workstreamId} ${wsById[n.workstreamId].title}`), unlockLinks: [linkOf(n.workstreamId)],
    pending: f('ไม่แสดงตัวเลขสมาชิก รายได้ หรือผลประหยัดสมมติ'),
    sourceRefs: [{ source: 'B4C', note: 'ลำดับ 4C จากไวท์บอร์ด' }, { source: 'S23', sections: '§8', note: '4C' }],
    timeline: { workstream: n.workstreamId },
  }
}

function pathDetail(id: string): DetailContent {
  const p = valuePaths.find((x) => x.id === id)!
  const c = candById[p.candidateId]
  return {
    kindLabel: 'เส้นทางที่เสนอให้ทดลอง', title: p.steps.join(' → '), badges: ['proposal', 'pending'],
    what: f(c.firstScope), why: f(`ผลที่ต้องพิสูจน์: ${p.proof}`),
    owner: f(wsById[p.workstreamId].ownerLabel), timing: f(`ถ้าได้รับเลือกที่ M2: ทดสอบ ${fmtDate(msById.M4.date, false)} → เปิดใช้ ${fmtDate(msById.M5.date, false)} → วัดผล ${fmtDate(msById.M6.date, false)}`),
    prereq: f('ได้รับเลือกเป็น Pilot ที่ M2 และผ่านสิทธิข้อมูล'), prereqLinks: [linkOf('M2')],
    deliverable: f(`หลักฐานก่อนขยาย: ${c.evidence}`),
    unlocks: f(`Candidate ${c.id} — ${c.title}`), unlockLinks: [{ label: `${c.id} ${c.title}`, sel: { kind: 'candidate', id: c.id } }, linkOf(c.taskId)],
    pending: f('เป็นภาพการใช้งานที่เสนอให้ทดลอง ไม่ใช่คำกล่าวอ้างว่าระบบพร้อมแล้ว'),
    sourceRefs: p.sourceRefs, timeline: { task: c.taskId, workstream: p.workstreamId },
  }
}

function extraDetail(id: string): DetailContent {
  const x = valueExtras.find((e) => e.id === id)!
  return {
    kindLabel: 'รายละเอียดเส้นทาง', title: x.title, badges: ['meeting', 'pending'],
    what: f(x.steps.join(' / ')), why: f(x.note), owner: f(wsById[x.workstreamId].ownerLabel),
    timing: null, prereq: null, deliverable: f(wsById[x.workstreamId].acceptance),
    unlocks: f(wsById[x.workstreamId].unlocks), unlockLinks: [linkOf(x.workstreamId)],
    pending: f(wsById[x.workstreamId].pending[0], wsById[x.workstreamId].pending.slice(1)),
    sourceRefs: x.sourceRefs, timeline: { workstream: x.workstreamId },
  }
}

function priorityDetail(id: string): DetailContent {
  const p = priorities.find((x) => x.id === id)!
  const inTimeline = id !== 'P3'
  return {
    kindLabel: 'Priority', code: p.id, title: p.label, badges: ['proposal'],
    what: f(p.scope), why: f(p.reason),
    owner: f(id === 'P0' ? 'Mac + HR + Finance + เจ้าของงาน' : id === 'P3' ? 'รอยืนยัน' : 'เจ้าของแต่ละ Workstream'),
    timing: f(inTimeline ? 'ดูช่วงงานใน Timeline — วันที่เสนอ' : 'ระยะขยาย / ยังไม่กำหนดวัน'),
    prereq: f(id === 'P0' ? 'ไม่มี — เริ่มคู่ขนานทั้ง 7 งาน' : id === 'P1' ? 'M2 ยืนยัน Scope' : id === 'P2' ? 'M2 เลือก Pilot + M3 รับรองแบบงาน' : 'ผล Pilot'),
    deliverable: f(`เงื่อนไขจบ: ${p.exitCondition}`),
    unlocks: f(id === 'P3' ? '—' : `ระดับถัดไป: ${priorities[priorities.indexOf(p) + 1]?.label ?? '—'}`),
    pending: f('P1/P2 ไม่ใช่สองเฟสที่ต้องรอกันทั้งหมด และไม่แปลว่า Community/Government/Local สำคัญน้อยกว่า'),
    sourceRefs: [{ source: 'E01', note: 'Priority P0–P3 เป็นข้อเสนอใหม่ของ Mac' }],
    extra: id === 'P2' ? { heading: 'เลือกจาก (ไม่มีคะแนนหรือผู้ชนะล่วงหน้า)', items: pilotSelectionCriteria } : undefined,
  }
}

function candidateDetail(id: string): DetailContent {
  const c = candById[id as keyof typeof candById]
  return {
    kindLabel: 'Pilot Candidate', code: c.id, title: c.title, badges: ['proposal', 'pending'],
    what: f(c.firstScope), why: f(wsById[c.workstreamId].why),
    owner: f(wsById[c.workstreamId].ownerLabel),
    timing: f(`ถ้าได้รับเลือก: ${fmtRange(taskById[c.taskId].start, taskById[c.taskId].end)} (วันที่เสนอ)`),
    prereq: f('ได้รับเลือกที่ M2 · M3 รับรองแบบงาน'), prereqLinks: [linkOf('M2'), linkOf('M3')],
    deliverable: f(`หลักฐานก่อนขยาย: ${c.evidence}`),
    unlocks: f('M4 ทดสอบ → M5 ใช้จริง → M6 วัดผล — ประเมินเฉพาะ Pilot ที่เลือก ไม่รอครบ 4'),
    unlockLinks: [linkOf(c.taskId), linkOf('M4'), linkOf('M5'), linkOf('M6')],
    pending: f('สถานะ: รอเลือกที่ M2 — ยังไม่ติ๊กเลือกล่วงหน้า', [`เลือกจาก: ${pilotSelectionCriteria.join(' · ')}`]),
    sourceRefs: [{ source: 'E01', note: 'เลือก 2–3 Pilot จาก 4 Candidate' }, ...wsById[c.workstreamId].sourceRefs],
    timeline: { task: c.taskId, workstream: c.workstreamId },
  }
}

function depNodeDetail(id: string): DetailContent {
  for (const p of dependencyPaths) {
    for (const lane of p.lanes) {
      const i = lane.nodes.findIndex((n) => n.id === id)
      if (i < 0) continue
      const n = lane.nodes[i]
      const prev = lane.nodes[i - 1]
      const next = lane.nodes[i + 1]
      const refLinks: LinkItem[] = []
      if (n.ref?.task) refLinks.push(linkOf(n.ref.task))
      if (n.ref?.milestone) refLinks.push(linkOf(n.ref.milestone))
      if (n.ref?.workstream) refLinks.push(linkOf(n.ref.workstream))
      return {
        kindLabel: `ลำดับงานที่เสนอ · ${p.title}${lane.label ? ` / ${lane.label}` : ''}`, title: n.label, badges: ['proposal'],
        what: f(n.note), why: f('ทำก่อน เพราะงานถัดไปต้องใช้'),
        owner: f(n.ref?.task ? wsById[taskById[n.ref.task].workstreamId].ownerLabel : n.ref?.milestone ? msById[n.ref.milestone].owner : n.ref?.workstream ? wsById[n.ref.workstream].ownerLabel : '—'),
        timing: f(n.ref?.task ? fmtRange(taskById[n.ref.task].start, taskById[n.ref.task].end) + ' · วันที่เสนอ' : n.ref?.milestone ? fmtDate(msById[n.ref.milestone].date) : 'ยังไม่กำหนดวัน'),
        prereq: f(prev ? prev.label : 'ไม่มี — จุดเริ่มของเส้นทาง', prev ? ['เส้นทึบ = เงื่อนไขก่อนผ่านจุดตรวจ'] : undefined),
        deliverable: null,
        unlocks: f(next ? next.label : 'จบเส้นทาง — ส่งต่อการตัดสินใจ'),
        unlockLinks: refLinks,
        pending: f(`ทำคู่ขนานได้: ${p.parallel}`),
        sourceRefs: [{ source: 'E01', note: 'ลำดับงานที่เสนอ — ไม่ใช่ Critical Path ที่คำนวณแล้ว' }],
        timeline: n.ref?.task ? { task: n.ref.task } : n.ref?.milestone ? { milestone: n.ref.milestone } : n.ref?.workstream ? { workstream: n.ref.workstream } : undefined,
        extra: { heading: 'จุดห้ามข้ามที่เสนอ', items: noSkipRules, tone: 'caution' },
      }
    }
  }
  throw new Error(`unknown node ${id}`)
}

function checkpointDetail(id: string): DetailContent {
  const k = yearEndCheckpoints.find((x) => x.id === id)!
  return {
    kindLabel: 'จุดตรวจสิ้นปี', title: k.title, badges: ['proposal'],
    what: f(k.summary), why: f('จบงานจากหลักฐาน ไม่ใช่สถานะสีเขียว'),
    owner: f('เจ้าของฝ่ายส่งมอบผล · คุณฉายตรวจรับ'),
    timing: f(k.milestones.map((m) => `${m} ${fmtDate(msById[m].date, false)}`).join(' · ')),
    prereq: null, prereqLinks: k.milestones.map(linkOf),
    deliverable: f(k.evidence[0], k.evidence.slice(1)),
    unlocks: f('ส่งมอบงานประจำและแผนปี 2027'), unlockLinks: k.workstreams.map(linkOf),
    pending: f('งานค้างต้องแสดงตามจริง การย้ายไปปีหน้าไม่เท่ากับปิดงาน'),
    sourceRefs: [{ source: 'E01', note: 'เกณฑ์ตรวจรับเป็นข้อเสนอ' }, { source: 'S23', sections: '§26', note: 'กรอบ Reform สิ้นปี' }],
    timeline: { milestone: k.milestones[k.milestones.length - 1] },
  }
}

function decisionDetail(id: string): DetailContent {
  const d = decisions.find((x) => x.id === id)!
  return {
    kindLabel: 'เรื่องที่ขอให้ตัดสินใจ', title: d.title, badges: ['proposal', 'pending'],
    what: f(d.question), why: f(d.why), owner: f('ผู้ตัดสินใจ: คุณฉาย · ผู้เสนอ: Mac'),
    timing: f(`ขอยืนยันภายใน ${fmtDate(msById[d.relatedMilestone].date)} (${d.relatedMilestone} — วันที่เสนอ)`),
    prereq: f('ร่างส่ง M0 และทบทวนระบบ M1'), prereqLinks: [linkOf('M0'), linkOf('M1')],
    deliverable: f(`เงื่อนไข: ${d.conditions[0]}`, d.conditions.slice(1)),
    unlocks: f('เริ่มงานตาม Milestone ถัดไป'), unlockLinks: [linkOf(d.relatedMilestone)],
    pending: f(`สถานะ: ${d.status} — เว็บนี้ไม่ส่งผลการตัดสินใจ`),
    sourceRefs: [{ source: 'E01', note: 'เรื่องขออนุมัติ' }, { source: 'D26', note: 'ปรับตามประชุม 26 ก.ย.' }],
    timeline: { milestone: d.relatedMilestone },
    extra: id === 'D4' ? { heading: 'วันที่ที่บันทึกไม่ตรงกัน', items: openQuestions26.slice(0, 3), tone: 'caution' } : undefined,
  }
}


function infoDetail(kindLabel: string, n: InfoNode): DetailContent {
  const w = n.workstreamId ? wsById[n.workstreamId] : null
  return {
    kindLabel, title: n.label, badges: [n.basis, 'pending'],
    what: f(n.what, n.points), why: f(n.why),
    owner: f(w ? `${w.id} · ${w.ownerLabel}` : '—'),
    timing: null, prereq: null,
    deliverable: n.kpis ? f(`วัดผล: ${n.kpis[0]}`, n.kpis.slice(1)) : null,
    unlocks: w ? f(`${w.id} ${w.title}`) : null, unlockLinks: w ? [linkOf(w.id)] : undefined,
    pending: f('ภาพแนวคิดเพื่อสื่อสาร — ยังไม่ใช่ระบบที่สร้าง/ซื้อแล้ว'),
    sourceRefs: n.sourceRefs,
    timeline: w ? { workstream: w.id } : undefined,
    extra: n.caution ? { heading: 'ข้อควรระวัง', items: n.caution, tone: 'caution' } : undefined,
  }
}

function focusDetail(id: string): DetailContent {
  const t = focusTiers.find((x) => x.id === id)!
  return {
    kindLabel: 'Focus', code: t.id, title: t.label, badges: [t.basis, 'pending'],
    what: f(t.items.map((i) => `${i.ws} ${i.text}`).join(' · ')), why: f(t.note),
    owner: f(t.items.map((i) => `${i.ws}: ${wsById[i.ws].ownerLabel}`).join(' · ')),
    timing: f('ดูช่วงงานใน Timeline — วันที่เสนอ'), prereq: null, deliverable: null,
    unlocks: null, unlockLinks: t.items.map((i) => linkOf(i.ws)),
    pending: f('ลำดับจากประชุม 26 ก.ย. — ไม่ใช่การอนุมัติงบหรือวันเปิดใช้', ['ประวัติ: ข้อเสนอเดิม "เลือก 2–3 จาก C1–C4" อยู่ใน D3']),
    sourceRefs: [{ source: 'D26', sections: '§6, §24, §27', note: 'R6 และ R5 เริ่มก่อน · R7 แยกติดตาม' }, { source: 'P26', note: 'การจัดชั้น Focus เป็นข้อเสนอการสื่อสาร' }],
  }
}

function cp26Detail(id: string): DetailContent {
  const c = proposedCheckpoints.find((x) => x.id === id)!
  const m = msById[c.gate]
  return {
    kindLabel: 'Checkpoint ที่เสนอ', code: c.id, title: c.label, badges: ['proposal', 'pending'],
    what: f(c.meaning), why: f(`ผูกกับ Gate ${m.id} ${m.label} — ไม่ใช่ Milestone ใหม่`),
    owner: f(m.owner),
    timing: f(`${c.windowText}${c.targetWindow ? ` (${fmtRange(c.targetWindow.from, c.targetWindow.to)})` : ''} · วันยืนยัน: TBC`),
    prereq: null, prereqLinks: [linkOf(m.id)],
    deliverable: f(m.acceptanceConditions[0] ?? m.acceptance, m.acceptanceConditions.slice(1)),
    unlocks: null,
    pending: f('ไม่ย้าย M0–M7 อัตโนมัติ — รอยืนยันวันจริง'),
    sourceRefs: c.sourceRefs, timeline: { milestone: m.id },
  }
}

const tool = (kindLabel: string, title: string, custom: DetailContent['custom'], sourceRefs: SourceRef[] = [], badges: Basis[] = ['proposal']): DetailContent => ({
  kindLabel, title, badges, what: null, why: null, owner: null, timing: null, prereq: null, deliverable: null,
  unlocks: null, pending: null, sourceRefs, custom, hideRows: true,
})

export function getDetail(sel: Selection): DetailContent {
  switch (sel.kind) {
    case 'workstream': return workstreamDetail(sel.id as WorkstreamId)
    case 'task': return taskDetail(sel.id)
    case 'milestone': return milestoneDetail(sel.id as MilestoneId)
    case 'outcome': return outcomeDetail(sel.id)
    case 'flow': return flowDetail(sel.id)
    case 'path': return pathDetail(sel.id)
    case 'extra': return extraDetail(sel.id)
    case 'priority': return priorityDetail(sel.id)
    case 'candidate': return candidateDetail(sel.id)
    case 'depnode': return depNodeDetail(sel.id)
    case 'checkpoint': return checkpointDetail(sel.id)
    case 'decision': return decisionDetail(sel.id)
    case 'r1func': return {
      kindLabel: 'R1 · หารือ', title: 'ฟังก์ชันที่หารือว่าจะเพิ่มได้', badges: ['meeting', 'pending'],
      what: f(r1DiscussedFunctions.join(' · ')), why: f('รองรับงานแบบ Media Tech'),
      owner: f(wsById.R1.ownerLabel), timing: f('พิจารณาใน Scope ที่ M2'), prereq: null,
      deliverable: null, unlocks: null, pending: f('เป็นการหารือ ห้ามอ่านเป็น Org Chart ที่อนุมัติแล้ว'),
      sourceRefs: wsById.R1.sourceRefs, timeline: { workstream: 'R1' },
    }
    case 'weekly': return {
      kindLabel: 'ข้อเสนอการติดตาม', title: weeklyReview.title, badges: ['proposal', 'pending'],
      what: f(weeklyReview.agenda.join(' / ')), why: f('ให้เห็นงานค้างและสิ่งที่ต้องตัดสินใจทุกสัปดาห์'),
      owner: f('Mac เตรียม · เจ้าของฝ่ายรายงาน · คุณฉายตัดสินใจ'), timing: f('ยังไม่มีการนัดหมาย'),
      prereq: null, deliverable: null, unlocks: null, pending: f('รูปแบบและเวลา รอยืนยัน'),
      sourceRefs: [{ source: 'E01', note: 'ข้อเสนอการติดตาม' }],
      extra: { heading: 'ทีมสนับสนุน', items: [supportTeamNote] },
    }
    case 'p3': return priorityDetail('P3')
    case 'connected': return infoDetail('Connected Organization', connectedNodes.find((n) => n.id === sel.id)!)
    case 'nid': {
      const d = infoDetail('Nation ID', nationIdBoxes.find((n) => n.id === sel.id)!)
      return sel.id === 'interest' ? { ...d, custom: 'buckets' } : d
    }
    case 'iddomain': {
      const g = idDomains.find((x) => x.id === sel.id)!
      const wss = [...new Set(g.ids.map((i) => i.ws).filter(Boolean))] as WorkstreamId[]
      return {
        kindLabel: 'Nation ID · กลุ่ม', title: `${g.label} — ${g.th}`, badges: ['proposal', 'pending'],
        what: f(g.ids.map((i) => i.code).join(' · '), g.ids.map((i) => `${i.code}: ${i.th}${i.ws ? ` (${i.ws})` : ''}`)),
        why: f(g.points[0], g.points.slice(1)),
        owner: f(wss.map((w) => `${w}: ${wsById[w].ownerLabel}`).join(' · ')),
        timing: null, prereq: null, deliverable: null,
        unlocks: f('ใช้รหัสเดียวกันข้ามระบบ — CRM / DAM / LINE โยงกลับมาที่ Nation ID'), unlockLinks: wss.map(linkOf),
        pending: f('โครงสร้างรหัสเป็นข้อเสนอ — ยังไม่ใช่ระบบที่สร้างแล้ว'),
        sourceRefs: idFrameworkSources,
        extra: g.caution ? { heading: 'ข้อควรระวัง', items: g.caution, tone: 'caution' } : undefined,
      }
    }
    case 'phase1': return {
      kindLabel: 'Nation ID · Phase 1', title: 'Start with 6 IDs', badges: ['proposal', 'pending'],
      what: f(phase1Ids.map((p) => p.code).join(' → '), phase1Ids.map((p) => `${p.code}: ${p.q} (${p.ws})`)),
      why: f('แค่ Forum Pilot ก็เริ่มสร้าง Graph ได้ — ไม่ต้องรอเชื่อมทุกระบบ'),
      owner: f(`R5: ${wsById.R5.ownerLabel} · R6 (Organization): ${wsById.R6.ownerLabel}`),
      timing: f('ผูกกับ CP2 On-ground Register + Session test (วันรอยืนยัน) และ Gate M4'),
      prereq: f('Register เดิมของ Forum · สิทธิ/การแจ้งใช้ข้อมูลผ่านการตรวจ'), prereqLinks: [linkOf('M4')],
      deliverable: f('Graph ตัวอย่างจาก Forum 1 งาน: คน → องค์กร → เนื้อหา → หัวข้อ → Session → Activity'),
      unlocks: f('ต่อยอด Audience Intelligence (R5) และ Organization ID ให้ Sales/Government (R6)'), unlockLinks: [linkOf('R5'), linkOf('R6'), linkOf('R4')],
      pending: f('เป็นข้อเสนอ Mac — ไม่ใช่มติประชุม · งาน Forum ที่ใช้ทดลองยังรอยืนยัน'),
      sourceRefs: idFrameworkSources, timeline: { workstream: 'R5' },
    }
    case 'idrules': return tool('Nation ID', 'หลัก 3 ข้อ + 5 แนวคิด', 'principles', idFrameworkSources)
    case 'alias': return tool('Nation ID', 'Master vs Alias', 'alias', idFrameworkSources)
    case 'kgraph': return { ...tool('Connected Organization', 'AI เข้าใจบริบทได้อย่างไร', 'kgraph', idFrameworkSources), extra: { heading: 'Many systems, one truth', items: manySystems.map((m) => `${m.sys}: ${m.own} → โยงกลับ Nation ID`) } }
    case 'focus': return focusDetail(sel.id)
    case 'cp26': return cp26Detail(sel.id)
    case 'r6track': {
      const t = r6Tracks.find((x) => x.id === sel.id)!
      return {
        kindLabel: `R6 · ${t.order}`, code: t.id, title: t.title, badges: [t.basis, 'pending'],
        what: f(t.flow.join(' → ')), why: f(wsById.R6.why), owner: f(t.owner),
        timing: f(t.id === '6A' ? 'เป้า Mockup ปลาย ต.ค. แบบมีเงื่อนไข (CP4)' : 'ตามมาหลัง Government · วัน TBC'),
        prereq: null, deliverable: null, unlocks: null, unlockLinks: [linkOf('R6')],
        pending: f(t.notes[0], t.notes.slice(1)),
        sourceRefs: [{ source: 'D26', sections: '§6, §17', note: 'Government ก่อน แล้ว Sales เอกชน' }],
        timeline: { workstream: 'R6' },
      }
    }
    case 'r5lanes': return { ...tool('R5 · Nation ID', 'On-ground · Online · Legacy', 'r5', [{ source: 'D26', sections: '§3, §8, §25', note: 'Register เดิม · Sandbox ~1 เดือน' }], ['meeting26', 'pending']), timeline: { workstream: 'R5' } }
    case 'lineflow': return tool('Nation ID', 'Flow LINE → Web', 'lineflow', [{ source: 'WEB', note: 'เอกสาร LINE/GA4 ทางการ (W1–W8)' }, { source: 'IMG', note: 'ภาพ Flow ของทีม — อ้างอิง' }], ['proposal', 'pending'])
    case 'issues': return tool('Timeline', 'ตรวจวันที่', 'issues', [], ['pending'])
    case 'owners': return tool('Owners', 'ใครรับผิดชอบอะไร', 'owners', [{ source: 'D26', note: 'ชื่อผู้รับผิดชอบจากประชุม 26 ก.ย.' }], ['meeting26', 'pending'])
    case 'backup': return tool('Backup', 'Export / Import การแก้ไข', 'backup')
    case 'about': return {
      kindLabel: 'เกี่ยวกับหน้านี้', title: meta.title, badges: ['proposal'],
      what: f(`ผู้เสนอ ${meta.presenter} · ข้อมูล ณ ${fmtDate(meta.dataAsOf)} · ${meta.proposalStatus}`),
      why: f(meta.keyMessage), owner: f(`ผู้เสนอ: ${meta.presenter} · ผู้พิจารณา: ${meta.audience}`),
      timing: f(`Roadmap ที่เสนอ ${fmtRange(meta.timelineStart, meta.timelineEnd)}`),
      prereq: null, deliverable: null, unlocks: null,
      pending: f('เป็นภาพแผน ณ วันที่ข้อมูล ไม่ใช่ Live Tracker · ไม่มีความคืบหน้า/รายได้/Savings สมมติ'),
      sourceRefs: sources.map((s) => ({ source: s.id, note: s.usedFor })),
      extra: { heading: 'เรื่องที่ต้องยืนยัน (ประชุม 26 ก.ย.)', items: [...openQuestions26, ...pilotCandidates.map((c) => `ประวัติ: ${c.id} ${c.title}`)], tone: 'caution' },
    }
  }
}
