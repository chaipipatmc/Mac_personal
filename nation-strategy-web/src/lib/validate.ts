import { meta, milestones, msById, taskById, tasks, type MilestoneId } from '../data/nationPlan'
import { dayNumber, fmtDate, fmtRange } from './dates'
import { getText, hasText } from './planStore'

export interface DateIssue {
  /** Stable id — acknowledgement notes are stored under `issue.<id>.note`. */
  id: string
  text: string
  ref?: { kind: 'task' | 'milestone'; id: string }
}

const endOf = (id: string) => taskById[id]?.end ?? msById[id as MilestoneId]?.date

/** Warn-only checks. Nothing here moves a date. */
export function dateIssues(): DateIssue[] {
  const out: DateIssue[] = []
  for (const t of tasks) {
    for (const p of t.predecessors) {
      const e = endOf(p)
      if (e && dayNumber(e) >= dayNumber(t.start)) {
        out.push({ id: `pred-${t.id}-${p}`, text: `${t.id} เริ่ม ${fmtDate(t.start, false)} ก่อน ${p} เสร็จ (${fmtDate(e, false)})`, ref: { kind: 'task', id: t.id } })
      }
    }
    for (const c of t.checkpoints) {
      if (!c.milestoneId) continue
      const d = msById[c.milestoneId].date
      if (dayNumber(d) < dayNumber(t.start) || dayNumber(d) > dayNumber(t.end)) {
        out.push({ id: `cp-${t.id}-${c.milestoneId}`, text: `${c.milestoneId} (${fmtDate(d, false)}) อยู่นอกแถบ ${t.id} ${fmtRange(t.start, t.end)}`, ref: { kind: 'task', id: t.id } })
      }
    }
    if (!t.custom && dayNumber(t.end) > dayNumber(meta.timelineEnd)) {
      out.push({ id: `ye-${t.id}`, text: `${t.id} จบ ${fmtDate(t.end, false)} — เลยกรอบ 31 ธ.ค. (ต้องเป็นข้อยกเว้นที่อนุมัติ)`, ref: { kind: 'task', id: t.id } })
    }
  }
  for (const m of milestones) {
    for (const id of m.fedBy) {
      const t = taskById[id]
      if (t && dayNumber(m.date) < dayNumber(t.end)) {
        out.push({ id: `fed-${m.id}-${id}`, text: `${m.id} ${fmtDate(m.date, false)} อยู่ก่อน ${id} เสร็จ (${fmtDate(t.end, false)})`, ref: { kind: 'milestone', id: m.id } })
      }
    }
  }
  if (hasText('timeline.headline')) {
    const h = getText('timeline.headline', '').toLowerCase()
    const th = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const en = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const first = tasks.reduce((a, t) => (t.start < a ? t.start : a), tasks[0].start)
    const last = tasks.reduce((a, t) => (t.end > a ? t.end : a), tasks[0].end)
    const has = (iso: string) => { const i = Number(iso.slice(5, 7)) - 1; return h.includes(th[i]) || h.includes(en[i]) }
    if (!has(first) || !has(last)) {
      out.push({ id: 'headline-range', text: `หัวข้อ Timeline "${getText('timeline.headline', '')}" ไม่ตรงกับช่วงแผน ${fmtRange(first, last)}` })
    }
  }
  return out
}
