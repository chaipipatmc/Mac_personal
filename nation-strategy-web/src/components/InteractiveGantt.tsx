import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../lib/appContext'
import {
  meta, milestones, msById, priorities, tasks, taskById, workstreams, minimumDataMarker, relations,
  type CandidateId, type Milestone, type MilestoneId, type PriorityId, type Task, type WorkstreamId,
} from '../data/nationPlan'
import { dayNumber, fmtDate, fmtRange, isoFromDay, monthShort } from '../lib/dates'
import { relatedTo } from '../lib/graph'
import {
  addTask, getRestoredUi, isEdited, patchMilestone, patchTask, registerUiPart, setDragging,
} from '../lib/planStore'
import { SceneShell } from './SceneShell'
import { proposedCheckpoints } from '../data/upgrade26'
import { dateIssues } from '../lib/validate'
import { E } from './Editable'
import { Icon, WS_ICON } from './Icon'

// Chart domain starts on the Monday before the roadmap; it grows if an edit moves work past 31 Dec.
const DOMAIN_START = dayNumber('2026-09-21')

type Zoom = 'overview' | 'month' | 'week' | 'custom'
const ZOOM_LABEL: Record<Exclude<Zoom, 'custom'>, string> = { overview: 'Overview', month: 'Month', week: 'Week' }
const MIN_PX = 2
const MAX_PX = 64
const H_KEY = 'nation-gantt-height'
type CandFilter = 'all' | CandidateId | 'LOCAL'
type DragKind = 'move' | 'start' | 'end' | 'ms'
interface Drag { id: string; kind: DragKind; x0: number; delta: number; moved: boolean }

const WS_ROW = 62
const TASK_ROW = 52
const CHIP_H = 28
const PHASE_H = 26

let measureCtx: CanvasRenderingContext2D | null = null
/** Measures with the page's real font stack so labels never get clipped. */
function textWidth(s: string, weight = 700) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  if (!measureCtx) return s.length * 8
  measureCtx.font = `${weight} 13px ${getComputedStyle(document.body).fontFamily}`
  return measureCtx.measureText(s).width
}

interface Row { key: string; type: 'ws' | 'task'; ws: WorkstreamId; task?: Task; y: number; h: number }

function isCandidate(t: Task) { return !!t.conditionalOn && t.conditionalOn !== 'LOCAL_APPROVAL' }
function isLocal(t: Task) { return t.conditionalOn === 'LOCAL_APPROVAL' }

function barLabel(t: Task) {
  if (isCandidate(t)) return `${t.title} · Candidate (เลือกที่ M2)`
  if (isLocal(t)) return `${t.title} · Start TBC`
  return t.title
}

const shiftIso = (iso: string, days: number) => isoFromDay(dayNumber(iso) + days)

/** Predecessors that finish on/after this task's start (possible after a drag). */
function conflicts(t: Task): string[] {
  return t.predecessors.filter((p) => {
    const end = taskById[p]?.end ?? msById[p as MilestoneId]?.date
    return end && dayNumber(end) >= dayNumber(t.start)
  })
}

function tipFor(t: Task, editing: boolean) {
  const lines = [`${t.id} ${t.title}`, `${fmtRange(t.start, t.end)} · ${isEdited(t.id) ? 'แก้ไขแล้ว' : 'วันที่เสนอ'}`]
  const c = conflicts(t)
  if (c.length) lines.push(`⚠ เริ่มก่อน ${c.join(', ')} เสร็จ`)
  else if (isCandidate(t)) lines.push(`Candidate ${t.conditionalOn} — เลือกที่ M2`)
  else if (isLocal(t)) lines.push('อนุมัติแยก · Start TBC')
  else lines.push(t.note.length > 60 ? `${t.note.slice(0, 58)}…` : t.note)
  lines.push(editing ? 'ลากเพื่อย้าย · ลากขอบเพื่อปรับวัน' : 'แตะ/คลิกเพื่อดู Details')
  return lines
}
function msTip(m: Milestone, editing: boolean) {
  return [`${m.id} ${m.label}`, `${fmtDate(m.date)} · ${isEdited(m.id) ? 'แก้ไขแล้ว' : m.dateBasis === 'proposed' ? 'วันที่เสนอ' : m.dateBasis === 'meeting_date' ? 'วันที่ในบันทึก' : 'กรอบสิ้นปีจากประชุม'}`, 'Status: TBC', editing ? 'ลากซ้าย–ขวาเพื่อย้ายวัน' : 'แตะ/คลิกเพื่อดู Details']
}

export function InteractiveGantt() {
  const { select, selection, timelineFocus, close, planVersion, editMode } = useApp()
  const restored = useMemo(() => getRestoredUi<{ zoom?: Zoom; px?: number; expanded?: WorkstreamId[]; left?: number; top?: number; maxed?: boolean }>('gantt'), [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewW, setViewW] = useState(1000)
  const [zoom, setZoom] = useState<Zoom>(() => restored?.zoom ?? (window.innerWidth < 760 ? 'month' : 'overview'))
  const [expanded, setExpanded] = useState<Set<WorkstreamId>>(() => new Set(restored?.expanded ?? []))
  const [wsFilter, setWsFilter] = useState<'all' | WorkstreamId>('all')
  const [prioFilter, setPrioFilter] = useState<'all' | PriorityId>('all')
  const [candFilter, setCandFilter] = useState<CandFilter>('all')
  const [tip, setTip] = useState<{ lines: string[]; x: number; y: number } | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [customPx, setCustomPx] = useState<number>(() => restored?.px ?? 10)
  const [maxed, setMaxed] = useState<boolean>(() => !!restored?.maxed)
  const [mTab, setMTab] = useState<'gantt' | 'ms'>('gantt')
  const [optsOpen, setOptsOpen] = useState(false)
  const [chartH, setChartH] = useState<number | null>(() => {
    try { const v = Number(localStorage.getItem(H_KEY)); return v >= 200 ? v : null } catch { return null }
  })
  const suppressClick = useRef(false)

  const narrow = viewW < 640
  const labelW = narrow ? 128 : 236

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewW(el.clientWidth))
    ro.observe(el)
    setViewW(el.clientWidth)
    if (restored?.left !== undefined) requestAnimationFrame(() => el.scrollTo({ left: restored.left, top: restored.top ?? 0 }))
    return () => ro.disconnect()
  }, [restored])

  // Survive the reload a save triggers.
  const uiRef = useRef({ zoom, expanded, customPx, maxed })
  uiRef.current = { zoom, expanded, customPx, maxed }
  useEffect(() => registerUiPart('gantt', () => ({
    zoom: uiRef.current.zoom, px: uiRef.current.customPx, maxed: uiRef.current.maxed, expanded: [...uiRef.current.expanded],
    left: scrollRef.current?.scrollLeft ?? 0, top: scrollRef.current?.scrollTop ?? 0,
  })), [])

  // ---- live dates (with an in-progress drag applied) -----------------------
  const liveTask = (t: Task): Task => {
    if (!drag || drag.id !== t.id || !drag.delta) return t
    if (drag.kind === 'move') return { ...t, start: shiftIso(t.start, drag.delta), end: shiftIso(t.end, drag.delta) }
    if (drag.kind === 'start') { const s = shiftIso(t.start, drag.delta); return { ...t, start: s > t.end ? t.end : s } }
    if (drag.kind === 'end') { const e = shiftIso(t.end, drag.delta); return { ...t, end: e < t.start ? t.start : e } }
    return t
  }
  const liveMs = (m: Milestone): Milestone => (drag && drag.kind === 'ms' && drag.id === m.id && drag.delta ? { ...m, date: shiftIso(m.date, drag.delta) } : m)

  const lastDay = Math.max(dayNumber(meta.timelineEnd), ...tasks.map((t) => dayNumber(liveTask(t).end)), ...milestones.map((m) => dayNumber(liveMs(m).date)))
  const DOMAIN_END = lastDay + 1
  const DAYS = DOMAIN_END - DOMAIN_START

  const fitPx = Math.max(MIN_PX, (viewW - labelW - 4) / DAYS)
  const pxPerDay = zoom === 'overview' ? fitPx : zoom === 'month' ? 10 : zoom === 'week' ? 26 : customPx
  const chartW = Math.round(DAYS * pxPerDay)
  const xOf = (iso: string) => (dayNumber(iso) - DOMAIN_START) * pxPerDay
  /** Center of a calendar day (used for milestones). */
  const xMid = (iso: string) => xOf(iso) + pxPerDay / 2

  // ---- zoom in/out (buttons, Ctrl/⌘ + wheel) keeps the point under focus in place
  const pxRef = useRef(pxPerDay)
  pxRef.current = pxPerDay
  const zoomBy = (factor: number, anchorClientX?: number) => {
    const el = scrollRef.current
    const cur = pxRef.current
    const next = Math.min(MAX_PX, Math.max(MIN_PX, cur * factor))
    if (!el || next === cur) return
    const rect = el.getBoundingClientRect()
    const ax = anchorClientX !== undefined ? anchorClientX - rect.left - labelW : (el.clientWidth - labelW) / 2
    const day = (el.scrollLeft + Math.max(0, ax)) / cur
    setCustomPx(next); setZoom('custom')
    requestAnimationFrame(() => el.scrollTo({ left: Math.max(0, day * next - Math.max(0, ax)) }))
  }
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labelW])

  // ---- resizable / maximisable chart window
  const startResize = (e: React.PointerEvent<HTMLElement>) => {
    const el = scrollRef.current
    if (!el) return
    e.preventDefault()
    const y0 = e.clientY
    const h0 = el.getBoundingClientRect().height
    const target = e.currentTarget
    target.setPointerCapture?.(e.pointerId)
    const move = (ev: PointerEvent) => setChartH(Math.round(Math.min(window.innerHeight * 2, Math.max(200, h0 + ev.clientY - y0))))
    const up = () => {
      target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', up); target.removeEventListener('pointercancel', up)
      try { localStorage.setItem(H_KEY, String(Math.round(scrollRef.current?.getBoundingClientRect().height ?? 0))) } catch { /* optional */ }
    }
    target.addEventListener('pointermove', move); target.addEventListener('pointerup', up); target.addEventListener('pointercancel', up)
  }
  const nudgeHeight = (d: number) => {
    const h = Math.round(Math.max(200, (scrollRef.current?.getBoundingClientRect().height ?? 400) + d))
    setChartH(h)
    try { localStorage.setItem(H_KEY, String(h)) } catch { /* optional */ }
  }
  useEffect(() => {
    if (!maxed) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.panel, .text-editor')) setMaxed(false) }
    window.addEventListener('keydown', onKey)
    document.body.classList.add('gantt-maxed')
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('gantt-maxed') }
  }, [maxed])

  // ---- filters -------------------------------------------------------------
  const filterActive = wsFilter !== 'all' || prioFilter !== 'all' || candFilter !== 'all'
  // Recomputed every render (cheap); planVersion re-renders this scene after edits.
  const issueCount = dateIssues().length
  const taskMatches = (t: Task) =>
    (wsFilter === 'all' || t.workstreamId === wsFilter) &&
    (prioFilter === 'all' || t.priority === prioFilter) &&
    (candFilter === 'all' || (candFilter === 'LOCAL' ? isLocal(t) : t.conditionalOn === candFilter))

  const rows: Row[] = useMemo(() => {
    const out: Row[] = []
    let y = 0
    for (const w of workstreams) {
      const ts = tasks.filter((t) => t.workstreamId === w.id && taskMatches(t))
      if (filterActive && ts.length === 0) continue
      out.push({ key: w.id, type: 'ws', ws: w.id, y, h: WS_ROW }); y += WS_ROW
      if (expanded.has(w.id) || filterActive) {
        for (const t of ts) { out.push({ key: t.id, type: 'task', ws: w.id, task: t, y, h: TASK_ROW }); y += TASK_ROW }
      }
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, wsFilter, prioFilter, candFilter, planVersion])
  const bodyH = rows.reduce((s, r) => s + r.h, 0)
  const isExpanded = (ws: WorkstreamId) => rows.some((r) => r.type === 'task' && r.ws === ws)

  // ---- highlight -----------------------------------------------------------
  const selId = selection && (selection.kind === 'task' || selection.kind === 'milestone' || selection.kind === 'workstream') ? selection.id : null
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rel = useMemo(() => relatedTo(selId), [selId, planVersion])
  const hasFocus = !!selId
  const lit = (id: string) => !hasFocus || rel.items.has(id)
  const selectedWs = selection?.kind === 'workstream' ? (selection.id as WorkstreamId) : null
  const supportWs = new Set<WorkstreamId>(selectedWs ? relations.filter((r) => r.from === selectedWs || r.to === selectedWs).map((r) => (r.from === selectedWs ? r.to : r.from)) : [])

  const visibleWs = new Set(rows.filter((r) => r.type === 'ws').map((r) => r.ws))
  const hiddenRelated = [...rel.items].filter((id) => taskById[id] && !visibleWs.has(taskById[id].workstreamId))

  // ---- focus from hash / "ดูใน Timeline" -----------------------------------
  const focusKey = JSON.stringify(timelineFocus)
  useEffect(() => {
    const ws = timelineFocus.task ? taskById[timelineFocus.task]?.workstreamId : timelineFocus.workstream
    if (ws) setExpanded((prev) => (prev.has(ws) ? prev : new Set(prev).add(ws)))
    if (ws && wsFilter !== 'all' && wsFilter !== ws) setWsFilter('all')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !Object.keys(timelineFocus).length) return
    const id = requestAnimationFrame(() => {
      let x: number | null = null
      let rowKey: string | null = null
      if (timelineFocus.task && taskById[timelineFocus.task]) { x = xOf(taskById[timelineFocus.task].start); rowKey = timelineFocus.task }
      else if (timelineFocus.milestone) x = xMid(msById[timelineFocus.milestone].date)
      if (timelineFocus.workstream && !rowKey) rowKey = timelineFocus.workstream
      if (x !== null && (x < el.scrollLeft || x > el.scrollLeft + el.clientWidth - labelW - 40)) {
        el.scrollTo({ left: Math.max(0, x - 40), behavior: 'auto' })
      }
      if (rowKey) {
        const r = rows.find((rr) => rr.key === rowKey)
        if (r) {
          const headerH = el.querySelector<HTMLElement>('.g-header')?.offsetHeight ?? 0
          if (r.y < el.scrollTop || r.y + r.h > el.scrollTop + el.clientHeight - headerH) el.scrollTo({ top: Math.max(0, r.y - 8), behavior: 'auto' })
        }
      }
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey, rows.length, zoom])

  // ---- scale ---------------------------------------------------------------
  const monthCells = useMemo(() => {
    const cells: { label: string; x: number; w: number; iso: string }[] = []
    let d = DOMAIN_START
    while (d < DOMAIN_END) {
      const iso = isoFromDay(d)
      const [y, m] = iso.split('-').map(Number)
      const next = Math.min(DOMAIN_END, dayNumber(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`))
      cells.push({ label: `${monthShort(m)} ${y}`, x: (d - DOMAIN_START) * pxPerDay, w: (next - d) * pxPerDay, iso })
      d = next
    }
    return cells
  }, [pxPerDay, DOMAIN_END])
  const weekCells = useMemo(() => {
    const cells: { label: string; x: number; iso: string }[] = []
    for (let d = DOMAIN_START; d < DOMAIN_END; d += 7) {
      const iso = isoFromDay(d)
      cells.push({ label: String(Number(iso.slice(8))), x: (d - DOMAIN_START) * pxPerDay, iso })
    }
    return cells
  }, [pxPerDay, DOMAIN_END])
  const showWeekLabels = pxPerDay * 7 >= 22

  // Phases between the gates — they follow the milestone dates, edits included.
  const liveMilestones = milestones.map(liveMs)
  const md = (id: MilestoneId) => liveMilestones.find((m) => m.id === id)!.date
  const phases = [
    { key: 'prep', label: 'Prep', from: meta.timelineStart, to: md('M2') },
    { key: 'design', label: 'Design', from: shiftIso(md('M2'), 1), to: md('M3') },
    { key: 'build', label: 'Build & Test', from: shiftIso(md('M3'), 1), to: md('M4') },
    { key: 'ready', label: 'Go-live Prep', from: shiftIso(md('M4'), 1), to: md('M5') },
    { key: 'measure', label: 'Measure', from: shiftIso(md('M5'), 1), to: md('M6') },
    { key: 'close', label: 'Close', from: shiftIso(md('M6'), 1), to: md('M7') },
  ].filter((p) => p.to >= p.from)

  const today = isoFromDay(Math.floor(Date.now() / 86_400_000))
  const todayIn = dayNumber(today) >= DOMAIN_START && dayNumber(today) < DOMAIN_END

  // ---- milestone label placement (no overlapping hit targets) --------------
  const chips = (() => {
    const gap = 4
    const MAX_LEVELS = 4
    const lastRight: number[] = []
    const placed = liveMilestones.map((m) => {
      const x = xMid(m.date)
      const text = narrow || pxPerDay < 6 ? m.id : `${m.id} ${m.label}`
      const w = Math.ceil(textWidth(text)) + 22
      let left = Math.min(Math.max(2, x - w / 2), chartW - w - 2)
      let level = 0
      while (level < MAX_LEVELS && left < (lastRight[level] ?? -Infinity) + gap) level++
      if (level === MAX_LEVELS) {
        level = lastRight.indexOf(Math.min(...lastRight))
        left = Math.min(lastRight[level] + gap, chartW - w - 2)
      }
      lastRight[level] = left + w
      return { m, x, left, w, level, text }
    })
    const levels = Math.max(2, lastRight.length)
    return placed.map((c) => ({ ...c, lane: levels - 1 - c.level, levels }))
  })()
  const MS_HEADER = chips[0].levels * CHIP_H + 22

  // ---- geometry for edges --------------------------------------------------
  const rowOfTask = (id: string) => rows.find((r) => r.key === id) ?? rows.find((r) => r.type === 'ws' && r.ws === taskById[id]?.workstreamId)
  const edges = rel.edges
    .filter((e) => taskById[e.from] && taskById[e.to])
    .map((e) => {
      const a = rowOfTask(e.from); const b = rowOfTask(e.to)
      if (!a || !b) return null
      const x1 = xOf(liveTask(taskById[e.from]).end) + pxPerDay; const y1 = a.y + a.h / 2
      const x2 = xOf(liveTask(taskById[e.to]).start); const y2 = b.y + b.h / 2
      const d = y1 === y2
        ? `M${x1} ${y1 - 8} C${x1 + 10} ${y1 - 24}, ${x2 - 10} ${y2 - 24}, ${x2} ${y2 - 8}`
        : `M${x1} ${y1} C${x1 + 24} ${y1}, ${x2 - 24} ${y2}, ${x2} ${y2}`
      return { key: `${e.from}-${e.to}`, d }
    })
    .filter(Boolean) as { key: string; d: string }[]
  const supportEdges = selectedWs
    ? [...supportWs].map((other) => {
      const a = rows.find((r) => r.type === 'ws' && r.ws === selectedWs)
      const b = rows.find((r) => r.type === 'ws' && r.ws === other)
      if (!a || !b) return null
      const y1 = a.y + a.h / 2; const y2 = b.y + b.h / 2
      return { key: other, d: `M6 ${y1} C${46} ${y1}, ${46} ${y2}, 6 ${y2}` }
    }).filter(Boolean) as { key: string; d: string }[]
    : []

  // ---- tooltip -------------------------------------------------------------
  const tipShownAt = useRef(0)
  const showTip = (lines: string[], el: HTMLElement) => {
    tipShownAt.current = Date.now()
    const r = el.getBoundingClientRect()
    setTip({ lines, x: Math.min(r.left + 8, window.innerWidth - 280), y: r.bottom + 6 })
  }
  const tipProps = (lines: () => string[]) => ({
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => { if (e.pointerType === 'mouse' && !drag) showTip(lines(), e.currentTarget) },
    onPointerLeave: () => { if (!drag) setTip(null) },
    onFocus: (e: React.FocusEvent<HTMLElement>) => { if (e.currentTarget.matches(':focus-visible')) showTip(lines(), e.currentTarget) },
    onBlur: () => setTip(null),
  })
  useEffect(() => {
    const hide = () => { if (Date.now() - tipShownAt.current > 250) setTip(null) }
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [])

  // ---- drag to edit --------------------------------------------------------
  const startDrag = (e: React.PointerEvent<HTMLElement>, id: string, kind: DragKind) => {
    if (!editMode || e.button !== 0) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
    setDrag({ id, kind, x0: e.clientX, delta: 0, moved: false })
  }
  const onDragMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!drag) return
    const dx = e.clientX - drag.x0
    const delta = Math.round(dx / pxPerDay)
    const moved = drag.moved || Math.abs(dx) > 4
    if (delta !== drag.delta || moved !== drag.moved) {
      setDrag({ ...drag, delta, moved })
      const label = drag.kind === 'ms'
        ? (() => { const m = liveMs(msById[drag.id as MilestoneId]); return [`${m.id} → ${fmtDate(shiftIso(msById[drag.id as MilestoneId].date, delta))}`] })()
        : (() => { const t = liveTask({ ...taskById[drag.id] }); return [`${drag.id} → ${fmtRange(t.start, t.end)}`] })()
      setTip({ lines: [...label, 'ปล่อยเมาส์เพื่อบันทึก'], x: Math.min(e.clientX + 12, window.innerWidth - 280), y: e.clientY + 18 })
    }
  }
  const endDrag = () => {
    if (!drag) return
    if (drag.moved) suppressClick.current = true
    if (drag.delta) {
      if (drag.kind === 'ms') patchMilestone(drag.id as MilestoneId, { date: shiftIso(msById[drag.id as MilestoneId].date, drag.delta) })
      else {
        const t = liveTask(taskById[drag.id])
        patchTask(drag.id, { start: t.start, end: t.end })
      }
    }
    setDrag(null)
    setTip(null)
    setDragging(false)
  }
  const dragProps = {
    onPointerMove: onDragMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  }
  const onBarKey = (e: React.KeyboardEvent, t: Task) => {
    if (!editMode || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault(); e.stopPropagation()
    const d = e.key === 'ArrowRight' ? 1 : -1
    if (e.shiftKey) { const end = shiftIso(t.end, d); if (end >= t.start) patchTask(t.id, { end }) }
    else patchTask(t.id, { start: shiftIso(t.start, d), end: shiftIso(t.end, d) })
  }
  const clickGuard = (fn: (el: HTMLElement) => void) => (e: React.MouseEvent<HTMLElement>) => {
    if (suppressClick.current) { suppressClick.current = false; return }
    fn(e.currentTarget)
  }

  const toggle = (ws: WorkstreamId) => setExpanded((prev) => {
    const n = new Set(prev)
    if (n.has(ws)) n.delete(ws); else n.add(ws)
    return n
  })
  const allExpanded = workstreams.every((w) => expanded.has(w.id))
  const jumpTo = (iso: string) => scrollRef.current?.scrollTo({ left: Math.max(0, xOf(iso) - 8), behavior: 'smooth' })
  const clearFilters = () => { setWsFilter('all'); setPrioFilter('all'); setCandFilter('all') }
  const onAdd = (ws: WorkstreamId) => {
    const start = todayIn && today >= meta.timelineStart ? today : meta.timelineStart
    const id = addTask(ws, start, shiftIso(start, 13))
    setExpanded((prev) => new Set(prev).add(ws))
    select({ kind: 'task', id }, null)
  }

  const renderBar = (raw: Task, inSummary: boolean): ReactNode => {
    const t = liveTask(raw)
    const left = xOf(t.start)
    const width = xOf(t.end) + pxPerDay - left
    const full = `${t.id} ${barLabel(t)}`
    const short = `${inSummary ? '' : `${t.id} `}${t.short ?? t.title}`
    const label = !inSummary && textWidth(full, 600) + 16 < width ? full : short
    const fits = textWidth(label, 600) + 16 < width
    const warn = conflicts(t)
    const edited = isEdited(t.id)
    const cls = [
      'bar', `bar-${t.priority.toLowerCase()}`,
      isCandidate(t) ? 'bar-cand' : '', isLocal(t) ? 'bar-local' : '', t.custom ? 'bar-custom' : '',
      inSummary ? 'bar-sum' : '',
      !taskMatches(t) && filterActive ? 'bar-filtered' : '',
      hasFocus ? (lit(t.id) ? 'is-lit' : 'is-dim') : '',
      selection?.kind === 'task' && selection.id === t.id ? 'is-selected' : '',
      editMode ? 'is-editable' : '', drag?.id === t.id ? 'is-dragging' : '', warn.length ? 'has-warn' : '',
    ].filter(Boolean).join(' ')
    return (
      <button
        key={t.id}
        type="button"
        className={cls}
        style={{ left, width }}
        aria-label={`${t.id} ${barLabel(t)}, ${fmtRange(t.start, t.end)}, ${edited ? 'แก้ไขแล้ว' : 'วันที่เสนอ'}${warn.length ? `, เริ่มก่อน ${warn.join(' ')} เสร็จ` : ''}${editMode ? ', ใช้ลูกศรซ้ายขวาเพื่อเลื่อน' : ''}`}
        aria-haspopup="dialog"
        onClick={clickGuard((el) => { setTip(null); select({ kind: 'task', id: t.id }, el) })}
        onPointerDown={(e) => startDrag(e, t.id, 'move')}
        onKeyDown={(e) => onBarKey(e, raw)}
        {...dragProps}
        {...tipProps(() => tipFor(liveTask(taskById[t.id] ?? t), editMode))}
      >
        {editMode && !inSummary && <span className="grip grip-start" aria-hidden="true" onPointerDown={(e) => startDrag(e, t.id, 'start')} />}
        {!inSummary && t.checkpoints.map((c, i) => {
          const iso = c.milestoneId ? msById[c.milestoneId].date : c.date!
          const cx = xOf(iso) + pxPerDay / 2 - left
          if (cx <= 2 || cx >= width - 1) return null
          return <span key={i} className={`cp${c.date ? ' cp-marker' : ''}`} style={{ left: cx }} aria-hidden="true" />
        })}
        {(fits || !inSummary) && <span className={`bar-text${fits ? '' : ' bar-text-out'}`}>{warn.length ? '⚠ ' : ''}{label}{edited ? ' ✎' : ''}</span>}
        {editMode && !inSummary && <span className="grip grip-end" aria-hidden="true" onPointerDown={(e) => startDrag(e, t.id, 'end')} />}
      </button>
    )
  }

  return (
    <SceneShell
      id="timeline"
      wide
      headline="Timeline ก.ย.–ธ.ค. 2026"
      badges={['proposal', 'meeting']}
      intro={<p className="plan-warning"><strong><E k="timeline.warning" v="Plan — ไม่ใช่ Progress จริง" label="Warning" /></strong> · <E k="timeline.intro" v="แตะแถบหรือ ◆ เพื่อดู Details · โหมด Edit ลากปรับได้" label="Intro" /></p>}
      takeaway="ทุก Gate มี Deliverable + เงื่อนไข — ไม่ใช่แค่ถึงวันที่"
    >
      <div className={`gantt${editMode ? ' is-edit' : ''}${maxed ? ' is-max' : ''} tab-${mTab}`}>
        {editMode && <p className="gantt-edit-hint" role="note"><Icon name="review" size={16} />ลากแถบ = ย้าย · ลากขอบ = ปรับวัน · ลาก ◆ = ย้าย Gate · ปุ่ม + = เพิ่ม Task · แตะแถบเพื่อแก้คำ/Owner</p>}

        <div className="gantt-toolbar" role="toolbar" aria-label="ควบคุม Timeline">
          <div className="tb-group" role="group" aria-label="ซูม">
            <span className="tb-label">Zoom</span>
            <button type="button" className="seg seg-icon" onClick={() => zoomBy(1 / 1.4)} aria-label="Zoom out" disabled={pxPerDay <= MIN_PX}>−</button>
            <button type="button" className="seg seg-icon" onClick={() => zoomBy(1.4)} aria-label="Zoom in" disabled={pxPerDay >= MAX_PX}>+</button>
            {(Object.keys(ZOOM_LABEL) as Exclude<Zoom, 'custom'>[]).map((z) => (
              <button key={z} type="button" className="seg" aria-pressed={zoom === z} onClick={() => setZoom(z)}>{ZOOM_LABEL[z]}</button>
            ))}
            <span className="zoom-read" aria-live="polite">{Math.round(pxPerDay * 7)} px/สัปดาห์</span>
          </div>
          <div className="tb-group" role="group" aria-label="ไปยังเดือน">
            <span className="tb-label">Jump</span>
            {['2026-09-21', '2026-10-01', '2026-11-01', '2026-12-01'].map((iso) => (
              <button key={iso} type="button" className="seg" onClick={() => jumpTo(iso)}>{monthShort(Number(iso.slice(5, 7)))}</button>
            ))}
          </div>
          <button type="button" className="seg tb-opts" aria-expanded={optsOpen} onClick={() => setOptsOpen((o) => !o)}>⚙ ตัวเลือก {optsOpen ? '▴' : '▾'}</button>
          <div className={`tb-group tb-filters${optsOpen ? ' is-open' : ''}`}>
            <label>
              <span className="tb-label">Workstream</span>
              <select value={wsFilter} onChange={(e) => setWsFilter(e.target.value as 'all' | WorkstreamId)}>
                <option value="all">All</option>
                {workstreams.map((w) => <option key={w.id} value={w.id}>{w.id} {w.shortTitle}</option>)}
              </select>
            </label>
            <label>
              <span className="tb-label">Priority</span>
              <select value={prioFilter} onChange={(e) => setPrioFilter(e.target.value as 'all' | PriorityId)}>
                <option value="all">All</option>
                {priorities.filter((p) => p.id !== 'P3').map((p) => <option key={p.id} value={p.id}>{p.id} {p.label}</option>)}
              </select>
            </label>
            <label>
              <span className="tb-label">Candidate</span>
              <select value={candFilter} onChange={(e) => setCandFilter(e.target.value as CandFilter)}>
                <option value="all">All</option>
                <option value="C1">C1 AI Support</option>
                <option value="C2">C2 Government</option>
                <option value="C3">C3 Content</option>
                <option value="C4">C4 Community</option>
                <option value="LOCAL">Local (separate approval)</option>
              </select>
            </label>
          </div>
          <div className="tb-group">
            <button type="button" className="seg" onClick={() => setExpanded(allExpanded ? new Set() : new Set(workstreams.map((w) => w.id)))} disabled={filterActive}>
              {allExpanded ? 'Collapse' : `Expand ${tasks.length} Tasks`}
            </button>
            {filterActive && <button type="button" className="seg" onClick={clearFilters}>Clear Filters</button>}
            {hasFocus && <button type="button" className="seg" onClick={close}>Clear Selection</button>}
            <button type="button" className="seg" aria-pressed={maxed} onClick={() => setMaxed(!maxed)}>{maxed ? '⤡ Exit full view' : '⤢ Maximize'}</button>
          </div>
        </div>

        <div className="cp-strip" aria-label="Checkpoints ที่เสนอ">
          <button type="button" className={`issue-chip${issueCount ? ' has-issues' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'issues', id: 'dates' }, e.currentTarget)}>
            {issueCount ? `⚠ ตรวจวันที่ ${issueCount} เรื่อง` : '✓ วันที่ไม่ขัดกัน'}
          </button>
          <span className="cp-strip-h">Checkpoints ที่เสนอ</span>
          {proposedCheckpoints.map((c) => (
            <button key={c.id} type="button" className={`cp-chip${c.targetWindow ? ' has-window' : ''}${selection?.kind === 'cp26' && selection.id === c.id ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'cp26', id: c.id }, e.currentTarget)}>
              <strong>{c.id}</strong> {c.label}
              <span className="cp-when">{c.targetWindow ? fmtRange(c.targetWindow.from, c.targetWindow.to) : 'รอยืนยันวัน'}</span>
            </button>
          ))}
        </div>

        <div className="m-tabs" role="tablist" aria-label="มุมมอง">
          <button type="button" role="tab" aria-selected={mTab === 'gantt'} onClick={() => setMTab('gantt')}>Gantt</button>
          <button type="button" role="tab" aria-selected={mTab === 'ms'} onClick={() => setMTab('ms')}>Milestones</button>
        </div>

        {(filterActive || hiddenRelated.length > 0) && (
          <div className="filter-note" role="status">
            {filterActive && <span>ตัวกรองกำลังซ่อนบางแถว — งานก่อนหน้าข้ามฝ่ายยังเปิดอ่านได้จากแผงรายละเอียด</span>}
            {hiddenRelated.length > 0 && (
              <span className="hidden-rel">
                งานเกี่ยวข้องที่ถูกซ่อน:
                {hiddenRelated.map((id) => (
                  <button key={id} type="button" className="chip-link" onClick={(e) => select({ kind: 'task', id }, e.currentTarget)}>{id} {taskById[id].title}</button>
                ))}
              </span>
            )}
          </div>
        )}

        <div className="gantt-layout">
          <div
            className={`gantt-scroll${hasFocus ? ' has-focus' : ''}${drag ? ' is-dragging' : ''}`}
            ref={scrollRef}
            tabIndex={0}
            aria-label="แผนภูมิ Gantt — เลื่อนแนวนอนเพื่อดูช่วงเวลา · Ctrl/⌘ + scroll เพื่อซูม"
            style={{ ['--label-w' as string]: `${labelW}px`, ...(chartH && !maxed ? { height: chartH, maxHeight: 'none' } : {}) }}
          >
            <div className="g-inner" style={{ width: labelW + chartW }}>
              <div className="g-header">
                <div className="g-corner" style={{ width: labelW }}>
                  <span>Workstream</span>
                  <span className="muted">as of {fmtDate(meta.dataAsOf, false)}</span>
                </div>
                <div className="g-scale" style={{ width: chartW }}>
                  <div className="g-months">
                    {monthCells.map((c, i) => <div key={c.iso} className={`g-month${i % 2 ? ' alt' : ''}`} style={{ left: c.x, width: c.w }}><span>{c.w > 70 ? c.label : c.label.split(' ')[0]}</span></div>)}
                  </div>
                  <div className="g-weeks">
                    {weekCells.map((c) => <div key={c.iso} className="g-week" style={{ left: c.x, width: pxPerDay * 7 }}>{showWeekLabels && <span>{c.label}</span>}</div>)}
                    {todayIn && <span className="today-tag" style={{ left: xMid(today) }}>Today</span>}
                  </div>
                  <div className="g-phases" style={{ height: PHASE_H }} aria-label="Phases">
                    {phases.map((p, i) => {
                      const l = xOf(p.from); const w = xOf(p.to) + pxPerDay - l
                      return (
                        <span key={p.key} className={`phase phase-${i}`} style={{ left: l, width: w }} title={`${p.label}: ${fmtRange(p.from, p.to)}`}>
                          {textWidth(p.label, 700) + 12 < w ? p.label : ''}
                        </span>
                      )
                    })}
                  </div>
                  <div className="g-ms" style={{ height: MS_HEADER }}>
                    <svg className="g-ms-leaders" width={chartW} height={MS_HEADER} aria-hidden="true">
                      {chips.map((c) => {
                        const cy = c.lane * CHIP_H + CHIP_H - 2
                        const cx = Math.min(Math.max(c.x, c.left + 6), c.left + c.w - 6)
                        return <line key={c.m.id} x1={cx} y1={cy} x2={c.x} y2={MS_HEADER - 12} />
                      })}
                    </svg>
                    {chips.map((c) => (
                      <button
                        key={c.m.id}
                        type="button"
                        className={`ms-chip${hasFocus ? (lit(c.m.id) ? ' is-lit' : ' is-dim') : ''}${selection?.kind === 'milestone' && selection.id === c.m.id ? ' is-selected' : ''}${c.m.dateBasis !== 'proposed' ? ' ms-meeting' : ''}${editMode ? ' is-editable' : ''}${isEdited(c.m.id) ? ' is-edited' : ''}`}
                        style={{ left: c.left, top: c.lane * CHIP_H, width: c.w }}
                        aria-label={`${c.m.id} ${c.m.label}, ${fmtDate(c.m.date)}, สถานะจริงยังไม่ยืนยัน`}
                        aria-haspopup="dialog"
                        onClick={clickGuard((el) => { setTip(null); select({ kind: 'milestone', id: c.m.id }, el) })}
                        onPointerDown={(e) => startDrag(e, c.m.id, 'ms')}
                        {...dragProps}
                        {...tipProps(() => msTip(liveMs(msById[c.m.id]), editMode))}
                      >{c.text}</button>
                    ))}
                    {liveMilestones.map((m) => (
                      <span key={m.id} className={`ms-diamond${m.dateBasis !== 'proposed' ? ' ms-meeting' : ''}${hasFocus ? (lit(m.id) ? ' is-lit' : ' is-dim') : ''}`} style={{ left: xMid(m.date) }} aria-hidden="true" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="g-body" style={{ height: bodyH }}>
                <div className="g-under" style={{ left: labelW, width: chartW, height: bodyH }} aria-hidden="true">
                  {monthCells.map((c, i) => i % 2 ? <span key={`b${c.iso}`} className="g-month-band" style={{ left: c.x, width: c.w }} /> : null)}
                  {weekCells.map((c) => <span key={c.iso} className="g-vline" style={{ left: c.x }} />)}
                  {monthCells.map((c) => <span key={c.iso} className="g-vline g-vline-month" style={{ left: c.x }} />)}
                  {liveMilestones.map((m) => (
                    <span key={m.id} className={`g-msline${hasFocus ? (lit(m.id) ? ' is-lit' : ' is-dim') : ''}`} style={{ left: xMid(m.date) }} />
                  ))}
                  <span className="g-marker-line" style={{ left: xMid(minimumDataMarker.date) }} />
                  {proposedCheckpoints.filter((c) => c.targetWindow).map((c) => {
                    const l = xOf(c.targetWindow!.from); const w = xOf(c.targetWindow!.to) + pxPerDay - l
                    return <span key={c.id} className="cp-band" style={{ left: l, width: w }}><span className="cp-band-label">{c.id}</span></span>
                  })}
                  {todayIn && <span className="g-today" style={{ left: xMid(today) }} />}
                </div>

                {rows.map((r, ri) => {
                  const w = workstreams.find((x) => x.id === r.ws)!
                  if (r.type === 'ws') {
                    const ts = tasks.filter((t) => t.workstreamId === r.ws)
                    const exp = isExpanded(r.ws)
                    const wsLit = !hasFocus || rel.items.has(r.ws) || ts.some((t) => rel.items.has(t.id)) || selectedWs === r.ws
                    return (
                      <div key={r.key} className={`g-row g-row-ws${wsLit ? '' : ' row-dim'}${selectedWs === r.ws ? ' row-selected' : ''}`} style={{ top: r.y, height: r.h }}>
                        <div className="g-label" style={{ width: labelW }}>
                          <button type="button" className="g-toggle" aria-expanded={exp} aria-label={`${exp ? 'ย่อ' : 'ขยาย'} ${w.id}`} onClick={() => toggle(r.ws)} disabled={filterActive}>
                            <span aria-hidden="true">{exp ? '▾' : '▸'}</span>
                          </button>
                          <button type="button" className="g-name" aria-haspopup="dialog" onClick={(e) => select({ kind: 'workstream', id: r.ws }, e.currentTarget)}>
                            <span className="g-ico"><Icon name={WS_ICON[w.id]} size={18} /></span>
                            <span className="g-id">{w.id}</span>
                            <span className="g-title" title={w.title}>{narrow || textWidth(w.title, 800) * 14 / 13 > labelW - 116 ? w.shortTitle : w.title}</span>
                            {supportWs.has(r.ws) && <span className="g-support">support ┄</span>}
                            {!narrow && <span className={`g-owner${/TBC/.test(w.ownerLabel) ? ' is-tbc' : ''}`} title={w.ownerLabel}>{w.ownerLabel}</span>}
                          </button>
                          {editMode && <button type="button" className="g-add" onClick={() => onAdd(r.ws)} aria-label={`เพิ่ม Task ใน ${w.id}`}><Icon name="plus" size={16} /></button>}
                        </div>
                        <div className="g-lane" style={{ left: labelW, width: chartW }}>
                          {ts.map((t) => renderBar(t, true))}
                        </div>
                      </div>
                    )
                  }
                  const t = r.task!
                  return (
                    <div key={r.key} className={`g-row g-row-task${ri % 2 ? ' zebra' : ''}${!hasFocus || lit(t.id) ? '' : ' row-dim'}`} style={{ top: r.y, height: r.h }}>
                      <div className="g-label g-label-task" style={{ width: labelW }}>
                        <button type="button" className="g-name" aria-haspopup="dialog" onClick={(e) => select({ kind: 'task', id: t.id }, e.currentTarget)}>
                          <span className="g-id">{t.id}</span>
                          <span className="g-title">{t.title}</span>
                        </button>
                      </div>
                      <div className="g-lane" style={{ left: labelW, width: chartW }}>
                        {renderBar(t, false)}
                        {t.id === minimumDataMarker.taskId && (
                          <span className="marker-flag" style={{ left: xMid(minimumDataMarker.date) }} aria-hidden="true">{fmtDate(minimumDataMarker.date, false)} {minimumDataMarker.label}</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                <svg className="g-edges" style={{ left: labelW }} width={chartW} height={bodyH} aria-hidden="true">
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                      <path d="M0 0 L10 5 L0 10 z" />
                    </marker>
                  </defs>
                  {edges.map((e) => <path key={e.key} d={e.d} className="edge-hard" markerEnd="url(#arrow)" />)}
                  {supportEdges.map((e) => <path key={e.key} d={e.d} className="edge-support" />)}
                </svg>
              </div>
            </div>
          </div>

          {!maxed && (
            <div className="g-resize" role="separator" aria-orientation="horizontal" aria-label="ปรับความสูง Timeline (ลาก หรือใช้ลูกศรขึ้น/ลง)" tabIndex={0}
              onPointerDown={startResize}
              onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); nudgeHeight(40) } if (e.key === 'ArrowUp') { e.preventDefault(); nudgeHeight(-40) } }}
              onDoubleClick={() => { setChartH(null); try { localStorage.removeItem(H_KEY) } catch { /* optional */ } }}>
              <span aria-hidden="true" />
            </div>
          )}
          <aside className="p3-box">
            <h3><Icon name="scale" size={18} />P3 Scale Later</h3>
            <p className="muted">ยังไม่กำหนดวัน · ตัดสินจากผล Pilot</p>
            <ul>{priorities.find((p) => p.id === 'P3')!.items.map((i) => <li key={i}>{i}</li>)}</ul>
            <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'p3', id: 'P3' }, e.currentTarget)}>Details</button>
          </aside>
        </div>

        <ul className="g-legend" aria-label="คำอธิบายสัญลักษณ์">
          <li><i className="lg-phase" /> Phase (ตาม Gate)</li>
          <li><i className="lg-bar lg-p0" /> P0 Unblock</li>
          <li><i className="lg-bar lg-p1" /> P1 Core</li>
          <li><i className="lg-bar lg-cand" /> Candidate (เลือกที่ M2)</li>
          <li><i className="lg-bar lg-local" /> อนุมัติแยก · Start TBC</li>
          <li><i className="lg-diamond" /> Proposed Gate</li>
          <li><i className="lg-diamond lg-diamond-meeting" /> Date from Meeting</li>
          <li><i className="lg-today" /> Today</li>
          <li><i className="lg-solid" /> Must finish first</li>
          <li><i className="lg-cpband" /> Checkpoint ที่เสนอ (ไม่ใช่ Gate ใหม่)</li>
          <li>✎ แก้ไขแล้ว · ⚠ เริ่มก่อนงานก่อนหน้าเสร็จ</li>
        </ul>
        <p className="gantt-foot"><Icon name="calendar" size={16} />1 ต.ค. = วันจากบันทึก · 31 ธ.ค. = กรอบ Reform · วันอื่น = Proposal · ยังไม่มี Gate ใดผ่าน</p>

        <div className="ms-list">
          <h3>Milestones</h3>
          <ol>
            {milestones.map((m) => (
              <li key={m.id}>
                <button type="button" className={`ms-row${selection?.kind === 'milestone' && selection.id === m.id ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'milestone', id: m.id }, e.currentTarget)}>
                  <span className={`ms-row-d${m.dateBasis !== 'proposed' ? ' ms-meeting' : ''}`} aria-hidden="true" />
                  <span className="ms-row-id">{m.id}</span>
                  <span className="ms-row-date">{fmtDate(m.date, false)}</span>
                  <span className="ms-row-label">{m.label}</span>
                  <span className="ms-row-status">TBC</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
      {tip && (
        <div className="tooltip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
          {tip.lines.map((l, i) => <div key={i} className={i === 0 ? 'tip-title' : i === tip.lines.length - 1 ? 'tip-hint' : undefined}>{l}</div>)}
        </div>
      )}
    </SceneShell>
  )
}
