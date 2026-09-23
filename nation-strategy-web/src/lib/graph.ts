import { milestones, msById, relations, tasks, taskById, isMilestoneId, type MilestoneId, type WorkstreamId } from '../data/nationPlan'

/** Strict predecessors (tasks and milestone gates) of a task. */
export const taskPreds = (id: string) => taskById[id]?.predecessors ?? []

/** Tasks that list `id` (task or milestone) as a strict predecessor. */
export const successorsOf = (id: string) => tasks.filter((t) => t.predecessors.includes(id)).map((t) => t.id)

/** Tasks whose output feeds a milestone gate. */
export const milestoneInputs = (id: MilestoneId) => msById[id].fedBy

/** Tasks that review this milestone inside their bar. */
export const checkpointTasks = (id: MilestoneId) =>
  tasks.filter((t) => t.checkpoints.some((c) => c.milestoneId === id)).map((t) => t.id)

/** Milestones a task's output feeds. */
export const milestonesFedBy = (taskId: string) => milestones.filter((m) => m.fedBy.includes(taskId)).map((m) => m.id)

export const supportRelations = (ws: WorkstreamId) =>
  relations.filter((r) => r.from === ws || r.to === ws)

export interface Related {
  items: Set<string>
  /** Edges to draw: [from, to, kind] where from/to are task or milestone ids. */
  edges: { from: string; to: string; kind: 'hard' | 'support' | 'checkpoint' }[]
}

/**
 * Highlight set for the Gantt: the selected item plus its direct
 * predecessors/successors. Only direct neighbours are shown so the chart
 * never draws every line at once.
 */
export function relatedTo(id: string | null): Related {
  const items = new Set<string>()
  const edges: Related['edges'] = []
  if (!id) return { items, edges }
  items.add(id)
  if (isMilestoneId(id)) {
    for (const t of milestoneInputs(id)) { items.add(t); edges.push({ from: t, to: id, kind: 'hard' }) }
    for (const t of successorsOf(id)) { items.add(t); edges.push({ from: id, to: t, kind: 'hard' }) }
    for (const t of checkpointTasks(id)) { items.add(t) }
    return { items, edges }
  }
  if (taskById[id]) {
    for (const p of taskPreds(id)) { items.add(p); edges.push({ from: p, to: id, kind: 'hard' }) }
    for (const s of successorsOf(id)) { items.add(s); edges.push({ from: id, to: s, kind: 'hard' }) }
    for (const m of milestonesFedBy(id)) { items.add(m); edges.push({ from: id, to: m, kind: 'hard' }) }
    for (const c of taskById[id].checkpoints) if (c.milestoneId) items.add(c.milestoneId)
    return { items, edges }
  }
  // Workstream: all its tasks + supporting relations (dashed, not scheduling).
  const ws = id as WorkstreamId
  for (const t of tasks) if (t.workstreamId === ws) items.add(t.id)
  for (const r of supportRelations(ws)) {
    const other = r.from === ws ? r.to : r.from
    items.add(other)
  }
  return { items, edges }
}

/** Detect cycles among strict dependencies (tasks + milestone gates). */
export function findCycle(): string[] | null {
  const adj = new Map<string, string[]>()
  const add = (a: string, b: string) => adj.set(a, [...(adj.get(a) ?? []), b])
  for (const t of tasks) for (const p of t.predecessors) add(p, t.id)
  for (const m of milestones) for (const t of m.fedBy) add(t, m.id)
  const state = new Map<string, 1 | 2>()
  const stack: string[] = []
  const visit = (n: string): string[] | null => {
    if (state.get(n) === 2) return null
    if (state.get(n) === 1) return [...stack.slice(stack.indexOf(n)), n]
    state.set(n, 1); stack.push(n)
    for (const nx of adj.get(n) ?? []) { const c = visit(nx); if (c) return c }
    stack.pop(); state.set(n, 2)
    return null
  }
  for (const n of adj.keys()) { const c = visit(n); if (c) return c }
  return null
}
