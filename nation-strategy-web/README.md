# NATION — Strategy to Execution

เว็บนำเสนอ (ภาษาไทย, Responsive) ให้ Mac ใช้สรุปทิศทาง Media Tech และเสนอ Roadmap Execution ให้คุณฉาย
**สถานะ: ร่างเพื่อหารือและอนุมัติ · ข้อมูล ณ 23 ก.ย. 2026 · เป็นภาพแผน ไม่ใช่ Live Tracker**

8 ฉาก / 2 บท: ทิศทาง → แผนงาน → คุณค่า → ก่อน–หลัง → งานเชื่อมกัน → Timeline → ตรวจรับ → ขออนุมัติ

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

## แก้ไข Timeline ในหน้าเว็บ

กด **Edit** ในฉาก Timeline แล้ว:
- ลากแถบ = ย้ายทั้งงาน · ลากขอบซ้าย/ขวา = ปรับวันเริ่ม/จบ · ลากป้าย ◆ Milestone = ย้าย Gate
- แตะแถบ/Milestone/Workstream เพื่อแก้คำและวันที่ในแผงรายละเอียด · ปุ่ม `+` ในแถว Workstream = เพิ่ม Task
- คีย์บอร์ด: โฟกัสแถบแล้วกด ← → เพื่อเลื่อน 1 วัน, Shift + ← → เพื่อปรับวันจบ
- Undo, Reset รายการ, Reset all · แถบที่แก้แล้วมี ✎ และงานที่เริ่มก่อนงานก่อนหน้าเสร็จมี ⚠

การบันทึก (`src/lib/planStore.ts`):
- **บน claude.ai** (artifact ที่ประกาศ capability `artifact`): บันทึกอัตโนมัติ ~4 วินาทีหลังแก้ โดยหน้าเว็บ publish ตัวเองเป็นเวอร์ชันใหม่
  พร้อมฝังการแก้ไขเป็น JSON (`<script id="plan-edits">`) ทุกคนที่เปิดลิงก์จะเห็นเวอร์ชันล่าสุด ผู้ที่ไม่มีสิทธิ์แก้จะเห็นแบบอ่านอย่างเดียว
- **นอก claude.ai** (dev server หรือไฟล์ HTML เดี่ยว): บันทึกใน localStorage ของเบราว์เซอร์นั้นเท่านั้น
- ค่าตั้งต้นใน `nationPlan.ts` ไม่ถูกแก้ — การแก้ไขเป็น layer ที่คืนค่าได้เสมอ

สร้างไฟล์สำหรับ artifact: `npm run build && node scripts/build-artifact.mjs out.html`

## โครงสร้าง

```
src/data/nationPlan.ts      ข้อมูลทั้งหมด
src/data/details.ts         ประกอบเนื้อหา Detail Panel (ทำอะไร → … → เรื่องรอยืนยัน)
src/lib/                    วันที่ (UTC calendar), dependency graph, hash routing
src/components/             SceneShell, StrategyMap, ValueFlow, PriorityLanes, DependencyMap,
                            InteractiveGantt, DetailPanel, DecisionSummary, AcceptanceScene, Navigation
scripts/checkData.ts        ตรวจความถูกต้องของข้อมูล
scripts/e2e.mjs             ทดสอบการแสดงผลและการโต้ตอบ
```

ลิงก์แชร์ฉากได้ด้วย hash เช่น `#timeline?workstream=R6&milestone=M4` หรือ `#timeline?task=T18`

## ข้อควรระวังก่อนแชร์

- หน้าเว็บตั้ง `noindex` และมี `robots.txt` แต่ **noindex ไม่ใช่ระบบควบคุมการเข้าถึง** — ก่อนส่งต่อข้อมูลภายใน ให้วางบน hosting ที่องค์กรอนุมัติและมี access control
- ไม่มี analytics / external tracking / external font / backend
- อย่า deploy แบบ public โดยไม่ได้รับอนุมัติ และอย่าใส่บันทึกประชุมดิบหรือเอกสาร HR ลงใน `public/` หรือ static assets
- ธีมสีเป็นข้อเสนอ ไม่ใช่ Official Nation CI; ไม่มีโลโก้จริง (ใช้คำว่า NATION เป็นตัวอักษร)
