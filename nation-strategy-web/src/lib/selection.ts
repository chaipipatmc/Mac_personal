import type { MilestoneId, WorkstreamId } from '../data/nationPlan'

export type SelKind =
  | 'workstream' | 'task' | 'milestone' | 'outcome' | 'r1func' | 'flow' | 'path' | 'extra'
  | 'priority' | 'candidate' | 'depnode' | 'checkpoint' | 'decision' | 'weekly' | 'p3' | 'about'

export interface Selection { kind: SelKind; id: string }

export const SCENES = [
  { id: 'direction', nav: 'ทิศทาง', no: '01', chapter: 'A' },
  { id: 'plan', nav: 'แผนงาน', no: '02', chapter: 'A' },
  { id: 'value', nav: 'คุณค่า', no: '03', chapter: 'A' },
  { id: 'priority', nav: 'ก่อน–หลัง', no: '04', chapter: 'B' },
  { id: 'dependency', nav: 'งานเชื่อมกัน', no: '05', chapter: 'B' },
  { id: 'timeline', nav: 'Timeline', no: '06', chapter: 'B' },
  { id: 'acceptance', nav: 'ตรวจรับ', no: '07', chapter: 'B' },
  { id: 'decision', nav: 'ขออนุมัติ', no: '08', chapter: 'B' },
] as const

export type SceneId = (typeof SCENES)[number]['id']

export interface TimelineFocus {
  workstream?: WorkstreamId
  milestone?: MilestoneId
  task?: string
}

export interface Route {
  scene: SceneId
  focus: TimelineFocus
}

const sceneIds = SCENES.map((s) => s.id) as readonly string[]

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '')
  const [scenePart, query = ''] = raw.split('?')
  const scene = (sceneIds.includes(scenePart) ? scenePart : 'direction') as SceneId
  const p = new URLSearchParams(query)
  const focus: TimelineFocus = {}
  const ws = p.get('workstream')
  const ms = p.get('milestone')
  const task = p.get('task')
  if (ws && /^R[1-7]$/.test(ws)) focus.workstream = ws as WorkstreamId
  if (ms && /^M[0-7]$/.test(ms)) focus.milestone = ms as MilestoneId
  if (task && /^T(0[1-9]|1\d|2[01])$/.test(task)) focus.task = task
  return { scene, focus }
}

export function buildHash(scene: SceneId, focus: TimelineFocus = {}): string {
  const p = new URLSearchParams()
  if (focus.workstream) p.set('workstream', focus.workstream)
  if (focus.milestone) p.set('milestone', focus.milestone)
  if (focus.task) p.set('task', focus.task)
  const q = p.toString()
  return `#${scene}${q ? `?${q}` : ''}`
}
