/**
 * NATION — Strategy to Execution
 * Single source of truth for every scene, the Gantt and the detail panel.
 *
 * Rules kept in this file (from the build prompt):
 * - Dates are ISO calendar dates (YYYY-MM-DD). Never duplicate them elsewhere.
 * - Unknown values stay `null` / "unconfirmed" — never 0, never "done".
 * - `predecessors` = strict finish-to-start for a Work Package.
 *   `checkpoints` = gates reviewed *inside* a bar (not a precondition).
 *   `relations`   = supporting links between Workstreams (not scheduling).
 * - This is the plan as of 23 Sep 2026, not a live tracker.
 */

export type Basis = 'meeting' | 'meeting26' | 'proposal' | 'pending'
export type DateBasis = 'meeting_date' | 'meeting_year_end' | 'proposed'
export type RelationType = 'hard_gate' | 'enables' | 'feeds'
export type SourceId = 'S23' | 'S17' | 'B4C' | 'BSales' | 'E01' | 'D26' | 'S26' | 'P26' | 'IMG' | 'WEB'
export type WorkstreamId = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7'
export type MilestoneId = 'M0' | 'M1' | 'M2' | 'M3' | 'M4' | 'M5' | 'M6' | 'M7'
export type PriorityId = 'P0' | 'P1' | 'P2' | 'P3'
export type CandidateId = 'C1' | 'C2' | 'C3' | 'C4'

export interface SourceRef {
  source: SourceId
  sections?: string
  /** Short summary of what the source supports — never a verbatim quote. */
  note: string
}

export interface Meta {
  title: string
  presenter: string
  audience: string
  dataAsOf: string
  version: string
  proposalStatus: string
  timelineStart: string
  timelineEnd: string
  keyMessage: string
  closing: string
}

export interface Workstream {
  id: WorkstreamId
  title: string
  shortTitle: string
  group: 'org' | 'business' | 'foundation'
  what: string
  why: string
  meetingDirection: string
  proposedOutcome: string
  acceptance: string
  ownerLabel: string
  ownerBasis: Basis
  /** Supporting people / coordinators (editable). Coordinators are not accountable owners. */
  support: string
  /** R1–R6 are the current focus; R7 is tracked separately. */
  focus: boolean
  unlocks: string
  pending: string[]
  candidateId: CandidateId | null
  sourceRefs: SourceRef[]
}

export interface Checkpoint {
  /** Milestone reviewed inside the bar, or a dated in-bar marker. */
  milestoneId?: MilestoneId
  date?: string
  label: string
  basis: Basis
}

export interface Task {
  id: string
  workstreamId: WorkstreamId
  title: string
  /** Short bar label (≤ ~14 chars) used when the bar is narrow. */
  short?: string
  /** True for tasks added later in the editor (not in the E01 seed). */
  custom?: boolean
  /** Person/role responsible for this Work Package (editor field; falls back to the workstream owner). */
  owner?: string
  /** Child scope added from the 26 Sep meeting (shown in details, not as extra bars). */
  scope?: string[]
  start: string
  end: string
  priority: PriorityId
  /** Strict finish-to-start: tasks and/or milestone gates. */
  predecessors: string[]
  checkpoints: Checkpoint[]
  /** Conditional work: AI pilot candidate or separate business approval. */
  conditionalOn: CandidateId | 'LOCAL_APPROVAL' | null
  deliverable: string
  acceptance: string
  note: string
  dateBasis: DateBasis
  actualStart: null
  actualEnd: null
  progressPercent: null
  sourceRefs: SourceRef[]
}

export interface Milestone {
  id: MilestoneId
  date: string
  label: string
  deliverables: string
  acceptance: string
  owner: string
  approver: string
  dateBasis: DateBasis
  dateBasisNote: string
  /** Work Packages whose output feeds this gate. */
  fedBy: string[]
  /** What must be seen to pass — separate from finish-to-start inputs. */
  acceptanceConditions: string[]
  actualStatus: 'unconfirmed'
  sourceRefs: SourceRef[]
}

export interface Relation {
  from: WorkstreamId
  to: WorkstreamId
  type: RelationType
  shortReason: string
  proposalBasis: Basis
  bidirectional?: boolean
}

export interface Priority {
  id: PriorityId
  label: string
  scope: string
  reason: string
  exitCondition: string
  items: string[]
}

export interface PilotCandidate {
  id: CandidateId
  title: string
  workstreamId: WorkstreamId
  taskId: string
  firstScope: string
  evidence: string
}

export interface Decision {
  id: string
  title: string
  question: string
  why: string
  conditions: string[]
  relatedMilestone: MilestoneId
  status: 'รอหารือ/อนุมัติ'
}

export interface Source {
  id: SourceId
  title: string
  file: string
  usedFor: string
  basis: Basis
}

// ---------------------------------------------------------------------------

export const meta: Meta = {
  title: 'NATION — Strategy to Execution',
  presenter: 'Mac',
  audience: 'คุณฉาย (CEO Nation)',
  dataAsOf: '2026-09-26',
  version: 'v0.1 (ร่าง)',
  proposalStatus: 'ร่างเพื่อหารือและอนุมัติ',
  timelineStart: '2026-09-24',
  timelineEnd: '2026-12-31',
  keyMessage: 'เปลี่ยนทิศทาง Media Tech ให้เป็นงานที่มีเจ้าของ ลำดับ และผลลัพธ์ชัดเจน',
  closing: 'Clear Direction → Clear Owner → Sequenced Execution → Measurable Result',
}

/** Unknown / not-yet-decided state. Kept null on purpose. */
export const planState = {
  selectedPilotIds: null as CandidateId[] | null,
  budget: null as null,
  actualBenefits: null as null,
}

export const sources: Source[] = [
  {
    id: 'S23',
    title: 'สรุปประชุมละเอียด 23 ก.ย. 2026',
    file: '09-23_การประชุม_การปฏิรูปองค์กร_กลยุทธ์_Media_Tech_แล.md',
    usedFor: 'ทิศทาง Media Tech, Workforce, Nation House, Sales/AE, 4C, Local, Data, Timeline, CMS',
    basis: 'meeting',
  },
  {
    id: 'S17',
    title: 'สรุปประชุมละเอียด 17 ก.ย. 2026',
    file: 'Business_Plan_Nation-Detailed_Summary.md',
    usedFor: '§8 Archive/ค้นหา/โมเดลรายได้คอนเทนต์ — บริบทก่อนหน้า ไม่ใช่มติทุกข้อ',
    basis: 'meeting',
  },
  {
    id: 'B4C',
    title: 'ภาพไวท์บอร์ด 4C',
    file: 'S__34660373_0.jpg',
    usedFor: 'Content + Creative → Community → Data → Conversion → Business (การจับคู่แบรนด์เป็นภาพเบื้องต้น)',
    basis: 'meeting',
  },
  {
    id: 'BSales',
    title: 'ภาพไวท์บอร์ด Sales',
    file: 'S__34660371_0.jpg',
    usedFor: 'Intelligent Agency, JD/KPI → AE, Workflow, Screening/QC, Revenue Mapping',
    basis: 'meeting',
  },
  {
    id: 'E01',
    title: 'ร่างเสนอ Mac — Nation Execution Plan v0.1 (23 ก.ย. 2026)',
    file: '04_Nation_Execution_Plan_v0.1.md',
    usedFor: '7 Workstreams, M0–M7, เลือก 2–3 Pilot จาก 4 Candidate, เกณฑ์เปิดใช้/วัดผล/ตรวจรับ',
    basis: 'proposal',
  },
  {
    id: 'D26',
    title: 'บันทึกประชุมฉบับละเอียด 26 ก.ย. 2026 (27 หัวข้อ)',
    file: '09-26_การประชุม_แผนรวมและโครงการหลักด้านระบบ(1).md',
    usedFor: 'Owner R1–R7, Focus R6 + R5, Sales Intelligence, Data Hub/Executive AI, Nation ID, Build vs Buy',
    basis: 'meeting26',
  },
  {
    id: 'S26',
    title: 'สรุปจัดหมวด 26 ก.ย. 2026',
    file: '09-26_การประชุม_แผนรวมและโครงการหลักด้านระบบ.md',
    usedFor: 'Action items/วันที่บางรายการ — บางจุดไม่ตรงกับ D26 จึงแสดงเป็น TBC',
    basis: 'meeting26',
  },
  {
    id: 'P26',
    title: 'ข้อเสนอ Mac หลังประชุม 26 ก.ย.',
    file: 'NATION_STRATEGY_UPGRADE_26SEP2026.md',
    usedFor: 'การจัดกลุ่ม 6+1, Connected Organization, Nation ID 4 กล่อง, Checkpoints ที่เสนอ — ไม่ใช่มติที่ประชุม',
    basis: 'proposal',
  },
  {
    id: 'IMG',
    title: 'ภาพ Flow LINE ของทีม',
    file: 'image.png',
    usedFor: 'Broadcast → Click → Website → Profile/UTM → GA4/DB → Report — คำอธิบายของทีม ไม่ใช่ผลทดสอบ',
    basis: 'meeting26',
  },
  {
    id: 'WEB',
    title: 'เอกสารทางการ LINE / Google Analytics (ตรวจ 26 ก.ย. 2026)',
    file: 'developers.line.biz · support.google.com/analytics',
    usedFor: 'ข้อควรระวังเทคนิค LIFF/Token/User-ID/PII — ต้องตรวจซ้ำก่อนพัฒนา Production',
    basis: 'proposal',
  },
]

export const workstreams: Workstream[] = [
  {
    id: 'R1',
    title: 'Workforce & Organization',
    shortTitle: 'Workforce',
    group: 'org',
    what: 'ปรับกำลังคน บทบาท JD/KPI และเส้นทางอาชีพ ให้ตรงกับงานแบบ Media Tech',
    why: 'องค์กรต้องส่งมอบงานได้ก่อน และการเปลี่ยนคนต้องไม่ทำให้ความรู้สำคัญหาย',
    meetingDirection: 'Workforce, Delayer, JD/KPI, Career Path, Relocate และเพิ่มฟังก์ชัน',
    proposedOutcome: 'โครงสร้าง/บทบาท/เกณฑ์ผลงานและแผนกำลังคนใน Scope; ความรู้และผู้รับช่วง',
    acceptance: 'เจ้าของงานรับรองวิธีทำงาน; ผู้รับช่วงทำงานได้; ผู้มีอำนาจอนุมัติการเปลี่ยนผ่าน',
    ownerLabel: 'พี่อู๊ด',
    ownerBasis: 'meeting26',
    support: 'HR · ออกแบบ Workflow ร่วม: คุณกิ๊บ · คุณอีจิ๊บ · คุณเส็ง',
    focus: true,
    unlocks: 'ออกแบบ Workflow ร่วมกับ R2 และเตรียมผู้ใช้/ผู้ดูแลสำหรับ Wave 1',
    pending: ['ผู้รับผิดชอบ HR รายชื่อ', 'Scope ฝ่าย/งานที่อยู่ใน Reform สิ้นปี', 'ฟังก์ชันใหม่ที่จะเพิ่ม (ยังเป็นการหารือ)'],
    candidateId: null,
    sourceRefs: [{ source: 'S23', sections: '§1–2, §15, §26', note: 'Efficiency/Workforce, ถ่ายความรู้, Timeline Reform' }],
  },
  {
    id: 'R2',
    title: 'Workflow & Paperless',
    shortTitle: 'Workflow',
    group: 'org',
    what: 'ปรับงาน Support, KPI และสายอนุมัติ โดยใช้ AI ช่วยในส่วนที่เลือกเป็น Pilot',
    why: 'ลดงานซ้ำและเวลาอนุมัติ — ต่อยอดงาน AI ตรวจเอกสารบัญชีที่มีอยู่แล้ว ไม่เริ่มจากศูนย์',
    meetingDirection: 'ปรับ Support, Nation House, KPI/Approval; มีงาน AI ตรวจเอกสารบัญชีเดิม',
    proposedOutcome: 'Workflow ที่เลือกพร้อมการอนุมัติ/ข้อยกเว้น; AI ช่วยในส่วนที่เลือกเป็น Pilot',
    acceptance: 'เวลา คุณภาพ การใช้งานจริง และผู้อนุมัติงานรับรอง',
    ownerLabel: 'Mac + พี่เส็ง / IT',
    ownerBasis: 'meeting26',
    support: 'พี่ตุ๊ก (OCR/ตรวจเอกสารบัญชี, Auto-approve เดิม)',
    focus: true,
    unlocks: 'Candidate C1 — AI Support และ Baseline เวลา/คุณภาพสำหรับวัดผล',
    pending: ['เจ้าของ Workflow ที่เลือก', 'ชื่อและขอบเขต Nation House (Internal System) ยังต้องยืนยัน'],
    candidateId: 'C1',
    sourceRefs: [{ source: 'S23', sections: '§3, §15, §27, §33', note: 'Nation House, ถ่ายความรู้, AI ตรวจเอกสารบัญชีเดิม' }],
  },
  {
    id: 'R3',
    title: 'Data Foundation & Executive AI',
    shortTitle: 'Data & Exec AI',
    group: 'foundation',
    what: 'กำหนดขอบเขต IT/BI ผู้ดูแล/ผู้สำรอง สิทธิข้อมูล และข้อมูลขั้นต่ำที่ Wave 1 ต้องใช้',
    why: 'ลดการพึ่งบุคคลเดียว และให้ทุก Pilot ใช้ข้อมูลที่มีสิทธิและคุณภาพพอ',
    meetingDirection: 'Reform Tech, ลดการพึ่งบุคคลเดียว, เชื่อมระบบ/ข้อมูล',
    proposedOutcome: 'ขอบเขต IT/BI ผู้ดูแล/สำรอง สิทธิข้อมูล แบบเชื่อม และข้อมูลขั้นต่ำของ Wave 1',
    acceptance: 'ผู้ดูแลชัด; สิทธิและคุณภาพข้อมูลผ่านเกณฑ์; ส่งมอบการดูแลได้',
    ownerLabel: 'Mac + พี่เส็ง',
    ownerBasis: 'meeting26',
    support: 'ทีม IT (รวมแอปแต่ละฝ่ายเข้าถังกลาง)',
    focus: true,
    unlocks: 'ข้อมูล/การเชื่อมเฉพาะส่วนที่ R2, R4, R5, R6 ต้องใช้ — ไม่ต้องรอ R3 เสร็จทั้งก้อน',
    pending: ['ขอบเขตอำนาจและวันรับโอน IT/BI', 'Nation House กับ Nation ID ไม่ใช่ฐานข้อมูลเดียวกันที่ทุกฝ่ายเข้าถึงได้ — ขอบเขตรอยืนยัน'],
    candidateId: null,
    sourceRefs: [{ source: 'S23', sections: '§3, §13, §26, §31–32', note: 'Nation House, Data, IT–BI, สมาชิกเดิม, บทบาท Mac' }],
  },
  {
    id: 'R4',
    title: 'Content Archive + AI',
    shortTitle: 'Content',
    group: 'business',
    what: 'ทำคลังเดิมให้ค้นหา/ใช้ซ้ำได้ และทดลอง AI Draft ที่มีคนตรวจก่อนเข้า CMS',
    why: 'คลังคอนเทนต์เป็นสินทรัพย์ที่ใช้ซ้ำได้ ถ้ามีสิทธิ มีแหล่งที่มา และคนตรวจ',
    meetingDirection: 'Archive, ใช้คลังเดิม, AI Draft ที่คนตรวจ และพัฒนา CMS ควบคู่',
    proposedOutcome: 'Inventory/สิทธิ/มาตรฐาน; คลังทดลองที่เลือก; แบบงาน AI Draft/CMS',
    acceptance: 'ค้นหาตามโจทย์ อ้างแหล่งได้ และ Editorial ตรวจคุณภาพ',
    ownerLabel: 'Mac (ดูหลัก)',
    ownerBasis: 'meeting26',
    support: 'Delivery team: TBC — ประเมิน Outsource',
    focus: true,
    unlocks: 'Candidate C3 และคอนเทนต์ที่ใช้สนับสนุน Community (R5)',
    pending: ['Editorial owner', 'ชุดคลังทดลองที่มีสิทธิใช้'],
    candidateId: 'C3',
    sourceRefs: [
      { source: 'S23', sections: '§29', note: 'CMS และ AI Draft ที่คนตรวจ' },
      { source: 'S17', sections: '§8', note: 'Archive/ค้นหา/โมเดลรายได้คอนเทนต์ — บริบทก่อนหน้า' },
    ],
  },
  {
    id: 'R5',
    title: 'Nation ID & Audience Intelligence',
    shortTitle: 'Nation ID',
    group: 'business',
    what: 'ออกแบบ Community และกิจกรรมที่วัด Conversion ได้ พร้อมสิทธิการใช้ข้อมูล',
    why: 'เปลี่ยนผู้ติดตามให้เป็นความสัมพันธ์ที่วัดผลได้ ไม่หยุดที่ยอดผู้ติดตาม',
    meetingDirection: 'Community → Data → Conversion → Commercial; เชื่อมฐานผู้ชม/สมาชิก',
    proposedOutcome: 'แผน Community, กิจกรรมที่เลือก, นิยาม Conversion และการใช้ข้อมูล',
    acceptance: 'การลงทะเบียน/ร่วมกิจกรรม/ติดตามผลที่นิยามชัด; แยกทดสอบจากผลจริง',
    ownerLabel: 'Mac + พี่เส็ง + MD',
    ownerBasis: 'meeting26',
    support: 'ผู้ประสาน Register/UX: แจ๊ค · โบ · โม',
    focus: true,
    unlocks: 'Candidate C4 และข้อมูลกิจกรรมสำหรับออกแบบรายได้ (ต้องพิสูจน์)',
    pending: [
      'Community เป็นฟังก์ชันส่วนกลางหรือ BU',
      'แบรนด์/กิจกรรมนำร่อง — ยังไม่เลือก',
      'เป้า 500–1,000 คนเป็นสิ่งที่หารือ ไม่ใช่ยอดจริง ต้องยืนยัน Event/นิยาม/งบ',
    ],
    candidateId: 'C4',
    sourceRefs: [
      { source: 'S23', sections: '§8, §13, §31', note: '4C, Data, สมาชิกเดิม' },
      { source: 'B4C', note: 'ลำดับ Content + Creative → Community → Data → Conversion → Business' },
    ],
  },
  {
    id: 'R6',
    title: 'Commercial Intelligence',
    shortTitle: 'Commercial Intel',
    group: 'business',
    what: 'ให้ Sales ทำงานแบบ AE โดยมี Intelligence ช่วยคัดกรองงาน Government',
    why: 'ทุกโอกาสขายต้องมีที่มา ความเหมาะสม และคนติดตาม ไม่ใช่แค่รายชื่อโครงการ',
    meetingDirection: 'Sales เป็น AE มี Intelligence ช่วย; Screening/QC และ Revenue Mapping',
    proposedOutcome: 'รายการงานตรวจสอบแล้ว AE Owner และกระบวนการติดตาม',
    acceptance: 'แต่ละโอกาสมีที่มา ความเหมาะสม ผู้รับผิดชอบ และสถานะจริง',
    ownerLabel: 'Sponsor: คุณฉาย (Shine) · 6A ทีม Government (TBC) · 6B ฝ่ายขาย (TBC)',
    ownerBasis: 'meeting26',
    support: 'Mac วาง Flow · ทีม Data (พี่เส็ง) สนับสนุน',
    focus: true,
    unlocks: 'Candidate C2 — Pipeline ที่มีเจ้าของ (Pipeline ≠ รายได้)',
    pending: ['ผู้พัฒนา Agent', 'ตัวเลขรายได้ Government ยังไม่ใช้เป็น KPI ผูกพัน'],
    candidateId: 'C2',
    sourceRefs: [
      { source: 'S23', sections: '§4, §7', note: 'Sales/AE/Intelligence; บริษัทใหม่ยังมีรายละเอียดรอสรุป' },
      { source: 'BSales', note: 'Intelligent Agency, JD/KPI → AE, Screening/QC, Revenue Mapping' },
    ],
  },
  {
    id: 'R7',
    title: 'Local Network',
    shortTitle: 'Local',
    group: 'business',
    what: 'เตรียม Business case เครือข่ายข่าวจังหวัด เริ่มทดลองปัตตานี–ยะลา–นราธิวาส หากอนุมัติ',
    why: 'พิสูจน์ต้นทุน สิทธิในเพจ และ QC ในพื้นที่เล็กก่อนคิดขยาย',
    meetingDirection: 'เครือข่ายข่าวจังหวัด; ทดลองปัตตานี–ยะลา–นราธิวาสก่อนขยาย',
    proposedOutcome: 'Business case, ต้นทุนครบ, สิทธิในเพจ, บทบาท/QC และข้อเสนอ Pilot',
    acceptance: 'ยืนยันต้นทุนรวม/ทีม/สิทธิ/QC ก่อนเริ่ม; ประเมินรายได้จริงก่อนขยาย',
    ownerLabel: 'คุณฉาย (Shine) + ทีมพี่กอล์ฟ',
    ownerBasis: 'meeting26',
    support: 'แยกติดตาม — ไม่อยู่ใน AI scope รอบนี้',
    focus: false,
    unlocks: 'ข้อมูลต้นทุน/รายได้จริงสำหรับตัดสินใจขยาย (ระยะ P3)',
    pending: ['ผู้มีอำนาจอนุมัติธุรกิจ/งบ', 'วันเริ่ม Pilot จริง', 'สิทธิในเพจ'],
    candidateId: null,
    sourceRefs: [{ source: 'S23', sections: '§10–12, §16–17', note: 'Local model, Southern pilot, สิทธิในเพจ' }],
  },
]

/** Functions discussed for R1 — discussion only, NOT an approved org chart. */
export const r1DiscussedFunctions = ['Asset Management', 'Intelligence', 'Community', 'CRM/Data', 'International', 'BD']

export const supportTeamNote = 'ทีมสนับสนุนที่บันทึกระบุ: คุณอี คุณกิ๊ฟ คุณเส็ง คุณมาร์ค และ IT — ยังไม่กำหนดงานรายบุคคล'

export const milestones: Milestone[] = [
  {
    id: 'M0', date: '2026-09-30', label: 'Draft',
    deliverables: 'กรอบงาน เจ้าของ ร่าง Roadmap และคำถามขออนุมัติ',
    acceptance: 'การส่งไม่เท่ากับการอนุมัติ',
    owner: 'Mac', approver: 'คุณฉาย',
    dateBasis: 'proposed', dateBasisNote: 'เสนอ — แปลงจาก "ประมาณ 1 สัปดาห์" ในประชุม',
    fedBy: [], actualStatus: 'unconfirmed',
    acceptanceConditions: ['ร่าง Roadmap + คำถามขออนุมัติส่งถึงคุณฉาย'],
    sourceRefs: [{ source: 'S23', sections: '§32', note: 'ให้ Mac ตกผลึกแผนประมาณหนึ่งสัปดาห์' }, { source: 'E01', note: 'M0 ในร่าง v0.1' }],
  },
  {
    id: 'M1', date: '2026-10-01', label: 'System Review',
    deliverables: 'ทบทวนสิ่งที่มี ใช้ต่อได้ ข้อจำกัดและช่องว่าง; ยืนยัน Agenda กับทีม',
    acceptance: 'เห็นภาพระบบที่มีอยู่จริงและช่องว่างก่อนล็อก Scope',
    owner: 'Mac + IT/BI + ทีมนำเสนอ', approver: 'คุณฉาย',
    dateBasis: 'meeting_date', dateBasisNote: 'วันที่ในบันทึกประชุม — ไม่ใช่การยืนยัน Calendar',
    fedBy: [], actualStatus: 'unconfirmed',
    acceptanceConditions: ['ทบทวนระบบที่มีและช่องว่าง', 'หมายเหตุ: นำเสนอแผนเบื้องต้นแล้วเมื่อ 26 ก.ย. (D26)'],
    sourceRefs: [{ source: 'S23', sections: '§14', note: 'มีการนำเสนอวันที่ 1 ต.ค.' }],
  },
  {
    id: 'M2', date: '2026-10-09', label: 'Scope Lock',
    deliverables: 'ยืนยัน Scope Reform, Owner, อำนาจ, งบ, ทีม, Baseline และเลือก 2–3 Pilot',
    acceptance: 'มีรายชื่อเจ้าของ ทรัพยากร และรายการ Pilot ที่เลือกเป็นลายลักษณ์อักษร',
    owner: 'Mac + HR + Finance + เจ้าของงาน', approver: 'คุณฉาย',
    dateBasis: 'proposed', dateBasisNote: 'เสนอ',
    fedBy: ['T01', 'T04', 'T07', 'T10', 'T13', 'T16', 'T19'], actualStatus: 'unconfirmed',
    acceptanceConditions: ['Scope · Owner · ทีมที่มีเวลาจริง · Baseline', 'ยืนยันลำดับ R6 + R5 เริ่มก่อน (D26) — ไม่ใช่การอนุมัติทุก Feature/งบ'],
    sourceRefs: [{ source: 'E01', note: 'M2 และการเลือก 2–3 Pilot จาก 4 Candidate' }],
  },
  {
    id: 'M3', date: '2026-10-23', label: 'Design Sign-off',
    deliverables: 'Workflow เป้าหมาย บทบาท/JD/KPI แผนความรู้ สิทธิข้อมูล และแบบระบบเฉพาะที่เลือก',
    acceptance: 'เจ้าของงานรับรองแบบงานของตน',
    owner: 'HR + เจ้าของงาน + Mac/IT/BI', approver: 'คุณฉายและเจ้าของงาน',
    dateBasis: 'proposed', dateBasisNote: 'เสนอ',
    fedBy: ['T02', 'T05', 'T08', 'T11', 'T14', 'T17', 'T20'], actualStatus: 'unconfirmed',
    acceptanceConditions: ['แบบงานที่เจ้าของงานรับรอง', 'สิทธิข้อมูลและแบบระบบเฉพาะส่วนที่ใช้'],
    sourceRefs: [{ source: 'E01', note: 'M3 ในร่าง v0.1' }],
  },
  {
    id: 'M4', date: '2026-11-13', label: 'Test Pass',
    deliverables: 'เจ้าของ Pilot ที่เลือกตรวจรับการทดสอบ คุณภาพ และรายการแก้ไข',
    acceptance: 'ผ่านทดสอบ ≠ เปิดใช้แล้ว; ประเมินเฉพาะ Pilot ที่ได้รับเลือก',
    owner: 'เจ้าของ Pilot + IT/BI', approver: 'เจ้าของงาน',
    dateBasis: 'proposed', dateBasisNote: 'เสนอ',
    fedBy: [], actualStatus: 'unconfirmed',
    acceptanceConditions: ['หลักฐานความพร้อมของ Pilot ที่ได้รับเลือก', 'ผลทดสอบ + รายการแก้ไขที่เจ้าของ Pilot ตรวจรับ', 'เงื่อนไขตรวจรับรายงานรอยืนยัน'],
    sourceRefs: [{ source: 'E01', note: 'เกณฑ์เปิดใช้/วัดผล' }],
  },
  {
    id: 'M5', date: '2026-12-04', label: 'Wave 1 Go-live',
    deliverables: 'ผ่านทดสอบ สิทธิข้อมูล ความพร้อมผู้ใช้/ผู้ดูแล และแผนสำรอง',
    acceptance: 'เปลี่ยนคนเฉพาะที่มีการอนุมัติและรับช่วงพร้อม',
    owner: 'เจ้าของงาน + HR + IT/BI', approver: 'ผู้มีอำนาจตามเรื่อง',
    dateBasis: 'proposed', dateBasisNote: 'เสนอ',
    fedBy: [], actualStatus: 'unconfirmed',
    acceptanceConditions: ['ผลทดสอบผ่านเกณฑ์ของงานนั้น', 'สิทธิข้อมูลผ่านการตรวจ', 'มีผู้ใช้ ผู้ดูแล และแผนสำรอง', 'เปลี่ยนคนเฉพาะที่อนุมัติและรับช่วงพร้อม'],
    sourceRefs: [{ source: 'E01', note: 'เกณฑ์เปิดใช้' }],
  },
  {
    id: 'M6', date: '2026-12-18', label: 'Result Review',
    deliverables: 'ผลก่อน–หลังและการใช้จริง; Finance ตรวจผลต้นทุน; งานค้างมีเจ้าของ/วันแก้',
    acceptance: 'ผลวัดจาก Baseline ที่ล็อกไว้ที่ M2 ไม่ใช่ตัวเลขประมาณการ',
    owner: 'Mac + Finance + HR + เจ้าของงาน', approver: 'คุณฉาย',
    dateBasis: 'proposed', dateBasisNote: 'เสนอ',
    fedBy: [], actualStatus: 'unconfirmed',
    acceptanceConditions: ['ผลใช้งานก่อน–หลังตามตัววัดของแต่ละงาน', 'Finance ตรวจผลต้นทุน — ไม่สมมติว่าทุก Pilot สร้าง Savings', 'งานค้างมีเจ้าของ/วันแก้'],
    sourceRefs: [{ source: 'E01', note: 'เกณฑ์วัดผล' }],
  },
  {
    id: 'M7', date: '2026-12-31', label: 'Reform Acceptance',
    deliverables: 'ตรวจรับ Scope สิ้นปี ส่งมอบงานประจำ และแผน 2027',
    acceptance: 'งานไม่จบแสดงเป็นข้อยกเว้น — การย้ายไปปีหน้าไม่เท่ากับปิดงาน',
    owner: 'Mac + HR + เจ้าของงาน', approver: 'คุณฉาย',
    dateBasis: 'meeting_year_end', dateBasisNote: 'กรอบสิ้นปีจากประชุม; นิยามการตรวจรับเป็นข้อเสนอ',
    fedBy: ['T03', 'T09'], actualStatus: 'unconfirmed',
    acceptanceConditions: ['หลักฐานตาม Scope สิ้นปี', 'งานข้ามปีต้องเป็นข้อยกเว้นที่อนุมัติหรือแผนขยาย — ไม่ใช่การปิดงาน'],
    sourceRefs: [{ source: 'S23', sections: '§26', note: 'กรอบ Reform สิ้นปี' }, { source: 'E01', note: 'นิยามตรวจรับ' }],
  },
]

const E01: SourceRef = { source: 'E01', note: 'Work Package และช่วงวันเป็นข้อเสนอจัดลำดับงาน' }
const pilotCheckpoints: Checkpoint[] = [
  { milestoneId: 'M4', label: 'ทดสอบ', basis: 'proposal' },
  { milestoneId: 'M5', label: 'Go-live', basis: 'proposal' },
  { milestoneId: 'M6', label: 'Measure', basis: 'proposal' },
]
const task = (t: Omit<Task, 'actualStart' | 'actualEnd' | 'progressPercent' | 'dateBasis' | 'sourceRefs'> & { sourceRefs?: SourceRef[] }): Task => ({
  dateBasis: 'proposed',
  actualStart: null,
  actualEnd: null,
  progressPercent: null,
  ...t,
  sourceRefs: [E01, ...(t.sourceRefs ?? [])],
})

export const tasks: Task[] = [
  // R1
  task({ id: 'T01', workstreamId: 'R1', title: 'Baseline Survey', start: '2026-09-24', end: '2026-10-09', priority: 'P0', predecessors: [], checkpoints: [], conditionalOn: null,
    deliverable: 'Baseline งาน–คน–ความรู้สำคัญ ความเสี่ยง และ Scope ที่เสนอ', acceptance: 'ข้อมูลพอให้ M2 ยืนยัน Scope และทรัพยากร', note: 'สำรวจ Baseline/ความเสี่ยง/Scope เพื่อ M2' }),
  task({ id: 'T02', workstreamId: 'R1', title: 'Roles / JD / KPI', start: '2026-10-12', end: '2026-10-23', priority: 'P1', predecessors: ['T01', 'M2'], checkpoints: [{ milestoneId: 'M3', label: 'Design Sign-off', basis: 'proposal' }], conditionalOn: null,
    deliverable: 'บทบาท/JD/KPI, Career Path และ Knowledge plan', acceptance: 'รับรอง Workflow/Career Path/Knowledge plan ที่ M3', note: 'ออกแบบคู่กับ Workflow ของ R2' }),
  task({ id: 'T03', workstreamId: 'R1', title: 'Knowledge Transfer → Transition', start: '2026-10-26', end: '2026-12-31', priority: 'P1', predecessors: ['T02', 'M3'],
    checkpoints: [{ milestoneId: 'M5', label: 'เปลี่ยนผ่านเฉพาะที่อนุมัติ', basis: 'proposal' }, { milestoneId: 'M6', label: 'ตรวจช่องว่าง', basis: 'proposal' }, { milestoneId: 'M7', label: 'ตรวจรับ', basis: 'proposal' }], conditionalOn: null,
    deliverable: 'ความรู้/คู่มือ/สิทธิถูกส่งต่อ ผู้รับช่วงฝึกและทดสอบแล้ว', acceptance: 'ผู้รับช่วงทำงานได้ และผู้มีอำนาจอนุมัติการเปลี่ยนผ่าน',
    note: 'ถ่ายความรู้และฝึกก่อน; เปลี่ยนผ่านเมื่อพร้อมและอนุมัติ — ไม่ได้แปลว่าการลดคนเริ่ม 26 ต.ค.' }),
  // R2
  task({ id: 'T04', workstreamId: 'R2', title: 'Support + Existing AI Review', start: '2026-09-24', end: '2026-10-09', priority: 'P0', predecessors: [], checkpoints: [], conditionalOn: null,
    deliverable: 'แผนที่งาน Support และสภาพงาน AI ตรวจเอกสารบัญชีเดิม', acceptance: 'เห็นสิ่งที่ใช้ต่อได้ก่อนเลือก Pilot', note: 'ตรวจงานตรวจเอกสารบัญชีเดิม ไม่ถือว่าเริ่มจากศูนย์' }),
  task({ id: 'T05', workstreamId: 'R2', title: 'Workflow Design', start: '2026-10-12', end: '2026-10-23', priority: 'P1', predecessors: ['T04', 'M2'], checkpoints: [{ milestoneId: 'M3', label: 'Design Sign-off', basis: 'proposal' }], conditionalOn: null,
    deliverable: 'วิธีทำงาน ข้อยกเว้น และเกณฑ์คุณภาพ', acceptance: 'เจ้าของ Workflow รับรองที่ M3', note: 'วิธีทำงาน/ข้อยกเว้น/เกณฑ์คุณภาพเพื่อ M3' }),
  task({ id: 'T06', workstreamId: 'R2', title: 'AI Support Wave 1', start: '2026-10-26', end: '2026-12-18', priority: 'P2', predecessors: ['T05', 'M3'], checkpoints: pilotCheckpoints, conditionalOn: 'C1',
    deliverable: 'Workflow ที่เลือกใช้ AI ช่วย พร้อมผู้อนุมัติและวิธีทำงานสำรอง', acceptance: 'เวลา/ข้อผิดพลาด/ข้อยกเว้น ตรวจโดยผู้อนุมัติงาน', note: 'Build → Test → Prepare → Live → Measure; ทำเมื่อ C1 ได้รับเลือกที่ M2' }),
  // R3
  task({ id: 'T07', workstreamId: 'R3', title: 'Systems / Access / Backup', start: '2026-09-24', end: '2026-10-09', priority: 'P0', predecessors: [], checkpoints: [], conditionalOn: null,
    deliverable: 'Inventory ระบบ, Access, คนดูแล/สำรอง และสภาพระบบจริง', acceptance: 'ข้อมูลพอให้ M1/M2 ตัดสินใจ', note: 'Inventory, Access, คนดูแล/สำรอง, สภาพระบบจริง' }),
  task({ id: 'T08', workstreamId: 'R3', title: 'System & Data Design', start: '2026-10-12', end: '2026-10-23', priority: 'P1', predecessors: ['T07', 'M2'], checkpoints: [{ milestoneId: 'M3', label: 'Design Sign-off', basis: 'proposal' }], conditionalOn: null,
    deliverable: 'แบบเชื่อมและข้อมูลขั้นต่ำเฉพาะ Scope ที่เลือก', acceptance: 'รับรองที่ M3 — ไม่ออกแบบทุกระบบใหม่', note: 'รองรับเฉพาะ Scope ที่เลือก ไม่ออกแบบทุกระบบใหม่' }),
  task({ id: 'T09', scope: ['Data Hub บน Private Cloud (ทยอยเชื่อม)', 'รหัสลูกค้าองค์กรกลาง (Organization ID)', 'สิทธิข้อมูลตามบทบาท', 'Executive AI แบบ Read-only — เป้าเชื่อมบางส่วนปลาย พ.ย.–ธ.ค. (D26 §18)'], workstreamId: 'R3', title: 'Wave 1 Integration / Handover', start: '2026-10-26', end: '2026-12-31', priority: 'P1', predecessors: ['T08', 'M3'],
    checkpoints: [
      { date: '2026-11-06', label: 'Minimum Data', basis: 'proposal' },
      { milestoneId: 'M4', label: 'ทดสอบ', basis: 'proposal' },
      { milestoneId: 'M5', label: 'ใช้จริง', basis: 'proposal' },
      { milestoneId: 'M7', label: 'ส่งมอบการดูแล', basis: 'proposal' },
    ], conditionalOn: null,
    deliverable: 'ข้อมูลขั้นต่ำและการเชื่อมที่ Pilot ที่เลือกต้องใช้ พร้อมส่งมอบการดูแล', acceptance: 'สิทธิ/คุณภาพข้อมูลผ่านเกณฑ์; ผู้ดูแลรับช่วงได้',
    note: 'ส่งข้อมูลขั้นต่ำระหว่างทาง — Pilot ไม่ต้องรอถึง 31 ธ.ค.' }),
  // R4
  task({ id: 'T10', workstreamId: 'R4', title: 'Archive / Rights / Use Cases', start: '2026-09-24', end: '2026-10-09', priority: 'P0', predecessors: [], checkpoints: [], conditionalOn: null,
    deliverable: 'Inventory คลัง, ชุดทดลองที่เป็นไปได้ และ Editorial owner', acceptance: 'มีชุดที่สิทธิชัดพอให้เลือกที่ M2', note: 'หา Inventory/ชุดทดลองและ Editorial owner' }),
  task({ id: 'T11', scope: ['Tag ข่าวใหม่/ชุดทดลอง (Entity/Category) → ส่งต่อ R5 จัดกลุ่ม Interest', 'ประเมิน Outsource / จัดทีม (D26 §2)'], workstreamId: 'R4', title: 'Pilot Set / CMS Design', start: '2026-10-12', end: '2026-10-23', priority: 'P1', predecessors: ['T10', 'M2'], checkpoints: [{ milestoneId: 'M3', label: 'Design Sign-off', basis: 'proposal' }], conditionalOn: null,
    deliverable: 'Scope Archive/การช่วยร่างที่เลือก และคนตรวจ', acceptance: 'Editorial รับรองที่ M3', note: 'Scope Archive/การช่วยร่างที่เลือก และคนตรวจ' }),
  task({ id: 'T12', workstreamId: 'R4', title: 'Content Wave 1', start: '2026-10-26', end: '2026-12-18', priority: 'P2', predecessors: ['T11', 'M3'], checkpoints: pilotCheckpoints, conditionalOn: 'C3',
    deliverable: 'คลังตัวอย่างที่ค้นหา/ใช้ซ้ำได้ และ/หรือ AI Draft → คนตรวจ → CMS', acceptance: 'ค้นหาได้ มีแหล่งที่มา คนตรวจ และใช้กับ Workflow ได้', note: 'Build → Test → Prepare → Live → Measure; ทำเมื่อ C3 ได้รับเลือกที่ M2' }),
  // R5
  task({ id: 'T13', workstreamId: 'R5', title: 'Community / Existing Base', start: '2026-09-24', end: '2026-10-09', priority: 'P0', predecessors: [], checkpoints: [], conditionalOn: null,
    deliverable: 'Owner, สมาชิกเดิม และกิจกรรมที่เป็นไปได้', acceptance: 'มีตัวเลือกพอให้ M2 ตัดสินใจ — ไม่กำหนดแบรนด์นำร่องเอง', note: 'Owner/สมาชิกเดิม/กิจกรรมที่เป็นไปได้; ไม่กำหนดแบรนด์นำร่องเอง' }),
  task({ id: 'T14', scope: ['เลน On-ground: Register เดิม → Check-in → Session', 'เลน Online: ทดลอง LINE/Web Login ใน Sandbox พนักงาน ~1 เดือน', 'เลน Legacy: Clean ฐาน Event/สมาชิก/Print เดิม'], workstreamId: 'R5', title: 'Event / Conversion Design', start: '2026-10-12', end: '2026-10-23', priority: 'P1', predecessors: ['T13', 'M2'], checkpoints: [{ milestoneId: 'M3', label: 'Design Sign-off', basis: 'proposal' }], conditionalOn: null,
    deliverable: 'แผนคุณค่าสมาชิก นิยามตัววัด และสิทธิข้อมูล', acceptance: 'เจ้าของแบรนด์รับรองนิยาม Conversion ที่ M3', note: 'แผนคุณค่าสมาชิก นิยามตัววัดและสิทธิข้อมูล' }),
  task({ id: 'T15', scope: ['On-ground: Session Activity + Follow-up', 'Online: UX Review + MD sign-off ก่อน Production', 'Legacy: Map เข้า ID กลางหลังตรวจสิทธิ/คุณภาพ'], workstreamId: 'R5', title: 'Audience Wave 1', start: '2026-10-26', end: '2026-12-18', priority: 'P2', predecessors: ['T14', 'M3'], checkpoints: pilotCheckpoints, conditionalOn: 'C4',
    deliverable: 'หนึ่งกิจกรรมหรือแบรนด์: ลงทะเบียน → เข้าร่วม → ติดตาม', acceptance: 'Conversion ตามนิยามที่รับรอง; ถ้าไม่มี Event จริงรายงานเป็น Sandbox', note: 'ยังไม่มี Event date; ทำเมื่อ C4 ได้รับเลือกที่ M2' }),
  // R6
  task({ id: 'T16', workstreamId: 'R6', title: 'Gov Lead Screening', start: '2026-09-24', end: '2026-10-09', priority: 'P0', predecessors: [], checkpoints: [], conditionalOn: null,
    deliverable: 'แหล่งงาน/งบ/ความเหมาะสมที่ตรวจสอบได้', acceptance: 'แต่ละรายการมีที่มาตรวจสอบได้', note: 'แหล่งงาน/งบ/ความเหมาะสมที่ตรวจสอบได้' }),
  task({ id: 'T17', scope: ['6A Government Agent: Source ที่ตรวจสอบได้ → Alert → Screening → AE → Draft Proposal → คนตรวจ', 'Flow 1–4 และ Source ยังต้องคุยกับทีม Government (D26 §4)'], workstreamId: 'R6', title: 'AE / Screening / QC', start: '2026-10-12', end: '2026-10-23', priority: 'P1', predecessors: ['T16', 'M2'], checkpoints: [{ milestoneId: 'M3', label: 'Design Sign-off', basis: 'proposal' }], conditionalOn: null,
    deliverable: 'AE Owner, Workflow การติดตาม และผู้ดูแล Intelligence', acceptance: 'ทีม Government รับรองที่ M3', note: 'AE Owner/Workflow/การติดตาม และผู้ดูแล Intelligence' }),
  task({ id: 'T18', scope: ['6A Government ก่อน (Mockup/Flow เป้าปลาย ต.ค. แบบมีเงื่อนไข)', '6B Sales Intelligence ตามมา: Organization ID + ประวัติงาน + Rate Card Pool → โอกาส/แพ็กเกจ → เจ้าของบัญชีติดตาม'], workstreamId: 'R6', title: 'Government Wave 1', start: '2026-10-26', end: '2026-12-18', priority: 'P2', predecessors: ['T17', 'M3'], checkpoints: pilotCheckpoints, conditionalOn: 'C2',
    deliverable: 'งานที่ตรวจสอบได้ → Screening → มอบหมาย AE → ติดตาม', acceptance: 'โอกาสที่ผ่าน QC และมีการติดตามจริง — Pipeline ไม่ใช่รายได้', note: 'ไม่ต้องรอ Nation ID / Audience ID; ทำเมื่อ C2 ได้รับเลือกที่ M2' }),
  // R7
  task({ id: 'T19', workstreamId: 'R7', title: 'Cost / Revenue / Page Rights', start: '2026-09-24', end: '2026-10-09', priority: 'P0', predecessors: [], checkpoints: [], conditionalOn: null,
    deliverable: 'ต้นทุนครบ (รวมค่าเซลส์) สิทธิในเพจ และบทบาท', acceptance: 'ไม่มีต้นทุนที่ตกหล่นก่อนทำ Business case', note: 'เก็บต้นทุนครบ รวมค่าเซลส์ สิทธิและบทบาท' }),
  task({ id: 'T20', workstreamId: 'R7', title: 'QC / Team / Approval', start: '2026-10-12', end: '2026-10-23', priority: 'P1', predecessors: ['T19', 'M2'], checkpoints: [], conditionalOn: null,
    deliverable: 'Business case และเงื่อนไขเริ่ม Pilot', acceptance: 'เจ้าของธุรกิจเสนอขออนุมัติพร้อมต้นทุน/ทีม/สิทธิ/QC', note: 'Business case และเงื่อนไขเริ่ม Pilot โดยเจ้าของธุรกิจ' }),
  task({ id: 'T21', workstreamId: 'R7', title: 'Local Pilot (if approved)', start: '2026-10-26', end: '2026-12-18', priority: 'P2', predecessors: ['T20'], checkpoints: [], conditionalOn: 'LOCAL_APPROVAL',
    deliverable: 'Pilot ปัตตานี–ยะลา–นราธิวาส และผลประเมินต้นทุน/รายได้จริง', acceptance: 'ประเมินรายได้จริงก่อนตัดสินใจขยาย', note: 'อนุมัติธุรกิจแยก; วันเริ่มจริงรอยืนยัน; ไม่ขึ้นกับ M4/M5 ของ AI' }),
]

const SHORT: Record<string, string> = {
  T01: 'Baseline', T02: 'Roles/KPI', T03: 'Transfer → Transition', T04: 'Review', T05: 'Design', T06: 'AI Support W1',
  T07: 'Systems', T08: 'Design', T09: 'Integrate → Handover', T10: 'Archive', T11: 'CMS Design', T12: 'Content W1',
  T13: 'Community', T14: 'Event Design', T15: 'Audience W1', T16: 'Screening', T17: 'AE / QC', T18: 'Gov W1',
  T19: 'Cost / Rights', T20: 'Approval', T21: 'Local Pilot',
}
for (const t of tasks) t.short = SHORT[t.id]

export const relations: Relation[] = [
  { from: 'R1', to: 'R2', type: 'enables', bidirectional: true, shortReason: 'ออกแบบคนกับงานร่วมกัน — สนับสนุน ไม่ใช่ dependency วน', proposalBasis: 'proposal' },
  { from: 'R3', to: 'R2', type: 'feeds', shortReason: 'ข้อมูล/การเชื่อมเท่าที่ Workflow ใช้', proposalBasis: 'proposal' },
  { from: 'R3', to: 'R4', type: 'feeds', shortReason: 'สิทธิ/การเข้าถึงคลังและ CMS ที่เลือก', proposalBasis: 'proposal' },
  { from: 'R3', to: 'R5', type: 'feeds', shortReason: 'สิทธิข้อมูลสมาชิก/กิจกรรมที่เลือก', proposalBasis: 'proposal' },
  { from: 'R3', to: 'R6', type: 'feeds', shortReason: 'แหล่งข้อมูลงาน Government และการติดตาม', proposalBasis: 'proposal' },
  { from: 'R4', to: 'R5', type: 'enables', shortReason: 'Content สนับสนุน Community · Tag ข่าวใหม่/ชุดทดลอง → จัดกลุ่ม Interest (ไม่รอ Archive ทั้งหมด)', proposalBasis: 'proposal' },
  { from: 'R5', to: 'R7', type: 'enables', shortReason: 'อาจใช้รูปแบบสมาชิก/กิจกรรมร่วมกัน — ไม่ใช่เงื่อนไขบังคับของ Local Pilot', proposalBasis: 'proposal' },
]

export const priorities: Priority[] = [
  {
    id: 'P0', label: 'Unblock',
    scope: 'Scope/Owner/อำนาจ/งบ; สำรวจงาน ระบบ ข้อมูล และความรู้สำคัญ; เริ่มเตรียมทั้ง 7 งานคู่ขนาน',
    reason: 'ยังตัดสินใจสร้าง/เปลี่ยนทีมไม่ได้จากข้อมูลไม่ครบ',
    exitCondition: 'M2 ยืนยัน Scope ทรัพยากร Baseline และรายการ Pilot',
    items: ['Scope · Owner · Budget', 'Baseline Survey', '7 Workstreams Kick-off'],
  },
  {
    id: 'P1', label: 'Core Work',
    scope: 'Workforce/Workflow/JD/KPI; ถ่ายความรู้; IT/BI และ Data ขั้นต่ำ; วางแผนธุรกิจ Community/AE/Local โดยเจ้าของฝ่าย',
    reason: 'ทำให้องค์กรส่งมอบงานได้ และเตรียมฐานสำหรับธุรกิจ',
    exitCondition: 'M3 รับรองแบบงาน; เปลี่ยนผ่านเฉพาะส่วนที่พร้อมตาม Gate',
    items: ['Workforce · JD/KPI', 'Knowledge Transfer', 'Minimum Data', 'Business Plans'],
  },
  {
    id: 'P2', label: 'Parallel Pilots',
    scope: 'เลือก 2–3 จาก C1–C4; Local Pilot เป็นงานธุรกิจคู่ขนานที่อนุมัติแยก ไม่กินโควตา AI Pilot โดยอัตโนมัติ',
    reason: 'พิสูจน์การใช้งานและผล ก่อนลงทุนขยาย',
    exitCondition: 'M4 ทดสอบ → M5 ใช้จริง → M6 วัดผล; Local ใช้ Gate ธุรกิจของตน',
    items: [],
  },
  {
    id: 'P3', label: 'Scale Later',
    scope: 'ระบบทั้งกลุ่ม, Archive ทั้งหมด, Communities เพิ่ม, เครือข่ายครบประเทศ และ App เต็มรูปแบบ',
    reason: 'ยังไม่มี Scope/งบ/ทีม/วันเปิดใช้ที่ยืนยันครบ',
    exitCondition: 'ตัดสินใจจากผล Pilot; ยังไม่กำหนดวันผูกพัน',
    items: ['Group-wide Systems', 'Full Archive', 'More Communities', 'Nationwide Network', 'Full App'],
  },
]

export const pilotCandidates: PilotCandidate[] = [
  { id: 'C1', title: 'AI Support', workstreamId: 'R2', taskId: 'T06',
    firstScope: 'หนึ่ง Workflow โดยต่อยอดการตรวจเอกสารบัญชีเดิม', evidence: 'เวลา/ข้อผิดพลาด/ข้อยกเว้น และคนอนุมัติตรวจผล' },
  { id: 'C2', title: 'Government Intelligence', workstreamId: 'R6', taskId: 'T18',
    firstScope: 'งานที่ตรวจสอบได้ → Screening → มอบหมาย AE → ติดตาม', evidence: 'โอกาสที่ผ่าน QC และมีการติดตามจริง; ไม่ใช่รายได้ที่รับรู้แล้ว' },
  { id: 'C3', title: 'Content Archive / CMS', workstreamId: 'R4', taskId: 'T12',
    firstScope: 'คลังตัวอย่างที่มีสิทธิ ค้นหา/ใช้ซ้ำ/ช่วยร่างในขอบเขตที่เลือก', evidence: 'ค้นหาได้ มีแหล่งที่มา คนตรวจ และใช้กับ Workflow ได้' },
  { id: 'C4', title: 'Audience / Community', workstreamId: 'R5', taskId: 'T15',
    firstScope: 'หนึ่งกิจกรรมหรือแบรนด์: ลงทะเบียน → เข้าร่วม → ติดตาม', evidence: 'Conversion ตามนิยามที่รับรอง; ถ้าไม่มี Event จริงให้ระบุ Sandbox' },
]

export const pilotSelectionCriteria = ['ผลธุรกิจที่ต้องการ', 'ความพร้อมเจ้าของ/ข้อมูล', 'ความเป็นไปได้ในเวลา', 'ทีม/งบ']

export const decisions: Decision[] = [
  {
    id: 'D1', title: '6 Focus + Year-end Scope',
    question: 'ยืนยัน R1–R6 เป็นงานโฟกัส · R7 แยกติดตาม · อะไรคือ Done สิ้นปี',
    why: 'ถ้า Scope ไม่ชัด การตรวจรับ M7 จะวัดไม่ได้',
    conditions: ['R1–R6 โฟกัส / R7 แยกติดตาม (D26)', 'นิยาม "ส่งมอบแล้ว" ของแต่ละงาน', 'งานข้ามปี = ข้อยกเว้นหรือแผนขยายที่อนุมัติ'],
    relatedMilestone: 'M2', status: 'รอหารือ/อนุมัติ',
  },
  {
    id: 'D2', title: 'Owners ที่ยังเป็น TBC',
    question: 'ยืนยันชื่อทีม Government (6A), เจ้าของ Sales Intelligence (6B) และ Delivery team R4',
    why: 'บันทึกมีชื่อ/ทีมที่คลาดเคลื่อน — ต้องยืนยันก่อน Kick-off',
    conditions: ['6A Government: ชื่อทีม', '6B Sales: ฝ่ายขาย · คุณกิ๊บ ถูกกล่าวถึง', 'R4: ทีมภายในหรือ Outsource', 'ผู้อนุมัติของแต่ละ Gate'],
    relatedMilestone: 'M2', status: 'รอหารือ/อนุมัติ',
  },
  {
    id: 'D3', title: 'Team · Capacity · Outsource',
    question: 'ทีมที่มีเวลาทำจริง · งบ Outsource R4 · ลำดับ R6 → R5 ก่อน',
    why: 'Mac ประเมินว่าโหลดทีมสูง — ต้องเลือกลำดับและกำลังส่งมอบ',
    conditions: ['Timeline + Capacity ส่งคุณฉายหลังประชุมทีม (วันนัด TBC)', 'Outsource R4 = เพิ่มกำลังส่งมอบ ไม่แทนการตัดสินใจ Build/Buy', 'ประวัติ: ข้อเสนอเดิมเลือก 2–3 จาก C1–C4 (E01) — ประชุม 26 ก.ย. ระบุ R6/R5 เริ่มก่อน'],
    relatedMilestone: 'M2', status: 'รอหารือ/อนุมัติ',
  },
  {
    id: 'D4', title: 'Milestones & Dates',
    question: 'ยืนยัน M0–M7 · วันที่ที่ขัดกัน · งานข้ามปี',
    why: 'ทุกจุดตรวจต้องมีสิ่งส่งมอบและผู้ตัดสิน ไม่ใช่แค่ถึงวันที่',
    conditions: ['วันที่ M0–M7 และ Checkpoint ที่เสนอ', 'จุดที่วันที่ขัดกัน (ดูใน Timeline)', 'เกณฑ์ Go / Adjust / Hold'],
    relatedMilestone: 'M2', status: 'รอหารือ/อนุมัติ',
  },
  {
    id: 'D5', title: 'Reuse → Buy → Build',
    question: 'ใช้ของเดิมก่อน · ซื้อ/ตั้งค่า · สร้างเฉพาะช่องว่าง',
    why: 'ยังไม่ฟันธง Salesforce/SAP หรือ Vendor ใด (D26 §10)',
    conditions: ['ความเหมาะสมกับงาน', 'การเชื่อมระบบ + สิทธิ/ส่งออกข้อมูล', 'เวลาทีม · ต้นทุน · ผู้ดูแลหลังส่งมอบ'],
    relatedMilestone: 'M3', status: 'รอหารือ/อนุมัติ',
  },
  {
    id: 'D6', title: 'Login / UX Policy',
    question: 'บังคับ Login หรือไม่ · ทดลองใน Sandbox ก่อน · MD sign-off',
    why: 'กระทบ Traffic และ User Experience ของเว็บหลัก (D26 §9, §25)',
    conditions: ['MD workshop จบด้วย Use case + Owner + ขอบเขต UX/ข้อมูล + แผนทดสอบ (ข้อเสนอ)', 'ไม่สั่ง Force login บนเว็บหลักจากเว็บนี้', 'อายุ Login LINE ต้องตรวจจากเอกสารทางการ'],
    relatedMilestone: 'M3', status: 'รอหารือ/อนุมัติ',
  },
]

/** Scene 01 — outcomes. */
export const outcomes = [
  {
    id: 'O1', label: 'Agile Intelligence', expands: ['Workforce', 'Workflow', 'JD/KPI', 'Paperless'], workstreams: ['R1', 'R2'] as WorkstreamId[],
    sourceRefs: [{ source: 'S23', sections: '§1–3', note: 'Efficiency/Workforce, Nation House' }] as SourceRef[],
  },
  {
    id: 'O2', label: 'Connected Data', expands: ['Data Hub', 'Executive AI', 'Nation ID', 'Content Archive'], workstreams: ['R3', 'R4', 'R5'] as WorkstreamId[],
    sourceRefs: [{ source: 'S23', sections: '§3, §26', note: 'Nation House, IT–BI' }] as SourceRef[],
  },
  {
    id: 'O3', label: 'Business Growth', expands: ['4C Community', 'Gov + Sales Intelligence', 'Local Network'], workstreams: ['R5', 'R6', 'R7'] as WorkstreamId[],
    sourceRefs: [{ source: 'S23', sections: '§32', note: 'Mac/ทีม/Media Tech' }] as SourceRef[],
  },
]
export const pillars = ['People', 'Process', 'Data', 'Technology', 'AI']

/** Scene 03 — 4C flow (B4C). */
export const fourC = [
  { id: 'F1', label: 'Content + Creative', text: 'คอนเทนต์และงานสร้างสรรค์เป็นจุดเริ่มที่ดึงคนเข้ามา', detail: ['คลังเดิม → ค้นหา/ใช้ซ้ำ', 'AI Draft → คนตรวจ → CMS', 'สองงานนี้เกี่ยวข้องกัน แต่ไม่ใช่งานเดียว'], workstreamId: 'R4' as WorkstreamId },
  { id: 'F2', label: 'Community', text: 'เปลี่ยนผู้ชมเป็นกลุ่มที่มีส่วนร่วมรอบความสนใจเดียวกัน', detail: ['จำนวนและแบรนด์ของ Communities ยังไม่ล็อก', 'Community ส่วนกลางหรือ BU ยังเปิดอยู่'], workstreamId: 'R5' as WorkstreamId },
  { id: 'F3', label: 'Data', text: 'ข้อมูลที่ได้จากการมีส่วนร่วม โดยมีสิทธิและนิยามชัด', detail: ['ใช้ข้อมูลเมื่อผ่านการตรวจสิทธิเท่านั้น', 'Nation ID เป็นแนวทางข้อมูล/ตัวตนผู้ใช้ — ขอบเขตรอยืนยัน'], workstreamId: 'R3' as WorkstreamId },
  { id: 'F4', label: 'Conversion', text: 'การกระทำที่วัดได้ เช่น ลงทะเบียน เข้าร่วม ติดตามผล', detail: ['นิยาม Conversion ต้องรับรองโดยเจ้าของแบรนด์', 'แยกผลทดสอบ (Sandbox) ออกจากผลจริง'], workstreamId: 'R5' as WorkstreamId },
  { id: 'F5', label: 'Commercial', text: 'รายได้หรือรูปแบบธุรกิจที่ต่อยอดจากข้อมูลกิจกรรม', detail: ['ยังเป็นสิ่งที่ต้องพิสูจน์ ไม่แสดงตัวเลขรายได้สมมติ'], workstreamId: 'R6' as WorkstreamId },
]

export const valuePaths = [
  {
    id: 'V1', steps: ['Docs', 'AI + Human Review', 'New Workflow'],
    proof: 'ลดเวลาและงานซ้ำ โดยตรวจคุณภาพเทียบก่อน–หลัง', workstreamId: 'R2' as WorkstreamId, candidateId: 'C1' as CandidateId,
    sourceRefs: [{ source: 'S23', sections: '§33', note: 'AI ตรวจเอกสารบัญชีเดิม' }] as SourceRef[],
  },
  {
    id: 'V2', steps: ['Verified Gov Leads', 'Screening/QC', 'AE Follow-up'],
    proof: 'โอกาสขายที่มีเจ้าของ ไม่ใช่เพียงรายชื่อโครงการ', workstreamId: 'R6' as WorkstreamId, candidateId: 'C2' as CandidateId,
    sourceRefs: [{ source: 'S23', sections: '§4', note: 'Sales/AE/Intelligence' }, { source: 'BSales', note: 'Screening/QC, Revenue Mapping' }] as SourceRef[],
  },
  {
    id: 'V3', steps: ['Register', 'Join', 'Follow-up'],
    proof: 'เห็น Conversion ของกิจกรรม ไม่หยุดที่ยอดผู้ติดตาม', workstreamId: 'R5' as WorkstreamId, candidateId: 'C4' as CandidateId,
    sourceRefs: [{ source: 'S23', sections: '§8, §13', note: '4C, Data' }, { source: 'B4C', note: 'ลำดับ 4C' }] as SourceRef[],
  },
]

export const valueExtras = [
  {
    id: 'X1', title: 'Content: Archive ≠ AI Draft', steps: ['คลังเดิม → ค้นหา/ใช้ซ้ำ', 'AI Draft → คนตรวจ → CMS'],
    note: 'เกี่ยวข้องกันแต่แยกการตรวจรับ — คลังต้องมีสิทธิและแหล่งที่มา; AI Draft ต้องมี Editorial ตรวจก่อนเผยแพร่',
    workstreamId: 'R4' as WorkstreamId,
    sourceRefs: [{ source: 'S23', sections: '§29', note: 'CMS' }, { source: 'S17', sections: '§8', note: 'Archive/ค้นหา' }] as SourceRef[],
  },
  {
    id: 'X2', title: 'Local: News + Community → Revenue Model', steps: ['ข่าวพื้นที่ + Community', 'โมเดลรายได้พื้นที่'],
    note: 'ต้องพิสูจน์ต้นทุน สิทธิในเพจ และ QC ก่อนขยาย',
    workstreamId: 'R7' as WorkstreamId,
    sourceRefs: [{ source: 'S23', sections: '§10–12, §16–17', note: 'Local model, Southern pilot, สิทธิในเพจ' }] as SourceRef[],
  },
]

/** Scene 05 — dependency paths (proposed sequencing, NOT a computed critical path). */
export interface DepNode { id: string; label: string; ref?: { task?: string; milestone?: MilestoneId; workstream?: WorkstreamId }; note: string }
export interface DepPath { id: string; title: string; lanes: { label?: string; nodes: DepNode[] }[]; parallel: string; usesR3: boolean }

export const dependencyPaths: DepPath[] = [
  {
    id: 'people', title: 'People & Work', usesR3: false,
    parallel: 'สำรวจคน งาน และระบบพร้อมกัน; การออกแบบไม่ต้องรอสร้างระบบทั้งหมด',
    lanes: [{ nodes: [
      { id: 'p1', label: 'Understand Work', ref: { task: 'T01' }, note: 'สำรวจงาน คน และความรู้สำคัญ' },
      { id: 'p2', label: 'Role + Workflow Design', ref: { task: 'T02' }, note: 'ออกแบบคนกับงานร่วมกัน (R1 ↔ R2)' },
      { id: 'p3', label: 'Knowledge / Access / Manual', ref: { task: 'T03' }, note: 'จุดห้ามข้าม: ความรู้และผู้รับช่วงก่อนเปลี่ยนคน' },
      { id: 'p4', label: 'Successor Test', ref: { task: 'T03' }, note: 'ผู้รับช่วงทำงานจริงได้ก่อนเปลี่ยนผ่าน' },
      { id: 'p5', label: 'Approval', ref: { milestone: 'M5' }, note: 'ห้ามให้ AI ตัดสินใจบุคลากร' },
      { id: 'p6', label: 'Transition', ref: { task: 'T03' }, note: 'เฉพาะส่วนที่พร้อมและได้รับอนุมัติ' },
    ] }],
  },
  {
    id: 'data', title: 'Data & AI', usesR3: true,
    parallel: 'พัฒนาต้นแบบด้วยข้อมูลจำลอง/ที่อนุญาตได้; ใช้จริงเมื่อผ่าน Gate',
    lanes: [{ nodes: [
      { id: 'd1', label: 'Scope/Owner', ref: { milestone: 'M2' }, note: 'เลือก Pilot และเจ้าของที่ M2' },
      { id: 'd2', label: 'Data Rights & Quality', ref: { task: 'T08' }, note: 'จุดห้ามข้าม: สิทธิข้อมูลก่อนใช้จริง' },
      { id: 'd3', label: 'Minimum Data / Prototype', ref: { task: 'T09' }, note: 'ข้อมูลขั้นต่ำเสนอพร้อม 6 พ.ย. — Prototype ด้วยข้อมูลจำลองได้' },
      { id: 'dx1', label: 'Integrated Business View', ref: { task: 'T09' }, note: 'Module/data owner + Minimum IDs/API/สิทธิ/คุณภาพ → มุมมองธุรกิจที่เชื่อมกันบางส่วน (เป้าปลาย พ.ย.–ธ.ค.)' },
      { id: 'd4', label: 'User Test', ref: { milestone: 'M4' }, note: 'จุดห้ามข้าม: คนตรวจ AI ก่อนเผยแพร่' },
      { id: 'd5', label: 'Go-live', ref: { milestone: 'M5' }, note: 'Training + UAT + ผู้ดูแล/แผนสำรอง' },
      { id: 'dx2', label: 'Executive AI (Read-only)', ref: { task: 'T09' }, note: 'ถามข้อมูลธุรกิจแบบอ่านอย่างเดียวก่อน — การอนุมัติ/สั่งงานแยกตรวจสิทธิ' },
      { id: 'd6', label: 'Measure', ref: { milestone: 'M6' }, note: 'เทียบ Baseline — เวลา ≠ เงินสดที่ประหยัดแล้ว' },
    ] }],
  },
  {
    id: 'business', title: 'Commercial Intelligence (R6)', usesR3: true,
    parallel: 'Government Mockup ไม่รอ Nation ID หรือ R3 ทั้งก้อน · Sales BI เริ่ม Mockup ด้วยข้อมูลจำลองได้',
    lanes: [
      { label: '6A Government Agent — เริ่มก่อน', nodes: [
        { id: 'g1', label: 'Verified Source', ref: { task: 'T16' }, note: 'แหล่งงบ/ประกาศที่ตรวจสอบได้ — Source ยังต้องคุยกับทีม Government' },
        { id: 'g5', label: 'Alert', ref: { task: 'T17' }, note: 'แจ้งเตือนโครงการใหม่รายวัน' },
        { id: 'g2', label: 'Screening/QC', ref: { task: 'T17' }, note: 'คัดความเหมาะสมก่อนมอบหมาย' },
        { id: 'g3', label: 'AE', ref: { task: 'T17' }, note: 'มี AE Owner ต่อโอกาส' },
        { id: 'g6', label: 'Draft Proposal', ref: { task: 'T18' }, note: 'ร่างข้อเสนอ/PR — ไม่เรียกทุก Draft ว่า TOR ของหน่วยงานรัฐ' },
        { id: 'g4', label: 'Human Check', ref: { task: 'T18' }, note: 'AI ไม่ยื่นงาน/ผูกพันราคาเอง · Pipeline ≠ รายได้' },
      ] },
      { label: '6B Sales Intelligence — ตามมา', nodes: [
        { id: 's1', label: 'Org ID + Rate Card Pool', ref: { task: 'T09' }, note: 'Minimum customer/account data + Rate Card' },
        { id: 's2', label: 'Opportunity View', ref: { task: 'T18' }, note: 'เห็นโอกาส/แพ็กเกจที่เสนอ' },
        { id: 's3', label: 'Account Owner', ref: { task: 'T18' }, note: 'เจ้าของบัญชีติดตาม' },
        { id: 's4', label: 'Record Result', ref: { task: 'T18' }, note: 'แยก Pipeline / ข้อเสนอ / Closed-won / รายได้ตามนิยามบัญชี' },
      ] },
    ],
  },
  {
    id: 'audience', title: 'Nation ID & Audience (R5)', usesR3: true,
    parallel: 'Legacy cleansing ทำคู่ขนาน · Content Tag → Interest ไม่รอ Archive ทั้งหมด',
    lanes: [
      { label: 'On-ground', nodes: [
        { id: 'c1', label: 'Register (รายงานว่าพร้อม)', ref: { task: 'T14' }, note: 'ใช้ระบบ Register เดิมของ Forum — พร้อมไม่เท่ากับ Session tracking เสร็จ' },
        { id: 'c2', label: 'Check-in / Session', ref: { task: 'T15' }, note: 'ลงทะเบียน ≠ มางานจริง · แยก Event Session จาก Web session' },
        { id: 'c3', label: 'Follow-up', ref: { task: 'T15' }, note: 'เชิญกิจกรรมที่เกี่ยวข้อง แล้ววัดผล' },
      ] },
      { label: 'Online', nodes: [
        { id: 'c4', label: 'Link Account + Data Rights', ref: { task: 'T14' }, note: 'วิธีเชื่อมบัญชี + สิทธิข้อมูล → รวมพฤติกรรมรายบุคคล (ไม่ใช่เงื่อนไขก่อนร่าง UX)' },
        { id: 'c5', label: 'Sandbox + UX Review', ref: { task: 'T15' }, note: 'ทดลองในเว็บพนักงาน ~1 เดือน · MD sign-off ก่อน Production' },
        { id: 'c6', label: 'Interest', ref: { task: 'T15' }, note: 'Content Tag + Activity ที่เชื่อมได้ → สัญญาณความสนใจ' },
      ] },
    ],
  },
  {
    id: 'local', title: 'Local', usesR3: false,
    parallel: 'เตรียม Local คู่ขนานได้ ไม่บังคับรอ AI ทั้ง 4 Pilot',
    lanes: [{ nodes: [
      { id: 'l1', label: 'Full Cost + Page Rights + QC', ref: { task: 'T19' }, note: 'จุดห้ามข้าม: ต้นทุน/สิทธิ/QC ก่อนเปิด Pilot' },
      { id: 'l2', label: 'Business Approval', ref: { task: 'T20' }, note: 'อำนาจอนุมัติธุรกิจ/งบรอยืนยัน' },
      { id: 'l3', label: 'Pilot 3 Provinces', ref: { task: 'T21' }, note: 'ปัตตานี–ยะลา–นราธิวาส หากอนุมัติ; วันเริ่มจริงรอยืนยัน' },
      { id: 'l4', label: 'Evaluate', ref: { task: 'T21' }, note: 'ต้นทุน/รายได้จริง' },
      { id: 'l5', label: 'Scale Decision', ref: { workstream: 'R7' }, note: 'ระยะ P3 — ยังไม่กำหนดวัน' },
    ] }],
  },
]

export const noSkipRules = [
  'ความรู้และผู้รับช่วงก่อนเปลี่ยนคน',
  'สิทธิข้อมูลก่อนใช้จริง',
  'คนตรวจ AI/ข่าวก่อนเผยแพร่',
  'ต้นทุน/สิทธิ/QC ก่อนเปิด Local Pilot',
  'AI ไม่ตัดสินใจบุคลากร ไม่อนุมัติธุรกรรม และไม่ยื่นข้อเสนอผูกพันเอง',
]

/** Scene 07 — year-end checkpoints. */
export const yearEndCheckpoints = [
  {
    id: 'K1', title: 'Org Ready',
    summary: 'Roles · JD/KPI · Knowledge Transfer ใน Scope ที่อนุมัติ',
    evidence: ['บทบาท/JD/KPI ที่เจ้าของงานรับรอง', 'บันทึกการถ่ายความรู้และผลทดสอบผู้รับช่วง', 'การอนุมัติการเปลี่ยนผ่านโดยผู้มีอำนาจ'],
    milestones: ['M3', 'M5', 'M7'] as MilestoneId[], workstreams: ['R1', 'R2'] as WorkstreamId[],
  },
  {
    id: 'K2', title: 'Wave 1 Live',
    summary: 'Pilot ผ่าน Test · มี User · Owner · Backup Plan',
    evidence: ['ผลทดสอบที่เจ้าของ Pilot ตรวจรับ', 'รายชื่อผู้ใช้และผู้ดูแล', 'แผนสำรองเมื่อระบบใช้ไม่ได้'],
    milestones: ['M4', 'M5'] as MilestoneId[], workstreams: ['R2', 'R3', 'R4', 'R5', 'R6'] as WorkstreamId[],
  },
  {
    id: 'K3', title: 'Measured & Handed Over',
    summary: 'Before/After Result · Backlog · Plan 2027',
    evidence: ['ผลเทียบ Baseline ที่ล็อกไว้', 'Finance ตรวจผลต้นทุน', 'รายการงานค้างพร้อมเจ้าของ/วันแก้ และแผน 2027'],
    milestones: ['M6', 'M7'] as MilestoneId[], workstreams: ['R3'] as WorkstreamId[],
  },
]

export const notEqual = [
  ['Time Saved', 'Cash Saved'],
  ['Pipeline', 'Revenue'],
  ['Sandbox', 'Real Result'],
]

export const responsibility = [
  { who: 'คุณฉาย (Shine)', role: 'Sponsor · Approve' },
  { who: 'Mac', role: 'Head Project' },
  { who: 'BU Owners', role: 'Deliver' },
  { who: 'IT/BI', role: 'System & Data' },
]

export const weeklyReview = {
  title: 'Weekly Review 30 นาที (ข้อเสนอ — ยังไม่มีการนัดหมาย)',
  agenda: ['งานถัดไป', 'สิ่งติดขัด', 'เจ้าของ', 'สิ่งที่ต้องตัดสินใจ'],
}

/** Scene 08 — next steps use milestone ids (dates come from `milestones`). */
export const nextSteps: { milestoneId: MilestoneId; label: string }[] = [
  { milestoneId: 'M0', label: 'Draft' },
  { milestoneId: 'M1', label: 'System Review' },
  { milestoneId: 'M2', label: 'Scope · Team · Budget' },
]

/** Proposed in-bar marker that is intentionally NOT a milestone (no M8). */
export const minimumDataMarker = { taskId: 'T09', date: '2026-11-06', label: 'Minimum Data' }

// ---------------------------------------------------------------------------
// Lookups

export const wsById = Object.fromEntries(workstreams.map((w) => [w.id, w])) as Record<WorkstreamId, Workstream>
export const taskById = Object.fromEntries(tasks.map((t) => [t.id, t])) as Record<string, Task>
export const msById = Object.fromEntries(milestones.map((m) => [m.id, m])) as Record<MilestoneId, Milestone>
export const candById = Object.fromEntries(pilotCandidates.map((c) => [c.id, c])) as Record<CandidateId, PilotCandidate>
export const sourceById = Object.fromEntries(sources.map((s) => [s.id, s])) as Record<SourceId, Source>
export const isMilestoneId = (id: string): id is MilestoneId => id in msById
export const tasksOf = (ws: WorkstreamId) => tasks.filter((t) => t.workstreamId === ws)
