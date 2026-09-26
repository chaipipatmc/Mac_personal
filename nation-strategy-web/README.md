# NATION — Strategy to Execution

เว็บนำเสนอ (ภาษาไทย, Responsive) ให้ Mac ใช้สรุปทิศทาง Media Tech และเสนอ Roadmap Execution ให้คุณฉาย
**สถานะ: ร่างเพื่อหารือและอนุมัติ · ข้อมูล ณ 23 ก.ย. 2026 + ปรับตามประชุม 26 ก.ย. · เป็นภาพแผน ไม่ใช่ Live Tracker**

ดูการเปลี่ยนแปลงใน [CHANGELOG.md](CHANGELOG.md)

10 ฉาก / 2 บท: ทิศทาง → Workstreams → Connected Org → Nation ID → คุณค่า → Focus → งานเชื่อมกัน → Timeline → ตรวจรับ → ขออนุมัติ

เป็นเว็บนำเสนอ Strategy เท่านั้น — ไม่ได้สร้าง Nation ID, LINE Login, GA4 หรือ AI Agent จริง และไม่เก็บข้อมูลผู้ใช้

## เปิดใช้งาน

```bash
npm install
npm run dev        # เปิดที่ http://localhost:5173
npm run build      # สร้างไฟล์ static ใน dist/ (ใช้ base './' เปิดจาก path ใดก็ได้)
npm run preview    # เปิด dist/ เพื่อตรวจก่อนส่ง
```

## ตรวจก่อนส่ง

```bash
npm run check:data   # ตรวจข้อมูล: 7 Workstreams, 21 Work Packages, M0–M7, วันที่, ไม่มี dependency วน, กฎธุรกิจ
npm run test:e2e     # Playwright: 390/768/1440px, overflow, M0/M1 ไม่ชนกัน, panel/Esc/focus, hash/Back/Forward, filter
npm run check        # ทั้งหมด
```

`test:e2e` ใช้ Chromium ที่ `/opt/pw-browsers/chromium` (ตั้ง `CHROME_PATH` เพื่อใช้ตัวอื่น) และบันทึกภาพไว้ใน `screenshots/` (ไม่ commit)

## แก้ข้อมูล

ข้อมูลทั้งหมดอยู่ที่ **`src/data/nationPlan.ts`** ที่เดียว (single source of truth): `meta`, `workstreams`, `tasks`,
`milestones`, `relations`, `priorities`, `pilotCandidates`, `decisions`, `sources` และข้อความของแต่ละฉาก

- วันที่เป็น ISO (`YYYY-MM-DD`) และใช้คำนวณตำแหน่งแถบ Gantt โดยตรง ห้ามพิมพ์วันซ้ำใน Component
- `predecessors` = ต้องเสร็จก่อนเริ่ม (finish-to-start); `checkpoints` = จุดตรวจ *ภายใน* แถบ; `relations` = ความสัมพันธ์สนับสนุนระหว่าง Workstream (ไม่ใช่ตัวกำหนดเวลา)
- เมื่อเลือก Pilot แล้ว ให้แก้ `planState.selectedPilotIds` (เริ่มต้น `null` = ยังไม่เลือก)
- ค่าที่ไม่ทราบให้คงเป็น `null` / `unconfirmed` — เว็บจะแสดง "ยังไม่ยืนยัน" หรือ "—" ไม่ใช้ 0
- ข้อความในแผงรายละเอียดประกอบจากข้อมูลใน `src/data/details.ts`
- แก้แล้วรัน `npm run check:data` ทุกครั้ง

## โหมด Present / Edit

ปุ่มมุมขวาบน: **Present** = หน้าสะอาดสำหรับนำเสนอ · **Edit** = หลังบ้าน
- ข้อความที่มีเส้นประ (หัวข้อ, คำอธิบาย, Key, การ์ด, ป้าย, ช่องในแผงรายละเอียด) คลิกเพื่อแก้คำได้ — `Reset to original` คืนคำเดิม
- Owner แก้ได้ที่ Task / Milestone / Workstream (ในแผงรายละเอียด) หรือรวมที่ปุ่ม **Owners · ใครรับผิดชอบอะไร** (ฉาก Workstreams / แถบ Edit): Owner + Support ของ R1–R7, 6A/6B และ Owner ราย Task
- **Backup**: Export (คัดลอก JSON) / Import (ตรวจ documentId ก่อนนำเข้า)
- แถบ Edit ด้านล่าง: สถานะบันทึก · Undo · Save now · Reset all · Done → Present
- คำที่แก้เก็บเป็น `text` overrides ใน `PlanEdits` (key เช่น `timeline.headline`, `d.task.T18.why`)

## แก้ไข Timeline ในหน้าเว็บ

Zoom: ปุ่ม − / + , Overview / Month / Week หรือ Ctrl/⌘ + scroll บนกราฟ · ปรับความสูงกราฟด้วยแถบใต้กราฟ (ดับเบิลคลิกเพื่อคืนค่า) · ⤢ Maximize เต็มจอ (Esc ออก)


กด **Edit** ในฉาก Timeline แล้ว:
- ลากแถบ = ย้ายทั้งงาน · ลากขอบซ้าย/ขวา = ปรับวันเริ่ม/จบ · ลากป้าย ◆ Milestone = ย้าย Gate
- แตะแถบ/Milestone/Workstream เพื่อแก้คำและวันที่ในแผงรายละเอียด · ปุ่ม `+` ในแถว Workstream = เพิ่ม Task
- คีย์บอร์ด: โฟกัสแถบแล้วกด ← → เพื่อเลื่อน 1 วัน, Shift + ← → เพื่อปรับวันจบ
- Undo, Reset รายการ, Reset all · แถบที่แก้แล้วมี ✎ และงานที่เริ่มก่อนงานก่อนหน้าเสร็จมี ⚠
- ชิป **⚠ ตรวจวันที่ N เรื่อง** (`src/lib/validate.ts`): งานเริ่มก่อน predecessor · Gate ก่อนงานที่ป้อนเสร็จ · Gate นอกแถบ · เลย 31 ธ.ค. · หัวข้อ Timeline ไม่ตรงช่วงแผน — แจ้งเตือนเท่านั้น ไม่ย้ายวันเอง, บันทึกเหตุผลได้ต่อรายการ
- Checkpoints ที่เสนอ CP1–CP6 (ผูกกับ Gate เดิม ไม่ใช่ Milestone ใหม่) — CP4/CP5 แสดงเป็นแถบช่วงเวลา ที่เหลือ "รอยืนยันวัน"

การบันทึก (`src/lib/planStore.ts`):
- **บน claude.ai** (artifact ที่ประกาศ capability `artifact`): บันทึกอัตโนมัติ ~4 วินาทีหลังแก้ โดยหน้าเว็บ publish ตัวเองเป็นเวอร์ชันใหม่
  พร้อมฝังการแก้ไขเป็น JSON (`<script id="plan-edits">`) ทุกคนที่เปิดลิงก์จะเห็นเวอร์ชันล่าสุด ผู้ที่ไม่มีสิทธิ์แก้จะเห็นแบบอ่านอย่างเดียว
- **นอก claude.ai** (dev server หรือไฟล์ HTML เดี่ยว): บันทึกใน localStorage ของเบราว์เซอร์นั้นเท่านั้น
- ค่าตั้งต้นใน `nationPlan.ts` ไม่ถูกแก้ — การแก้ไขเป็น layer ที่คืนค่าได้เสมอ

สร้างไฟล์สำหรับ artifact: `npm run build && node scripts/build-artifact.mjs out.html`

## โครงสร้าง

```
src/data/nationPlan.ts      ข้อมูลทั้งหมด
src/data/upgrade26.ts       เนื้อหาหลังประชุม 26 ก.ย. (Connected Org, Nation ID, Focus, Checkpoints, คำถามค้าง)
src/data/details.ts         ประกอบเนื้อหา Detail Panel (ทำอะไร → … → เรื่องรอยืนยัน)
src/lib/                    วันที่ (UTC calendar), dependency graph, hash routing
src/components/             SceneShell, StrategyMap, ValueFlow, PriorityLanes, DependencyMap,
                            InteractiveGantt, DetailPanel, DecisionSummary, AcceptanceScene, Navigation
scripts/checkData.ts        ตรวจความถูกต้องของข้อมูล
scripts/e2e.mjs             ทดสอบการแสดงผลและการโต้ตอบ
```

ลิงก์แชร์ฉากได้ด้วย hash เช่น `#timeline?workstream=R6&milestone=M4`, `#timeline?task=T18`, `#connected-organization`, `#nation-id`

## ข้อควรระวังก่อนแชร์

- หน้าเว็บตั้ง `noindex` และมี `robots.txt` แต่ **noindex ไม่ใช่ระบบควบคุมการเข้าถึง** — ก่อนส่งต่อข้อมูลภายใน ให้วางบน hosting ที่องค์กรอนุมัติและมี access control
- ไม่มี analytics / external tracking / external font / backend
- อย่า deploy แบบ public โดยไม่ได้รับอนุมัติ และอย่าใส่บันทึกประชุมดิบหรือเอกสาร HR ลงใน `public/` หรือ static assets
- ธีมสีเป็นข้อเสนอ ไม่ใช่ Official Nation CI; ไม่มีโลโก้จริง (ใช้คำว่า NATION เป็นตัวอักษร)
