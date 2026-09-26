/**
 * Content added after the 26 Sep 2026 meeting (D26/S26) and Mac's follow-up
 * proposal (P26). Every item carries its basis so the page can keep
 * "from meeting" / "Mac proposal" / "needs confirmation" apart.
 * This is presentation content — nothing here runs a real Nation ID,
 * LINE login, analytics or AI agent.
 */
import type { Basis, MilestoneId, SourceRef, WorkstreamId } from './nationPlan'

export interface InfoNode {
  id: string
  label: string
  short?: string
  basis: Basis
  what: string
  why: string
  points: string[]
  caution?: string[]
  kpis?: string[]
  sourceRefs: SourceRef[]
  workstreamId?: WorkstreamId
}

const D26 = (sections: string, note: string): SourceRef => ({ source: 'D26', sections, note })
const P26 = (note: string): SourceRef => ({ source: 'P26', note })
const NIDF = (note: string): SourceRef => ({ source: 'NIDF', note })

// ---- Scene: Connected Organization -----------------------------------------

export const connectedApps = ['Sales', 'Finance', 'HR', 'Procurement', 'Asset']
export const hubChips = ['รหัสเดียวกัน', 'สิทธิตามบทบาท', 'ข้อมูลอัปเดตล่าสุด']

export const connectedNodes: InfoNode[] = [
  {
    id: 'apps', label: 'แอปหน้างาน', basis: 'meeting26', workstreamId: 'R3',
    what: 'แต่ละฝ่ายทำเว็บแอปของตัวเองและบันทึกงานที่หน้างาน',
    why: 'ข้อมูลเริ่มจากเจ้าของงานจริง — ระบบกลางไม่แทนการบันทึกของฝ่าย',
    points: ['Sales · Finance · HR · Procurement · Asset', 'ทีม IT ช่วยรวมแอปแต่ละหน่วยงานเข้าถังกลาง (D26 §18)', 'ใช้ระบบที่มีอยู่แล้วถ้าใช้ได้ดี — ไม่ทำใหม่ทั้งหมด (D26 §10)'],
    sourceRefs: [D26('§18', 'แต่ละหน่วยงานทำแอปของตัวเอง แล้วเชื่อมข้อมูลเข้าส่วนกลาง'), D26('§10', 'ระบบที่มีอยู่แล้วไม่ทำใหม่')],
  },
  {
    id: 'hub', label: 'Data Hub', basis: 'meeting26', workstreamId: 'R3',
    what: 'รวบรวมข้อมูลบน Private Cloud ขององค์กร และเชื่อมแอปแต่ละฝ่ายเป็นระยะ',
    why: 'ดูข้อมูลข้ามฝ่ายได้จากแหล่งเดียว แทนการตามรายงานทีละฝ่าย',
    points: [
      'ข้อมูลลูกค้าองค์กรใช้รหัสกลาง (Organization ID) เชื่อม Sales กับ Finance/งานที่เกี่ยวข้อง',
      'ชื่อเป็น label ไม่ใช่ key สำหรับ merge อัตโนมัติ',
      'เป้าจากประชุม: เฟส 1 ต.ค.–พ.ย. · ใช้ได้บางส่วนปลาย พ.ย.–ธ.ค. · "อาจไม่ครบทั้งหมดก่อน"',
      'ข้อเสนอ Mac: กำหนด Minimum Data Contract ก่อนเชื่อม Wave 1 แล้วขยาย API Standard ต่อ',
    ],
    caution: ['สถาปัตยกรรม/Cloud/บริการที่เลือกยังต้องออกแบบ — ไม่ถือว่าซื้อระบบแล้ว', 'ไม่ใช่ทุกข้อมูลต้องอยู่ตารางเดียว และไม่ใช่ให้ทุกคนเห็นทุกอย่าง'],
    kpis: ['ความสดของข้อมูล (เวลาอัปเดตล่าสุดต่อแหล่ง)', 'สัดส่วนระบบที่เชื่อมตาม Minimum Data Contract'],
    sourceRefs: [D26('§17–18', 'รหัสลูกค้าเดียว · ถังข้อมูลกลาง · เฟส 1 ต.ค.–พ.ย.'), P26('Minimum Data Contract เป็นข้อเสนอ — บันทึกกล่าวถึง API Standard หลังเฟสแรก')],
  },
  {
    id: 'ai', label: 'Executive AI', basis: 'meeting26', workstreamId: 'R3',
    what: 'ผู้บริหารถามข้อมูลธุรกิจผ่านจุดเดียว',
    why: 'คุณฉายต้องการ "คุยกับเอเจนต์ตัวเดียว" เพื่อดึงข้อมูลธุรกิจทั้งหมด (D26 §18)',
    points: [
      'ขอบเขตแรก: Business / Operations Intelligence — ไม่ดึงคลังข่าวทั้งหมดเข้า Agent เดียว',
      'ตัวอย่างคำถาม (สมมติ): "ลูกค้าองค์กรนี้มีงานอะไรค้าง?" · "รายการอนุมัติใดรออยู่?" · "ยอดขายชุดนี้อัปเดตเมื่อไร?"',
      'คำตอบต้องบอกแหล่งข้อมูล ช่วงเวลา เวลาอัปเดต และข้อจำกัด — ข้อมูลที่ Sales ยังไม่ปิดต้องบอกตรง ๆ',
      'ข้อเสนอ Mac: เริ่ม Read-only · การอนุมัติ/สั่งงานจริงแยกตรวจสิทธิ',
    ],
    caution: ['ถาม Agent ไม่เท่ากับอนุมัติธุรกรรมได้', 'ไม่รับประกันว่าเชื่อมครบทั้งองค์กรภายในปีนี้'],
    kpis: ['คำถามที่ตอบได้พร้อมแหล่งข้อมูล', 'เวลาที่ผู้บริหารได้คำตอบเทียบกับการขอรายงาน'],
    sourceRefs: [D26('§16, §18–19', 'Chatbot ถามข้อมูล · หลังบ้านแยกจากคอนเทนต์'), P26('Read-only ก่อน และคำถามตัวอย่างเป็นข้อเสนอ')],
  },
  {
    id: 'split', label: 'แยกข้อมูลอย่างไร', basis: 'proposal', workstreamId: 'R3',
    what: 'ข้อมูลแต่ละประเภทมี AI/ผู้ดูแลของตัวเอง และเชื่อมกันเฉพาะที่มีเหตุผลและสิทธิ',
    why: '"หลังบ้านก็คือหลังบ้าน คอนเทนต์ก็คือคอนเทนต์" (สรุปจาก D26 §19)',
    points: ['Business Data → Executive AI', 'Content Archive → Content AI', 'Audience Data → Nation ID & Audience Intelligence'],
    caution: ['"Database กลาง" ไม่ได้แปลว่าให้ทุกคนเห็นทุกอย่าง'],
    sourceRefs: [D26('§19', 'ไม่เชื่อมแชทบอทหลังบ้านกับคอนเทนต์โดยตรง'), P26('แผนภาพแยก 3 ส่วนเป็นข้อเสนอการสื่อสาร')],
  },
]

// ---- Scene: Nation ID ---------------------------------------------------------

export const idSources = ['LINE', 'Website', 'Event', 'ฐานสมาชิกเดิม']
export const idOutcomes = ['Community', 'Commercial']

export const nationIdBoxes: InfoNode[] = [
  {
    id: 'identity', label: 'Identity', short: 'คนเดิม ไม่สร้างซ้ำทุกช่องทาง', basis: 'meeting26', workstreamId: 'R5',
    what: 'คนหนึ่งคนมี Person ID เดียวใน Nation ID แล้ว Map กับ Brand account, LINE identity, Web account และ Event registration ที่ตรวจสอบได้ (เป็น Alias)',
    why: 'รู้ว่าเป็นคนเดียวกันข้ามแบรนด์/ช่องทาง โดยผู้ใช้ไม่ต้องจำเลข ID (D26 §24)',
    points: ['ผู้ใช้ไม่ต้องเห็นเลข Nation ID แต่ต้องได้รับแจ้งเรื่องการเก็บ/ใช้ข้อมูล', 'LINE เป็น external identity — ไม่ใช่ master key ถาวรของทั้งกลุ่ม', 'Anonymous เป็นสถานะที่ถูกต้องของระบบ'],
    caution: ['ไม่ใช้แนวคิดนี้ซ่อนการติดตาม', 'ไม่ merge คนด้วย display name'],
    kpis: ['ตัวตนที่เชื่อมได้ (ยืนยันแล้ว)', 'อัตราหลุดตอน Login'],
    sourceRefs: [D26('§24', 'Nation ID / Nation Group ID — Map แต่ละแบรนด์ในหลังบ้าน'), P26('การแยก Person/Organization ID เป็นข้อเสนอ')],
  },
  {
    id: 'journey', label: 'Journey', short: 'อ่านอะไร ไปงานไหน กลับมาเมื่อไร', basis: 'meeting26', workstreamId: 'R5',
    what: 'ลงทะเบียน · check-in · เข้า Session · อ่าน Content · ตอบรับคำเชิญ — เชื่อมกับเวลา แบรนด์ แคมเปญ และแหล่งข้อมูล',
    why: 'เก็บ Activity ใน Session ที่ยังไม่เคยเก็บ (D26 §3)',
    points: ['แยก "ลงทะเบียน" ออกจาก "มางานจริง"', 'แยก Event Session ออกจาก Web session', 'On-ground ใช้ Register เดิมของ Nation Forum'],
    kpis: ['Session coverage ของงานที่ทดลอง', 'อัตรากลับมาร่วมงาน'],
    sourceRefs: [D26('§3, §8, §12', 'Register เสร็จแล้ว · เก็บ Activity ราย Session')],
  },
  {
    id: 'interest', label: 'Interest', short: 'แปลพฤติกรรมเป็นสัญญาณ', basis: 'meeting26', workstreamId: 'R5',
    what: 'ใช้ Content/Topic/Entity Tag ประกอบกับพฤติกรรมที่วัดได้',
    why: 'จัดกลุ่มความสนใจเพื่อเชิญกิจกรรมและทำ Targeted Marketing (D26 §3, §25)',
    points: ['แยก "ผู้ใช้บอกเอง" / "พฤติกรรมที่บันทึกได้" / "AI ประเมิน" พร้อมช่วงเวลาและหลักฐาน', 'ตัวอย่าง Tag ที่ไม่อ่อนไหว: AI · Business · SME · Logistics', 'Tag ข่าวใหม่/ชุดทดลองก่อน ไม่รอ Archive ทั้งหมด (ข้อเสนอ)'],
    caution: ['อ่านหนึ่งข่าวไม่เท่ากับอยากซื้อ', 'Sentiment ของข่าวไม่ใช่ความเห็นของผู้อ่าน', 'ไม่อนุมานความเห็นการเมือง สุขภาพ หรือคุณลักษณะอ่อนไหว'],
    sourceRefs: [D26('§25', 'ใช้ AI สกัด Entity/Category/Sentiment ของข่าว'), P26('แยกระดับความมั่นใจของ Interest เป็นข้อเสนอ'), NIDF('Declared / Observed / Inferred — ห้ามรวมเป็น tag เดียว')],
  },
  {
    id: 'activation', label: 'Activation', short: 'ส่งต่อคุณค่าและวัดผล', basis: 'proposal', workstreamId: 'R5',
    what: 'เชิญกิจกรรมที่เกี่ยวข้อง → ผู้ใช้ตอบรับหรือเข้าร่วม → วัดผล → ปรับสิ่งที่เสนอ',
    why: 'เก็บข้อมูลแล้วต้องเกิดคุณค่า ไม่ใช่จบที่ Dashboard',
    points: ['เสนอแพ็กเกจ/กิจกรรมจากความต้องการของกลุ่ม — ไม่ขายโปรไฟล์รายคน', 'มีเจ้าของธุรกิจของแต่ละ Use case และสิทธิการติดต่อ', 'ปีหน้าเน้น Community ให้แข็งแรง (D26 §24)'],
    kpis: ['อัตราตอบรับคำเชิญ', 'อัตรากลับมาร่วม', 'การใช้ Use case ต่อเจ้าของธุรกิจ'],
    sourceRefs: [D26('§24, §26', 'Targeted Marketing / Invitation · ปีหน้า on Community'), P26('Activation loop เป็นข้อเสนอ')],
  },
]

export interface StoryStep { id: string; title: string; detail: string; anonymous?: string; box: string; code: string; anonCode?: string }
export const storySteps: StoryStep[] = [
  { id: 's1', code: 'CNT-7281 · EXT-LINE-9282', anonCode: 'CNT-7281 · Anonymous', box: 'journey', title: 'อ่านข่าว AI จาก LINE', detail: 'รู้ช่องทาง/แคมเปญที่วัดได้ — ยังอาจไม่รู้ตัวตน', anonymous: 'Anonymous: รู้เฉพาะช่องทาง/แคมเปญ' },
  { id: 's2', code: 'EXT-LINE-9282 → PER-00182', anonCode: 'ไม่มี PER', box: 'identity', title: 'ยืนยัน/เชื่อมบัญชี', detail: 'เชื่อมเข้า Person ID ใน Nation ID ตามสิทธิ', anonymous: 'ไม่ Login: ไม่สร้าง Person ID — อ่านต่อได้ตาม UX ที่อนุมัติ' },
  { id: 's3', code: 'PER-00182 → EVT-001', box: 'journey', title: 'สมัคร + Check-in Forum', detail: 'ลงทะเบียนกับการเข้าร่วมเป็นคนละ Activity' },
  { id: 's4', code: 'PER-00182 → SES-018 → TOPIC-AI', box: 'journey', title: 'สแกน Session เรื่อง AI', detail: 'เก็บหัวข้อและเวลา — ไม่เหมารวมว่าระบบนี้เสร็จแล้ว' },
  { id: 's5', code: 'TOPIC-AI · Observed', box: 'interest', title: 'สัญญาณสนใจ AI / Business', detail: 'แสดงเป็น Inference ไม่ใช่เจตนาซื้อที่ยืนยัน' },
  { id: 's6', code: 'ACT-… (ตอบรับคำเชิญ)', box: 'activation', title: 'รับคำเชิญ Briefing และตอบรับ', detail: 'เกิดผลที่ตรวจวัดได้' },
]

export const lineFlow = {
  verified: ['Login / authorization ใช้งานได้', 'Server ยืนยันตัวตน', 'Map เข้า Person ID (Nation ID)', 'เก็บ Activity ตามสิทธิ'],
  anonymous: ['ยังไม่ยืนยัน / ไม่อนุญาต / ยกเลิก / Session หมดอายุ', 'แสดงเป็น Anonymous หรือขอเชื่อมบัญชีตาม UX ที่อนุมัติ', 'ไม่หยุดการอ่านโดยพลการ'],
  teamReference: 'ภาพทีม: Broadcast → Click → Website → Profile/UTM → GA4/DB → Report (อ้างอิง — ไม่ใช่คำรับรองว่า "ทุกคลิกรู้ว่าเป็นใคร")',
  techFacts: [
    'เปิดลิงก์ข่าวใน LINE in-app browser ≠ เปิด LIFF browser — LIFF ต้องตั้งค่า channel/endpoint/scopes [W1, W2]',
    'ใช้หน้าเว็บเดิมเป็น LIFF endpoint ได้ — ไม่ต้องทำ Native App ใหม่ แต่ต้องตั้งค่า LIFF app [W1, W2]',
    'Backend ต้องตรวจ ID/access token — ไม่เชื่อ userId/profile ที่ client ส่งมาโดยตรง [W3]',
    'LINE Login access token 30 วัน · refresh token สูงสุด 90 วัน — อย่าสัญญา Login 1 ปี/Forever [W3, W4]',
    'LINE user ID ต่าง provider อาจต่างกันแม้เป็นคนเดียว — ตรวจโครงสร้าง provider ก่อนเชื่อมข้ามแบรนด์ [W7, W8]',
    'GA4 เป็นเครื่องมือวัด ไม่ใช่ master identity — ไม่ส่งชื่อ/อีเมล/โทรศัพท์/LINE profile ใน event หรือ URL [W5, W6]',
    'UTM บอกที่มาของแคมเปญ ไม่พิสูจน์ว่าใครเป็นผู้รับเดิมเมื่อ link ถูก forward',
    'สิทธิ การแจ้งใช้ข้อมูล การถอนสิทธิ และระยะเก็บ ต้องให้ผู้รับผิดชอบตรวจก่อนใช้จริง (ข้อเสนอ ไม่ใช่การรับรองกฎหมาย)',
  ],
  webRefs: [
    'W1 developers.line.biz/en/docs/liff/developing-liff-apps/',
    'W2 developers.line.biz/en/docs/liff/registering-liff-apps/',
    'W3 developers.line.biz/en/docs/liff/using-user-profile/',
    'W4 developers.line.biz/en/docs/line-login/managing-access-tokens/',
    'W5 support.google.com/analytics/answer/9213390',
    'W6 support.google.com/analytics/answer/6366371',
    'W7 developers.line.biz/en/docs/messaging-api/getting-started/',
    'W8 developers.line.biz/en/docs/partner-docs/provider-page/',
  ],
}

// ---- R6 tracks and R5 lanes (drawer content) -------------------------------

export const r6Tracks = [
  {
    id: '6A', title: 'Government Agent', order: 'เริ่มก่อน', basis: 'meeting26' as Basis,
    flow: ['Verified Source', 'Alert', 'Screening', 'มอบหมาย AE', 'Draft Proposal', 'คนตรวจ'],
    owner: 'ทีม Government (TBC)',
    notes: ['เป้าปลาย ต.ค.: Mockup/Flow แบบมีเงื่อนไขด้านเวลาทีม — ไม่ใช่ Production/รายได้ที่ยืนยัน', 'Source และ Flow 1–4 ยังต้องคุยกับทีม Government', 'ไม่แสดงการยื่นงาน/ผูกพันราคาโดย AI อัตโนมัติ'],
  },
  {
    id: '6B', title: 'Sales Intelligence', order: 'ตามมาหลัง Government', basis: 'meeting26' as Basis,
    flow: ['Organization ID', 'ประวัติงาน + Rate Card Pool', 'โอกาส/แพ็กเกจ', 'เจ้าของบัญชีติดตาม', 'บันทึกผล'],
    owner: 'ฝ่ายขาย · คุณกิ๊บ ถูกกล่าวถึง (TBC)',
    notes: ['ครอบคลุมลูกค้าเอกชน — ไม่ใช่แค่ Automation เอกสาร', 'แยก Pipeline / ข้อเสนอ / Closed-won / รายได้ตามนิยามบัญชี', 'เริ่ม Mockup ด้วยข้อมูลจำลองได้'],
  },
]

export const r5Lanes = [
  { id: 'onground', title: 'On-ground', does: 'Register เดิมของ Forum → Check-in → Session Activity → Follow-up', status: 'Register รายงานว่าพร้อม · Session tracking/ตรวจรับยังต้องแยก', basis: 'meeting26' as Basis },
  { id: 'online', title: 'Online', does: 'ทดลอง LINE/Web Login + การอ่านข่าว ในเว็บ Sandbox พนักงาน', status: 'วางแผนทดสอบ ~1 เดือน · UX/MD sign-off ก่อน Production', basis: 'meeting26' as Basis },
  { id: 'legacy', title: 'Legacy', does: 'Clean ฐาน Event/สมาชิก/Print เดิม → ตรวจสิทธิ/คุณภาพ → Map เข้า ID กลาง', status: 'งานเพิ่มที่ต้องจัดเจ้าของ — ยังไม่ถือว่า Clean แล้ว', basis: 'pending' as Basis },
]

// ---- Priority: focus tiers (replaces "4 equal candidates" as the main visual) --

export interface FocusTier { id: string; label: string; basis: Basis; items: { ws: WorkstreamId; text: string }[]; note: string }
export const focusTiers: FocusTier[] = [
  { id: 'F1', label: 'เริ่มก่อน', basis: 'meeting26', note: '"ให้เริ่มก่อน" ไม่ใช่การอนุมัติทุก Feature, งบ หรือวันเปิดใช้',
    items: [{ ws: 'R6', text: '6A Government Agent' }, { ws: 'R5', text: 'On-ground + Online Sandbox' }] },
  { id: 'F2', label: 'ทำคู่ขนาน', basis: 'meeting26', note: 'เตรียมคู่ขนานได้ — Go-live ต้องผ่าน Gate ของงานนั้น',
    items: [{ ws: 'R1', text: 'Reform · JD/KPI · Knowledge' }, { ws: 'R2', text: 'Workflow · Paperless' }, { ws: 'R3', text: 'Minimum Data · Access' }] },
  { id: 'F3', label: 'ขยายตามความพร้อม', basis: 'proposal', note: 'ขึ้นกับทีมที่มีเวลาจริงและข้อมูลขั้นต่ำ',
    items: [{ ws: 'R6', text: '6B Sales Intelligence' }, { ws: 'R3', text: 'Data Hub → Executive AI' }, { ws: 'R4', text: 'Content Archive/AI (รอทีม)' }] },
  { id: 'F4', label: 'แยกติดตาม', basis: 'meeting26', note: 'พักจากชุด AI Execution รอบนี้ — ไม่ยกเลิกธุรกิจ ไม่ลบ Tasks',
    items: [{ ws: 'R7', text: 'Local Network' }] },
]

// ---- Proposed checkpoints (bound to existing gates; not new milestones) -----

export interface ProposedCheckpoint {
  id: string
  label: string
  gate: MilestoneId
  /** Only when a window was stated in the meeting notes. */
  targetWindow: { from: string; to: string } | null
  windowText: string
  confirmedDate: null
  meaning: string
  sourceRefs: SourceRef[]
}
export const proposedCheckpoints: ProposedCheckpoint[] = [
  { id: 'CP1', label: 'Align Owners · Capacity · Demo', gate: 'M2', targetWindow: null, windowText: 'ก.ย.–ต้น ต.ค. · วันนัด TBC (29 หรือ 30 ก.ย. ในบันทึกไม่ตรงกัน)', confirmedDate: null,
    meaning: 'สรุป Scope และคนที่มีเวลาทำจริง', sourceRefs: [D26('§18, §24, §27', 'ประชุมทีม "วันอังคาร" — บันทึกระบุ 29 และ 30 ก.ย.')] },
  { id: 'CP2', label: 'On-ground Register + Session test', gate: 'M4', targetWindow: null, windowText: 'ก่อนกิจกรรมที่เจ้าของงานยืนยัน · งาน "วันที่ 8 / 20" ยังไม่ระบุเดือน', confirmedDate: null,
    meaning: 'ใช้ระบบเดิมเป็นฐาน', sourceRefs: [D26('§3, §8', 'งานกรุงเทพฯ วันที่ 8 · Nation Forum วันที่ 20 (ไม่ระบุเดือน)'), { source: 'S26', note: 'ระบุ 8 ต.ค. — ต้องยืนยัน' }] },
  { id: 'CP3', label: 'Online Sandbox + UX Review', gate: 'M4', targetWindow: null, windowText: '~1 เดือนจากวันเริ่มทดสอบที่อนุมัติ', confirmedDate: null,
    meaning: 'ไม่กำหนดวันเริ่มเอง ไม่สั่ง Force login บนเว็บหลัก', sourceRefs: [D26('§8, §25, §27', 'Sandbox พนักงาน ~1 เดือน · UX กับ MD')] },
  { id: 'CP4', label: 'Government / Sales Flow Mockup', gate: 'M4', targetWindow: { from: '2026-10-19', to: '2026-10-31' }, windowText: 'เป้าปลาย ต.ค. แบบมีเงื่อนไข', confirmedDate: null,
    meaning: 'ยืนยันขอบเขต Government ก่อน — ไม่ใช่ Go-live', sourceRefs: [D26('§6', 'Mockup ทั้ง Flow ภายในสิ้นเดือน 10 ถ้าโฟกัสเต็มที่')] },
  { id: 'CP5', label: 'First Integrated Business View', gate: 'M5', targetWindow: { from: '2026-11-23', to: '2026-12-18' }, windowText: 'เป้าปลาย พ.ย.–ธ.ค.', confirmedDate: null,
    meaning: 'บางระบบ/บางข้อมูล พร้อมแหล่งข้อมูลและเวลาอัปเดต', sourceRefs: [D26('§18', '"ปลาย พ.ย. อาจได้ใช้ ธ.ค. แต่อาจไม่ครบทั้งหมด"')] },
  { id: 'CP6', label: 'Year-end Scope Review', gate: 'M7', targetWindow: null, windowText: '31 ธ.ค. ตามกรอบที่หารือ (ใช้ M7)', confirmedDate: null,
    meaning: 'รับรองเฉพาะ Scope/หลักฐานจริง · งานข้ามปีเป็นข้อยกเว้นหรือแผนขยายที่ต้องอนุมัติ', sourceRefs: [D26('§15', 'อยากให้ทุกอย่างจบภายในสิ้นปี')] },
]

/** Things the notes contradict or leave open — shown as TBC, never resolved silently. */
export const openQuestions26 = [
  'วันประชุมทีม "วันอังคาร": D26 ระบุทั้ง 29 และ 30 ก.ย. · S26 ระบุ Training 6 ต.ค.',
  'งาน "วันที่ 8" และ "วันที่ 20" ไม่ระบุเดือนใน D26',
  'วันที่ละเอียดบางรายการ (11/18/21/25 ต.ค., 15/30 พ.ย.) มีเฉพาะใน S26 — ยังไม่ผูกเป็นแผน',
  'ชื่อทีม R6 และคำที่ถอดเสียงคลาดเคลื่อน (R-Client, Cell/Sell Intelligence) — ใช้ชื่อเข้าใจง่ายพร้อม TBC',
  '"~40 โปรแกรม" และปัญหา HR ซับซ้อน เป็นกรณีธุรกิจอื่นใน D26 — ไม่ใช่รายการระบบ Nation',
]

// ---- Nation ID Framework (NIDF, adapted; all codes are fictional examples) ----

export interface IdItem { code: string; label: string; th: string; ws?: WorkstreamId }
export interface IdDomain { id: string; label: string; th: string; icon: 'people' | 'building' | 'content' | 'event'; ids: IdItem[]; points: string[]; caution?: string[] }

export const idDomains: IdDomain[] = [
  { id: 'people', label: 'People', th: 'คน ทุกบทบาท', icon: 'people',
    ids: [
      { code: 'Person ID', label: 'Person', th: 'คนหนึ่งคน', ws: 'R5' },
      { code: 'Audience ID', label: 'Audience', th: 'ผู้ชมที่ยังไม่รู้ตัวจริง', ws: 'R5' },
      { code: 'Employee ID', label: 'Employee', th: 'พนักงาน Nation', ws: 'R1' },
    ],
    points: ['คนเดียวกันมี Person ID เดียว ไม่ว่าจะมาจาก LINE, Web หรือ Event', 'Audience ผูกกับ Person ได้เมื่อมีหลักฐาน/ความยินยอมเท่านั้น'],
    caution: ['ข้อมูลพนักงานอยู่ภายใต้สิทธิแยก — ไม่รวมกับฐานผู้อ่าน'] },
  { id: 'business', label: 'Business', th: 'องค์กร ความสัมพันธ์ โอกาส', icon: 'building',
    ids: [
      { code: 'Organization ID', label: 'Organization', th: 'บริษัท / หน่วยงานรัฐ / Agency / Partner', ws: 'R6' },
      { code: 'Customer Account ID', label: 'Customer Account', th: 'ความสัมพันธ์เชิงธุรกิจกับองค์กร', ws: 'R6' },
      { code: 'Campaign ID', label: 'Campaign', th: 'แคมเปญการตลาด / โฆษณา', ws: 'R6' },
      { code: 'Project / Opportunity ID', label: 'Opportunity', th: 'ดีล / โอกาส / งานขาย', ws: 'R6' },
    ],
    points: ['Organization ID ใช้ร่วมกันระหว่าง Sales, Finance และ Data Hub (R3)', '6A Government: หน่วยงานรัฐเป็น Organization เช่นกัน'],
    caution: ['Customer Account เป็นความสัมพันธ์ — ไม่ใช่ตัวองค์กร'] },
  { id: 'knowledge', label: 'Knowledge', th: 'เนื้อหา ความรู้ สินทรัพย์ดิจิทัล', icon: 'content',
    ids: [
      { code: 'Content ID', label: 'Content', th: 'เนื้อหาหนึ่งชิ้น', ws: 'R4' },
      { code: 'Topic / Entity ID', label: 'Topic', th: 'เรื่อง / คน / แบรนด์ / สถานที่ / ประเด็น', ws: 'R4' },
      { code: 'Asset / Document ID', label: 'Asset', th: 'ไฟล์ / วิดีโอ / สัญญา / เอกสาร', ws: 'R2' },
    ],
    points: ['Topic ID ทำให้ "อ่านเรื่อง AI" กับ "เข้า Session AI" รู้ว่าเป็นเรื่องเดียวกัน', 'เริ่ม Tag ข่าวใหม่ก่อน ไม่รอ Archive ทั้งหมด'] },
  { id: 'experience', label: 'Experience', th: 'กิจกรรมและประสบการณ์', icon: 'event',
    ids: [
      { code: 'Event ID', label: 'Event', th: 'งาน / Forum / Seminar', ws: 'R5' },
      { code: 'Session ID', label: 'Session', th: 'Session ย่อยในงาน', ws: 'R5' },
    ],
    points: ['Register เดิมของ Forum เป็นจุดเริ่ม (D26)', 'แยก "ลงทะเบียน" กับ "มางานจริง" เป็นคนละ Activity'] },
]

export const phase1Ids = [
  { code: 'Person', q: 'ใครคือใคร', ws: 'R5' as WorkstreamId },
  { code: 'Organization', q: 'องค์กรไหน', ws: 'R6' as WorkstreamId },
  { code: 'Content', q: 'เนื้อหาชิ้นไหน', ws: 'R4' as WorkstreamId },
  { code: 'Topic', q: 'เกี่ยวกับเรื่องอะไร', ws: 'R4' as WorkstreamId },
  { code: 'Event / Session', q: 'เกิดที่ไหน', ws: 'R5' as WorkstreamId },
  { code: 'Activity', q: 'ใครทำอะไร เมื่อไร', ws: 'R5' as WorkstreamId },
]

export const idPrinciples = [
  { title: 'Organization ≠ บริษัทเอกชน', text: 'อาจเป็น Agency, กระทรวง, มหาวิทยาลัย, รัฐวิสาหกิจ, Partner, Supplier — สำคัญกับ 6A Government' },
  { title: 'Customer Account = ความสัมพันธ์', text: 'ORG-xxxx (ตัวอย่าง) เป็นองค์กร · "ลูกค้าที่ใช้งานอยู่ / Sponsor / แหล่งข่าว" เป็น Account ที่แยกจากองค์กร' },
  { title: 'Audience → Person เมื่อมีหลักฐาน', text: 'ไม่บังคับให้รู้ตัวตนตั้งแต่แรก — เชื่อมเมื่อ Login/ยืนยัน/ยินยอม เท่านั้น' },
]

export const archConcepts = [
  { id: 'identity', label: 'Identity', q: 'นี่คือใคร / อะไร' },
  { id: 'relationship', label: 'Relationship', q: 'เกี่ยวข้องกับอะไร' },
  { id: 'activity', label: 'Activity', q: 'ทำอะไร' },
  { id: 'context', label: 'Context', q: 'เกิดที่ไหน เมื่อไร เพราะอะไร' },
  { id: 'permission', label: 'Permission', q: 'ใช้ข้อมูลนี้ได้แค่ไหน' },
]

/** Master vs alias — fictional sample only. */
export const aliasExample = {
  master: 'PER-00182 (ตัวอย่าง)',
  aliases: ['LINE user · U•••••(ตัวอย่าง)', 'Web account · USER-1892', 'Event registration · REG-0412', 'Google / Facebook login', 'CRM contact · 9281'],
  activity: [['Person', 'PER-00182'], ['Action', 'SESSION_CHECK_IN'], ['Object', 'SES-018'], ['Time', '10:31'], ['Channel', 'Event QR'], ['Source', 'Forum (ตัวอย่าง)']],
}

export const interestBuckets = [
  { id: 'declared', label: 'Declared', th: 'ผู้ใช้บอกเอง' },
  { id: 'observed', label: 'Observed', th: 'เห็นจากพฤติกรรม' },
  { id: 'inferred', label: 'Inferred', th: 'AI ประเมิน' },
]

/** How the graph gives AI context — connections only where rights allow. */
export const graphLinks: [string, string, string][] = [
  ['Person', 'อ่าน', 'Content'],
  ['Content', 'เกี่ยวกับ', 'Topic'],
  ['Person', 'เข้าร่วม', 'Session'],
  ['Session', 'อยู่ใน', 'Event'],
  ['Session', 'เกี่ยวกับ', 'Topic'],
  ['Person', 'ทำงานที่', 'Organization'],
  ['Organization', 'เป็นลูกค้า', 'Campaign'],
  ['Campaign', 'นำไปสู่', 'Opportunity'],
]

export const manySystems = [
  { sys: 'CRM', own: 'Customer ID ของตัวเอง' },
  { sys: 'DAM / CMS', own: 'Content ID ของตัวเอง' },
  { sys: 'LINE', own: 'User ID ของตัวเอง' },
]

export const idFrameworkSources: SourceRef[] = [
  NIDF('ผัง 4 กลุ่ม ID และหลักการ — ปรับถ้อยคำ, ใช้รหัสตัวอย่างสมมติ, ไม่ใช้ชื่อลูกค้าจริง'),
  D26('§24', 'Nation ID / Nation Group ID — Map แต่ละแบรนด์ในหลังบ้าน'),
  P26('Nation ID เป็นรหัสกลางของทุก Entity — ข้อเสนอ ยังไม่ใช่ระบบที่สร้างแล้ว'),
]
