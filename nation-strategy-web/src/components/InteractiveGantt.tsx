import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useApp } from '../lib/appContext'
import {
  meta, milestones, msById, priorities, tasks, taskById, workstreams, minimumDataMarker, relations,
  type CandidateId, type Milestone, type PriorityId, type Task, type WorkstreamId,
} from '../data/nationPlan'
import { dayNumber, fmtDate, fmtRange, isoFromDay, monthShort } from '../lib/dates'
import { relatedTo } from '../lib/graph'
import { SceneShell } from './SceneShell'

// Chart domain: Monday before the roadmap start → day after the roadmap end.
const DOMAIN_START = dayNumber('2026-09-21')
const DOMAIN_END = dayNumber(meta.timelineEnd) + 1
const DAYS = DOMAIN_END - DOMAIN_START

type Zoom = 'overview' | 'month' | 'week'
const ZOOM_LABEL: Record<Zoom, string> = { overview: 'ภาพรวม', month: 'รายเดือน', week: 'รายสัปดาห์' }
type CandFilter = 'all' | CandidateId | 'LOCAL'

const WS_ROW = 58
const TASK_ROW = 50
const CHIP_H = 28
const MS_HEADER = CHIP_H * 2 + 22

let measureCtx: CanvasRenderingContext2D | null = null
function textWidth(s: string, font = '600 13px system-ui, sans-serif') {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d')
  if (!measureCtx) return s.length * 7.5
  measureCtx.font = font
  return measureCtx.measureText(s).width
}

interface Row { key: string; type: 'ws' | 'task'; ws: WorkstreamId; task?: Task; y: number; h: number }

function isCandidate(t: Task) { return !!t.conditionalOn && t.conditionalOn !== 'LOCAL_APPROVAL' }
function isLocal(t: Task) { return t.conditionalOn === 'LOCAL_APPROVAL' }

function barLabel(t: Task) {
  if (isCandidate(t)) return `${t.title} · Candidate / รอเลือกที่ M2`
  if (isLocal(t)) return `${t.title} · วันเริ่มจริงรอยืนยัน`
  return t.title
}

function tipFor(t: Task) {
  const lines = [`${t.id} ${t.title}`, `${fmtRange(t.start, t.end)} · วันที่เสนอ`]
  if (isCandidate(t)) lines.push(`Candidate ${t.conditionalOn} — รอเลือกที่ M2`)
  else if (isLocal(t)) lines.push('อนุมัติธุรกิจแยก · วันเริ่มจริงรอยืนยัน')
  else lines.push(t.note.length > 60 ? `${t.note.slice(0, 58)}…` : t.note)
  lines.push('แตะ/คลิกเพื่อดูรายละเอียด')
  return lines
}
function msTip(m: Milestone) {
  return [`${m.id} ${m.label}`, `${fmtDate(m.date)} · ${m.dateBasis === 'proposed' ? 'วันที่เสนอ' : m.dateBasis === 'meeting_date' ? 'วันที่ในบันทึก' : 'กรอบสิ้นปีจากประชุม'}`, 'สถานะจริง: ยังไม่ยืนยัน', 'แตะ/คลิกเพื่อดูรายละเอียด']
}

export function InteractiveGantt() {
  const { select, selection, timelineFocus, close } = useApp()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewW, setViewW] = useState(1000)
  const [zoom, setZoom] = useState<Zoom>(() => (window.innerWidth < 760 ? 'month' : 'overview'))
  const [expanded, setExpanded] = useState<Set<WorkstreamId>>(new Set())
  const [wsFilter, setWsFilter] = useState<'all' | WorkstreamId>('all')
  const [prioFilter, setPrioFilter] = useState<'all' | PriorityId>('all')
  const [candFilter, setCandFilter] = useState<CandFilter>('all')
  const [tip, setTip] = useState<{ lines: string[]; x: number; y: number } | null>(null)

  const narrow = viewW < 640
  const labelW = narrow ? 128 : 236

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewW(el.clientWidth))
    ro.observe(el)
    setViewW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const pxPerDay = zoom === 'overview' ? Math.max(3, (viewW - labelW - 4) / DAYS) : zoom === 'month' ? 10 : 26
  const chartW = Math.round(DAYS * pxPerDay)
  const xOf = (iso: string) => (dayNumber(iso) - DOMAIN_START) * pxPerDay
  /** Center of a calendar day (used for milestones). */
  const xMid = (iso: string) => xOf(iso) + pxPerDay / 2

  // ---- filters -------------------------------------------------------------
  const filterActive = wsFilter !== 'all' || prioFilter !== 'all' || candFilter !== 'all'
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
  }, [expanded, wsFilter, prioFilter, candFilter])
  const bodyH = rows.reduce((s, r) => s + r.h, 0)
  const isExpanded = (ws: WorkstreamId) => rows.some((r) => r.type === 'task' && r.ws === ws)

  // ---- highlight -----------------------------------------------------------
  const selId = selection && (selection.kind === 'task' || selection.kind === 'milestone' || selection.kind === 'workstream') ? selection.id : null
  const rel = useMemo(() => relatedTo(selId), [selId])
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
    if (!el) return
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
          const top = r.y
          const headerH = el.querySelector<HTMLElement>('.g-header')?.offsetHeight ?? 0
          if (top < el.scrollTop || top + r.h > el.scrollTop + el.clientHeight - headerH) el.scrollTo({ top: Math.max(0, top - 8), behavior: 'auto' })
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
  }, [pxPerDay])
  const weekCells = useMemo(() => {
    const cells: { label: string; x: number; iso: string }[] = []
    for (let d = DOMAIN_START; d < DOMAIN_END; d += 7) {
      const iso = isoFromDay(d)
      cells.push({ label: String(Number(iso.slice(8))), x: (d - DOMAIN_START) * pxPerDay, iso })
    }
    return cells
  }, [pxPerDay])
  const showWeekLabels = pxPerDay * 7 >= 22

  // ---- milestone label placement (no overlapping hit targets) --------------
  const chips = useMemo(() => {
    const gap = 4
    const lastRight = [-Infinity, -Infinity]
    return milestones.map((m) => {
      const x = xMid(m.date)
      const text = narrow || pxPerDay < 6 ? m.id : `${m.id} ${m.label}`
      const w = Math.ceil(textWidth(text)) + 18
      let left = Math.min(Math.max(2, x - w / 2), chartW - w - 2)
      let lane = 1
      if (left >= lastRight[1] + gap) lane = 1
      else if (left >= lastRight[0] + gap) lane = 0
      else {
        lane = lastRight[0] <= lastRight[1] ? 0 : 1
        left = lastRight[lane] + gap
      }
      lastRight[lane] = left + w
      return { m, x, left, w, lane, text }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pxPerDay, chartW, narrow])

  // ---- geometry for edges --------------------------------------------------
  const rowOfTask = (id: string) => rows.find((r) => r.key === id) ?? rows.find((r) => r.type === 'ws' && r.ws === taskById[id]?.workstreamId)
  const edges = rel.edges
    .filter((e) => taskById[e.from] && taskById[e.to])
    .map((e) => {
      const a = rowOfTask(e.from); const b = rowOfTask(e.to)
      if (!a || !b) return null
      const x1 = xOf(taskById[e.from].end) + pxPerDay; const y1 = a.y + a.h / 2
      const x2 = xOf(taskById[e.to].start); const y2 = b.y + b.h / 2
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

  // ---- handlers ------------------------------------------------------------
  const tipShownAt = useRef(0)
  const showTip = (lines: string[], el: HTMLElement) => {
    tipShownAt.current = Date.now()
    const r = el.getBoundingClientRect()
    setTip({ lines, x: Math.min(r.left + 8, window.innerWidth - 280), y: r.bottom + 6 })
  }
  const tipProps = (lines: string[]) => ({
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => { if (e.pointerType === 'mouse') showTip(lines, e.currentTarget) },
    onPointerLeave: () => setTip(null),
    onFocus: (e: React.FocusEvent<HTMLElement>) => { if (e.currentTarget.matches(':focus-visible')) showTip(lines, e.currentTarget) },
    onBlur: () => setTip(null),
  })
  useEffect(() => {
    const hide = () => { if (Date.now() - tipShownAt.current > 250) setTip(null) }
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [])

  const toggle = (ws: WorkstreamId) => setExpanded((prev) => {
    const n = new Set(prev)
    if (n.has(ws)) n.delete(ws); else n.add(ws)
    return n
  })
  const allExpanded = workstreams.every((w) => expanded.has(w.id))
  const jumpTo = (iso: string) => scrollRef.current?.scrollTo({ left: Math.max(0, xOf(iso) - 8), behavior: 'smooth' })
  const clearFilters = () => { setWsFilter('all'); setPrioFilter('all'); setCandFilter('all') }

  const renderBar = (t: Task, inSummary: boolean): ReactNode => {
    const left = xOf(t.start)
    const width = xOf(t.end) + pxPerDay - left
    const label = `${t.id} ${inSummary ? t.title : barLabel(t)}`
    const fits = textWidth(label, '600 13px system-ui, sans-serif') + 16 < width
    const cls = [
      'bar', `bar-${t.priority.toLowerCase()}`,
      isCandidate(t) ? 'bar-cand' : '', isLocal(t) ? 'bar-local' : '',
      inSummary ? 'bar-sum' : '',
      !taskMatches(t) && filterActive ? 'bar-filtered' : '',
      hasFocus ? (lit(t.id) ? 'is-lit' : 'is-dim') : '',
      selection?.kind === 'task' && selection.id === t.id ? 'is-selected' : '',
    ].filter(Boolean).join(' ')
    return (
      <button
        key={t.id}
        type="button"
        className={cls}
        style={{ left, width }}
        aria-label={`${t.id} ${barLabel(t)}, ${fmtRange(t.start, t.end)}, วันที่เสนอ`}
        aria-haspopup="dialog"
        onClick={(e) => { setTip(null); select({ kind: 'task', id: t.id }, e.currentTarget) }}
        {...tipProps(tipFor(t))}
      >
        {!inSummary && t.checkpoints.map((c, i) => {
          const iso = c.milestoneId ? msById[c.milestoneId].date : c.date!
          const cx = xOf(iso) + pxPerDay / 2 - left
          if (cx <= 2 || cx >= width - 1) return null
          return <span key={i} className={`cp${c.date ? ' cp-marker' : ''}`} style={{ left: cx }} aria-hidden="true" />
        })}
        {(fits || !inSummary) && <span className={`bar-text${fits ? '' : ' bar-text-out'}`}>{label}</span>}
      </button>
    )
  }

  return (
    <SceneShell
      id="timeline"
      wide
      headline="กันยายน–ธันวาคม: จากแผนสู่การใช้งานจริง"
      badges={['proposal', 'meeting']}
      intro={<p className="plan-warning"><strong>เส้นเวลาเป็นแผน ไม่ใช่ความคืบหน้าจริง</strong> · 7 Workstreams ขยายดู 21 Work Packages ได้ · แตะแถบหรือ ◆ เพื่อดูรายละเอียดและงานก่อน–หลัง</p>}
      takeaway="ทุกจุดตรวจมีสิ่งส่งมอบและเงื่อนไข ไม่ได้จบแค่ถึงวันที่"
    >
      <div className="gantt">
        <div className="gantt-toolbar" role="toolbar" aria-label="ควบคุม Timeline">
          <div className="tb-group" role="group" aria-label="ซูม">
            <span className="tb-label">ซูม</span>
            {(Object.keys(ZOOM_LABEL) as Zoom[]).map((z) => (
              <button key={z} type="button" className="seg" aria-pressed={zoom === z} onClick={() => setZoom(z)}>{ZOOM_LABEL[z]}</button>
            ))}
          </div>
          <div className="tb-group" role="group" aria-label="ไปยังเดือน">
            <span className="tb-label">เดือน</span>
            {['2026-09-21', '2026-10-01', '2026-11-01', '2026-12-01'].map((iso) => (
              <button key={iso} type="button" className="seg" onClick={() => jumpTo(iso)}>{monthShort(Number(iso.slice(5, 7)))}</button>
            ))}
          </div>
          <div className="tb-group tb-filters">
            <label>
              <span className="tb-label">Workstream</span>
              <select value={wsFilter} onChange={(e) => setWsFilter(e.target.value as 'all' | WorkstreamId)}>
                <option value="all">ทั้งหมด</option>
                {workstreams.map((w) => <option key={w.id} value={w.id}>{w.id} {w.shortTitle}</option>)}
              </select>
            </label>
            <label>
              <span className="tb-label">Priority</span>
              <select value={prioFilter} onChange={(e) => setPrioFilter(e.target.value as 'all' | PriorityId)}>
                <option value="all">ทั้งหมด</option>
                {priorities.filter((p) => p.id !== 'P3').map((p) => <option key={p.id} value={p.id}>{p.id} {p.label}</option>)}
              </select>
            </label>
            <label>
              <span className="tb-label">Candidate</span>
              <select value={candFilter} onChange={(e) => setCandFilter(e.target.value as CandFilter)}>
                <option value="all">ทั้งหมด</option>
                <option value="C1">C1 AI Support</option>
                <option value="C2">C2 Government</option>
                <option value="C3">C3 Content</option>
                <option value="C4">C4 Community</option>
                <option value="LOCAL">Local (อนุมัติแยก)</option>
              </select>
            </label>
          </div>
          <div className="tb-group">
            <button type="button" className="seg" onClick={() => setExpanded(allExpanded ? new Set() : new Set(workstreams.map((w) => w.id)))} disabled={filterActive}>
              {allExpanded ? 'ย่อทั้งหมด' : 'ขยาย 21 งาน'}
            </button>
            {filterActive && <button type="button" className="seg" onClick={clearFilters}>ล้างตัวกรอง</button>}
            {hasFocus && <button type="button" className="seg" onClick={close}>ล้างการเลือก</button>}
          </div>
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
            className={`gantt-scroll${hasFocus ? ' has-focus' : ''}`}
            ref={scrollRef}
            tabIndex={0}
            aria-label="แผนภูมิ Gantt — เลื่อนแนวนอนเพื่อดูช่วงเวลา"
            style={{ ['--label-w' as string]: `${labelW}px` }}
          >
            <div className="g-inner" style={{ width: labelW + chartW }}>
              <div className="g-header">
                <div className="g-corner" style={{ width: labelW }}>
                  <span>Workstream</span>
                  <span className="muted">ข้อมูล ณ {fmtDate(meta.dataAsOf, false)}</span>
                </div>
                <div className="g-scale" style={{ width: chartW }}>
                  <div className="g-months">
                    {monthCells.map((c) => <div key={c.iso} className="g-month" style={{ left: c.x, width: c.w }}><span>{c.w > 40 ? c.label : c.label.split(' ')[0]}</span></div>)}
                  </div>
                  <div className="g-weeks">
                    {weekCells.map((c) => <div key={c.iso} className="g-week" style={{ left: c.x, width: pxPerDay * 7 }}>{showWeekLabels && <span>{c.label}</span>}</div>)}
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
                        className={`ms-chip${hasFocus ? (lit(c.m.id) ? ' is-lit' : ' is-dim') : ''}${selection?.kind === 'milestone' && selection.id === c.m.id ? ' is-selected' : ''}${c.m.dateBasis !== 'proposed' ? ' ms-meeting' : ''}`}
                        style={{ left: c.left, top: c.lane * CHIP_H, width: c.w }}
                        aria-label={`${c.m.id} ${c.m.label}, ${fmtDate(c.m.date)}, สถานะจริงยังไม่ยืนยัน`}
                        aria-haspopup="dialog"
                        onClick={(e) => { setTip(null); select({ kind: 'milestone', id: c.m.id }, e.currentTarget) }}
                        {...tipProps(msTip(c.m))}
                      >{c.text}</button>
                    ))}
                    {milestones.map((m) => (
                      <span key={m.id} className={`ms-diamond${m.dateBasis !== 'proposed' ? ' ms-meeting' : ''}${hasFocus ? (lit(m.id) ? ' is-lit' : ' is-dim') : ''}`} style={{ left: xMid(m.date) }} aria-hidden="true" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="g-body" style={{ height: bodyH }}>
                <div className="g-under" style={{ left: labelW, width: chartW, height: bodyH }} aria-hidden="true">
                  {weekCells.map((c) => <span key={c.iso} className="g-vline" style={{ left: c.x }} />)}
                  {monthCells.map((c) => <span key={c.iso} className="g-vline g-vline-month" style={{ left: c.x }} />)}
                  {milestones.map((m) => (
                    <span key={m.id} className={`g-msline${hasFocus ? (lit(m.id) ? ' is-lit' : ' is-dim') : ''}`} style={{ left: xMid(m.date) }} />
                  ))}
                  <span className="g-marker-line" style={{ left: xMid(minimumDataMarker.date) }} />
                </div>

                {rows.map((r) => {
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
                            <span className="g-id">{w.id}</span>
                            <span className="g-title">{narrow ? w.shortTitle : w.title}</span>
                            {supportWs.has(r.ws) && <span className="g-support">สนับสนุน ┄</span>}
                          </button>
                        </div>
                        <div className="g-lane" style={{ left: labelW, width: chartW }}>
                          {ts.map((t) => renderBar(t, true))}
                        </div>
                      </div>
                    )
                  }
                  const t = r.task!
                  return (
                    <div key={r.key} className={`g-row g-row-task${!hasFocus || lit(t.id) ? '' : ' row-dim'}`} style={{ top: r.y, height: r.h }}>
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

          <aside className="p3-box">
            <h3>ระยะขยาย / ยังไม่กำหนดวัน</h3>
            <p className="muted">P3 — ตัดสินใจจากผล Pilot</p>
            <ul>{priorities.find((p) => p.id === 'P3')!.items.map((i) => <li key={i}>{i}</li>)}</ul>
            <button type="button" className="mini-btn" aria-haspopup="dialog" onClick={(e) => select({ kind: 'p3', id: 'P3' }, e.currentTarget)}>ดูรายละเอียด</button>
          </aside>
        </div>

        <ul className="g-legend" aria-label="คำอธิบายสัญลักษณ์">
          <li><i className="lg-bar lg-p0" /> P0 ปลดล็อก</li>
          <li><i className="lg-bar lg-p1" /> P1 งานหลัก</li>
          <li><i className="lg-bar lg-cand" /> ลายเส้น = Candidate / รอเลือกที่ M2</li>
          <li><i className="lg-bar lg-local" /> กรอบประ = อนุมัติแยก / วันเริ่มรอยืนยัน</li>
          <li><i className="lg-diamond" /> ◆ Gate เสนอ · <i className="lg-diamond lg-diamond-meeting" /> วันจากบันทึก</li>
          <li><i className="lg-tick" /> ขีดในแถบ = จุดตรวจระหว่างทาง</li>
          <li><i className="lg-solid" /> ลูกศรทึบ = ต้องเสร็จก่อนเริ่ม</li>
          <li><i className="lg-dash" /> เส้นประ = สนับสนุน</li>
        </ul>
        <p className="gantt-foot">1 ต.ค. = วันนำเสนอตามบันทึก · สิ้นปี = กรอบ Reform · วันย่อยอื่น = ข้อเสนอ · ยังไม่มี Gate ใดผ่านแล้ว</p>

        <div className="ms-list">
          <h3>Milestones (แตะเพื่อดูรายละเอียด)</h3>
          <ol>
            {milestones.map((m) => (
              <li key={m.id}>
                <button type="button" className={`ms-row${selection?.kind === 'milestone' && selection.id === m.id ? ' is-selected' : ''}`} aria-haspopup="dialog" onClick={(e) => select({ kind: 'milestone', id: m.id }, e.currentTarget)}>
                  <span className={`ms-row-d${m.dateBasis !== 'proposed' ? ' ms-meeting' : ''}`} aria-hidden="true" />
                  <span className="ms-row-id">{m.id}</span>
                  <span className="ms-row-date">{fmtDate(m.date, false)}</span>
                  <span className="ms-row-label">{m.label}</span>
                  <span className="ms-row-status">ยังไม่ยืนยัน</span>
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
