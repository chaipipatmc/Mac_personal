/**
 * Editable plan layer.
 *
 * The E01 seed in `nationPlan.ts` stays the baseline. Edits are kept as a
 * small `PlanEdits` object, applied in place to the shared arrays/lookups
 * so every scene re-renders with the edited values.
 *
 * Persistence (most durable first):
 *  1. claude.ai artifact — the page republishes itself with the edits
 *     embedded as JSON (`artifact` capability). Every viewer then opens
 *     the latest version.
 *  2. Browser localStorage — used when the page runs outside claude.ai
 *     (local dev, the single-file HTML). Only this browser remembers.
 */
import {
  milestones, msById, tasks, taskById, workstreams, wsById,
  type Milestone, type MilestoneId, type Task, type Workstream, type WorkstreamId,
} from '../data/nationPlan'

export type TaskPatch = Partial<Pick<Task, 'title' | 'short' | 'start' | 'end' | 'note' | 'deliverable' | 'acceptance' | 'owner'>>
export type MilestonePatch = Partial<Pick<Milestone, 'date' | 'label' | 'deliverables' | 'acceptance' | 'owner' | 'approver'>>
export type WorkstreamPatch = Partial<Pick<Workstream, 'title' | 'shortTitle' | 'ownerLabel'>>

export interface PlanEdits {
  tasks: Record<string, TaskPatch>
  milestones: Record<string, MilestonePatch>
  workstreams: Record<string, WorkstreamPatch>
  added: Task[]
  removed: string[]
  /** Wording overrides for any on-page or panel text, keyed by a stable id. */
  text: Record<string, string>
  savedAt: string | null
}

const empty = (): PlanEdits => ({ tasks: {}, milestones: {}, workstreams: {}, added: [], removed: [], text: {}, savedAt: null })

// Baseline snapshots taken before any edit is applied.
const baseTasks: Task[] = tasks.map((t) => ({ ...t }))
const baseMilestones: Milestone[] = milestones.map((m) => ({ ...m }))
const baseWorkstreams: Workstream[] = workstreams.map((w) => ({ ...w }))

const LOCAL_KEY = 'nation-plan-edits-v1'
const UI_KEY = 'nation-ui-v1'
const ISO = /^\d{4}-\d{2}-\d{2}$/

let edits: PlanEdits = empty()
let version = 0
const undoStack: string[] = []
const listeners = new Set<() => void>()

export type SaveMode = 'artifact' | 'local' | 'none'
export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'readonly' | 'error'
let saveMode: SaveMode = 'none'
let saveStatus: SaveStatus = 'idle'
let saveMessage = ''
let artifactNs: { publish: (html: string) => Promise<unknown> } | null = null
let saveTimer: ReturnType<typeof setTimeout> | null = null
let dragging = false

const emit = () => { version++; listeners.forEach((l) => l()) }
export const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn) } }
export const getVersion = () => version
export const getSaveState = () => ({ mode: saveMode, status: saveStatus, message: saveMessage, savedAt: edits.savedAt })
export const getEdits = () => edits
export const canUndo = () => undoStack.length > 0
export const isEdited = (id: string) => !!(edits.tasks[id] || edits.milestones[id] || edits.workstreams[id] || edits.added.some((t) => t.id === id))

/** Wording override for `key`, else the built-in text. */
export const getText = (key: string, fallback: string) => edits.text[key] ?? fallback
export const hasText = (key: string) => key in edits.text
/** Set (or with null, remove) a wording override. */
export function setText(key: string, value: string | null) {
  if (value === null ? !(key in edits.text) : edits.text[key] === value) return
  commit((e) => { if (value === null) delete e.text[key]; else e.text[key] = value })
}
export const editCount = () =>
  Object.keys(edits.tasks).length + Object.keys(edits.milestones).length + Object.keys(edits.workstreams).length + edits.added.length + edits.removed.length + Object.keys(edits.text).length

function sanitize(raw: unknown): PlanEdits {
  const e = empty()
  if (!raw || typeof raw !== 'object') return e
  const r = raw as Partial<PlanEdits>
  const str = (v: unknown, max = 400) => (typeof v === 'string' ? v.slice(0, max) : undefined)
  const date = (v: unknown) => (typeof v === 'string' && ISO.test(v) ? v : undefined)
  const clean = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
  for (const [id, p] of Object.entries(r.tasks ?? {})) {
    e.tasks[id] = clean({ title: str(p.title, 120), short: str(p.short, 40), start: date(p.start), end: date(p.end), note: str(p.note), deliverable: str(p.deliverable), acceptance: str(p.acceptance), owner: str(p.owner, 200) })
  }
  for (const [id, p] of Object.entries(r.milestones ?? {})) {
    e.milestones[id] = clean({ date: date(p.date), label: str(p.label, 80), deliverables: str(p.deliverables), acceptance: str(p.acceptance), owner: str(p.owner, 200), approver: str(p.approver, 200) })
  }
  for (const [id, p] of Object.entries(r.workstreams ?? {})) {
    e.workstreams[id] = clean({ title: str(p.title, 80), shortTitle: str(p.shortTitle, 40), ownerLabel: str(p.ownerLabel, 200) })
  }
  for (const t of Array.isArray(r.added) ? r.added : []) {
    if (!t || typeof t.id !== 'string' || !/^N\d{1,4}$/.test(t.id) || !wsById[t.workstreamId as WorkstreamId] || !date(t.start) || !date(t.end)) continue
    e.added.push(newTask(t.workstreamId, t.id, str(t.title, 120) ?? 'New task', t.start, t.end, str(t.note) ?? ''))
  }
  e.removed = (Array.isArray(r.removed) ? r.removed : []).filter((id) => typeof id === 'string' && /^N\d{1,4}$/.test(id))
  for (const [k, v] of Object.entries(r.text ?? {})) {
    if (/^[\w.:-]{1,160}$/.test(k) && typeof v === 'string') e.text[k] = v.slice(0, 2000)
  }
  e.savedAt = typeof r.savedAt === 'string' ? r.savedAt : null
  return e
}

function newTask(ws: WorkstreamId, id: string, title: string, start: string, end: string, note = ''): Task {
  return {
    id, workstreamId: ws, title, short: title.slice(0, 18), custom: true,
    start, end, priority: 'P1', predecessors: [], checkpoints: [], conditionalOn: null,
    deliverable: '—', acceptance: '—', note: note || 'เพิ่มโดยผู้แก้ไขแผน',
    dateBasis: 'proposed', actualStart: null, actualEnd: null, progressPercent: null,
    sourceRefs: [{ source: 'E01', note: 'Work Package ที่เพิ่มภายหลังในหน้าแก้ไข — ยังไม่อยู่ในร่าง E01' }],
  }
}

/** Rebuild the live arrays and lookups from baseline + edits. */
function apply() {
  tasks.length = 0
  for (const b of baseTasks) {
    const p = edits.tasks[b.id]
    tasks.push({ ...b, ...(p ?? {}) })
  }
  for (const a of edits.added) if (!edits.removed.includes(a.id)) tasks.push({ ...a, ...(edits.tasks[a.id] ?? {}) })
  for (const t of tasks) if (t.end < t.start) t.end = t.start
  for (const k of Object.keys(taskById)) delete taskById[k]
  for (const t of tasks) taskById[t.id] = t

  milestones.length = 0
  for (const b of baseMilestones) milestones.push({ ...b, ...(edits.milestones[b.id] ?? {}) })
  milestones.sort((a, b) => a.id.localeCompare(b.id))
  for (const m of milestones) msById[m.id] = m

  workstreams.length = 0
  for (const b of baseWorkstreams) workstreams.push({ ...b, ...(edits.workstreams[b.id] ?? {}) })
  for (const w of workstreams) wsById[w.id] = w
}

function commit(mutator: (e: PlanEdits) => void) {
  undoStack.push(JSON.stringify(edits))
  if (undoStack.length > 50) undoStack.shift()
  const next: PlanEdits = JSON.parse(JSON.stringify(edits))
  mutator(next)
  edits = next
  apply()
  if (saveStatus !== 'readonly') { saveStatus = 'dirty'; saveMessage = '' }
  emit()
  scheduleSave()
}

// ---- public edit API --------------------------------------------------------

export function patchTask(id: string, patch: TaskPatch) {
  const base = baseTasks.find((t) => t.id === id)
  commit((e) => {
    const merged = { ...(e.tasks[id] ?? {}), ...patch }
    if (base) for (const k of Object.keys(merged) as (keyof TaskPatch)[]) if (merged[k] === base[k]) delete merged[k]
    if (Object.keys(merged).length) e.tasks[id] = merged
    else delete e.tasks[id]
  })
}

export function patchMilestone(id: MilestoneId, patch: MilestonePatch) {
  const base = baseMilestones.find((m) => m.id === id)!
  commit((e) => {
    const merged = { ...(e.milestones[id] ?? {}), ...patch }
    for (const k of Object.keys(merged) as (keyof MilestonePatch)[]) if (merged[k] === base[k]) delete merged[k]
    if (Object.keys(merged).length) e.milestones[id] = merged
    else delete e.milestones[id]
  })
}

export function patchWorkstream(id: WorkstreamId, patch: WorkstreamPatch) {
  const base = baseWorkstreams.find((w) => w.id === id)!
  commit((e) => {
    const merged = { ...(e.workstreams[id] ?? {}), ...patch }
    for (const k of Object.keys(merged) as (keyof WorkstreamPatch)[]) if (merged[k] === base[k]) delete merged[k]
    if (Object.keys(merged).length) e.workstreams[id] = merged
    else delete e.workstreams[id]
  })
}

export function addTask(ws: WorkstreamId, start: string, end: string): string {
  const used = [...edits.added.map((t) => t.id), ...edits.removed]
  let n = 1
  while (used.includes(`N${n}`)) n++
  const id = `N${n}`
  commit((e) => { e.added.push(newTask(ws, id, 'New task', start, end)) })
  return id
}

export function removeTask(id: string) {
  commit((e) => {
    e.added = e.added.filter((t) => t.id !== id)
    delete e.tasks[id]
    if (!e.removed.includes(id)) e.removed.push(id)
  })
}

export function resetItem(id: string) {
  commit((e) => { delete e.tasks[id]; delete e.milestones[id]; delete e.workstreams[id] })
}

export function resetAll() {
  commit((e) => { Object.assign(e, empty(), { savedAt: e.savedAt }) })
}

export function undo() {
  const prev = undoStack.pop()
  if (!prev) return
  edits = sanitize(JSON.parse(prev))
  apply()
  if (saveStatus !== 'readonly') saveStatus = 'dirty'
  emit()
  scheduleSave()
}

export const baselineTask = (id: string) => baseTasks.find((t) => t.id === id)
export const baselineMilestone = (id: string) => baseMilestones.find((m) => m.id === id)

// ---- persistence ------------------------------------------------------------

/** Called by the Gantt while a drag is in progress, so no save reloads the page mid-drag. */
export function setDragging(v: boolean) {
  dragging = v
  if (!v && saveStatus === 'dirty') scheduleSave()
}

function scheduleSave(delay = 4000) {
  if (saveMode === 'none' || saveStatus === 'readonly') return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => { void saveNow() }, saveMode === 'local' ? 300 : delay)
}

/** UI state that should survive the reload a publish triggers. */
const uiParts = new Map<string, () => unknown>()
export function registerUiPart(key: string, fn: () => unknown) { uiParts.set(key, fn); return () => { uiParts.delete(key) } }
const uiSnapshot = () => Object.fromEntries([...uiParts].map(([k, fn]) => [k, fn()]))
let restoredUi: Record<string, unknown> | null = null
/** What the previous view stashed right before its save reloaded the page. */
export const getRestoredUi = <T,>(key: string): T | undefined => (restoredUi?.[key] as T | undefined)
function takeRestoredUi() {
  try {
    const raw = sessionStorage.getItem(UI_KEY)
    if (!raw) return null
    sessionStorage.removeItem(UI_KEY)
    return JSON.parse(raw) as Record<string, unknown>
  } catch { return null }
}

export async function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
  if (dragging) { scheduleSave(1500); return }
  if (saveStatus !== 'dirty' && saveStatus !== 'error') return
  const stamped: PlanEdits = { ...edits, savedAt: new Date().toISOString() }
  if (saveMode === 'local') {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(stamped))
      edits = stamped
      saveStatus = 'saved'; saveMessage = ''
    } catch {
      saveStatus = 'error'; saveMessage = 'บันทึกในเบราว์เซอร์ไม่ได้'
    }
    emit()
    return
  }
  if (saveMode !== 'artifact' || !artifactNs) return
  saveStatus = 'saving'; emit()
  try {
    try { sessionStorage.setItem(UI_KEY, JSON.stringify(uiSnapshot())) } catch { /* optional */ }
    await artifactNs.publish(buildDocument(stamped))
    edits = stamped
    saveStatus = 'saved'; saveMessage = ''
    // The shell reloads every view to the new version, this one included.
  } catch (err) {
    const code = (err as { code?: string })?.code
    try { sessionStorage.removeItem(UI_KEY) } catch { /* optional */ }
    if (code === 'not_writer' || code === 'not_granted' || code === 'not_declared' || code === 'consent_required' || code === 'capability_disabled' || code === 'capability_removed') {
      saveStatus = 'readonly'; saveMessage = 'ดูอย่างเดียว — ไม่มีสิทธิ์บันทึกหน้านี้'
    } else if (code === 'conflict') {
      saveStatus = 'saving'; saveMessage = 'มีคนบันทึกก่อน — กำลังโหลดเวอร์ชันล่าสุด'
    } else if (code === 'rate_limited') {
      saveStatus = 'dirty'; saveMessage = 'บันทึกถี่เกินไป — จะลองใหม่อัตโนมัติ'
      scheduleSave(15000)
    } else {
      saveStatus = 'error'; saveMessage = 'บันทึกไม่สำเร็จ — กด Save อีกครั้ง'
    }
  }
  emit()
}

/** Regenerate the complete page from its own source + the current edits. */
function buildDocument(state: PlanEdits): string {
  const css = document.getElementById('app-css')?.textContent ?? ''
  const js = document.getElementById('app-js')?.textContent ?? ''
  const json = JSON.stringify(state).replace(/</g, '\\u003c')
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>NATION Strategy to Execution</title>
<style id="app-css">${css}</style>
</head>
<body>
<div id="root"></div>
<script type="application/json" id="plan-edits">${json}</script>
<script type="module" id="app-js">${js}</script>
</body>
</html>
`
}

/** Load embedded/stored edits before the first render. */
export function initPlanStore() {
  // Inside claude.ai the page itself is the record; elsewhere this browser's storage is.
  const inViewer = !!document.getElementById('app-js') && typeof (window as unknown as { claude?: { use?: unknown } }).claude?.use === 'function'
  let loaded: unknown = null
  try {
    const el = document.getElementById('plan-edits')
    if (el?.textContent?.trim()) loaded = JSON.parse(el.textContent)
  } catch { /* ignore malformed */ }
  if (!loaded && !inViewer) {
    try { const raw = localStorage.getItem(LOCAL_KEY); if (raw) loaded = JSON.parse(raw) } catch { /* ignore */ }
  }
  edits = sanitize(loaded)
  apply()
  restoredUi = takeRestoredUi()
  if (!inViewer) { saveMode = 'local'; emit(); return }
  const claude = (window as unknown as { claude: { use: (n: string) => Promise<unknown> } }).claude
  claude.use('artifact').then((ns) => {
    if (ns && typeof (ns as { publish?: unknown }).publish === 'function') {
      artifactNs = ns as typeof artifactNs
      saveMode = 'artifact'
    } else {
      saveMode = 'local'
    }
    emit()
  }).catch(() => { saveMode = 'local'; emit() })
}
