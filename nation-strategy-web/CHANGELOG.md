# Changelog

## 2026-09-26 — Export to PDF
- ปุ่ม **PDF** มุมขวาบน + ลิงก์ท้ายหน้า: 10 หน้า = 10 ฉาก (แบบ Present, Timeline แบบ Overview เห็นทุกแถว) · หลัง Export คืนโหมด/ซูมเดิม
- สร้างไฟล์ในเบราว์เซอร์ (html-to-image + PDF writer ในโค้ด) · e2e 119/119

## 2026-09-26 — ปรับตามประชุม 26 ก.ย. 2026

**เนื้อหา**
- ชื่อ: คุณฉาย (Shine) · คุณเส็ง (ไม่มีคุณสิงห์) · ตัดชื่อทีม "โอเวอร์เมท" — ทีม R6 เป็น TBC
- R6 = Commercial Intelligence: **6A Government Agent เริ่มก่อน → 6B Sales Intelligence (ลูกค้าเอกชน) ตามมา**
- Focus: R6 + R5 เริ่มก่อน · R1/R2/R3 คู่ขนาน · R7 Local แยกติดตาม (ไม่ลบ Tasks)
- ฉากใหม่: **Connected Organization** (`#connected-organization`) และ **Nation ID** (`#nation-id`, Story mode + ยังไม่ Login)
- Owner/Support บนการ์ด Workstream และแถว Gantt · Owners board แก้ได้ในโหมด Edit
- 6 Decisions (D1–D6) · Milestone แสดงเงื่อนไขตรวจรับแทน "ไม่มีงานก่อนหน้าบังคับ"
- Checkpoints ที่เสนอ CP1–CP6 ผูกกับ Gate เดิม — ไม่ย้าย M0–M7
- แยกป้ายที่มา: Meeting 26 ก.ย. / Mac Proposal / TBC · คำถามที่บันทึกขัดกันอยู่ใน Sources & Limitations และ D4

**ระบบ**
- ตรวจวันที่ (แจ้งเตือนเท่านั้น ไม่แก้เอง) + บันทึกเหตุผลต่อรายการ
- Storage namespace `nation:nation-strategy-to-execution:edits:v2` · draft ในเครื่องที่ใหม่กว่าจะแสดงก่อนพร้อมแจ้ง
- Export / Import JSON (ตรวจ documentId) · แก้คำพิมพ์ผิด "Agile Inteligence" → ใช้ Agile Intelligence
- มือถือ: แท็บ Gantt | Milestones · ตัวกรองพับใน "ตัวเลือก"
- Tests: check:data ผ่าน · e2e 117/117
