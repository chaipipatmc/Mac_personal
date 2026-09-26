// Integrity checks for src/data/nationPlan.ts — run with `npm run check:data`.
import {
  meta, milestones, tasks, workstreams, relations, pilotCandidates, planState, msById, taskById, wsById,
  dependencyPaths, minimumDataMarker, decisions,
} from '../src/data/nationPlan'
import { findCycle } from '../src/lib/graph'
import { dayNumber } from '../src/lib/dates'

const errors: string[] = []
const check = (ok: unknown, msg: string) => { if (!ok) errors.push(msg) }
const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s)

check(workstreams.length === 7, `expected 7 workstreams, got ${workstreams.length}`)
check(tasks.length === 21, `expected 21 tasks, got ${tasks.length}`)
check(milestones.length === 8, `expected 8 milestones, got ${milestones.length}`)
check(milestones.map((m) => m.id).join() === 'M0,M1,M2,M3,M4,M5,M6,M7', 'milestones must be M0–M7 in order')
check(pilotCandidates.length === 4, 'expected 4 pilot candidates')
check(decisions.length === 6, 'expected 6 decisions')
check(planState.selectedPilotIds === null, 'selectedPilotIds must start null')

const start = dayNumber(meta.timelineStart)
const end = dayNumber(meta.timelineEnd)

const expectedMs: Record<string, string> = {
  M0: '2026-09-30', M1: '2026-10-01', M2: '2026-10-09', M3: '2026-10-23',
  M4: '2026-11-13', M5: '2026-12-04', M6: '2026-12-18', M7: '2026-12-31',
}
for (const m of milestones) {
  check(isIso(m.date), `${m.id} date not ISO`)
  check(m.date === expectedMs[m.id], `${m.id} date ${m.date} != ${expectedMs[m.id]}`)
  check(m.actualStatus === 'unconfirmed', `${m.id} actualStatus must be unconfirmed`)
  for (const t of m.fedBy) check(taskById[t], `${m.id} fedBy unknown ${t}`)
}
check(msById.M1.dateBasis === 'meeting_date', 'M1 must be meeting_date')
check(msById.M7.dateBasis === 'meeting_year_end', 'M7 must be meeting_year_end')

for (const t of tasks) {
  check(isIso(t.start) && isIso(t.end), `${t.id} dates not ISO`)
  check(dayNumber(t.start) <= dayNumber(t.end), `${t.id} start after end`)
  check(dayNumber(t.start) >= start && dayNumber(t.end) <= end, `${t.id} outside timeline`)
  check(wsById[t.workstreamId], `${t.id} unknown workstream`)
  check(t.progressPercent === null && t.actualStart === null && t.actualEnd === null, `${t.id} must not carry actuals`)
  for (const p of t.predecessors) {
    check(taskById[p] || msById[p as keyof typeof msById], `${t.id} unknown predecessor ${p}`)
    const pEnd = taskById[p]?.end ?? msById[p as keyof typeof msById]?.date
    if (pEnd) check(dayNumber(pEnd) < dayNumber(t.start), `${t.id} starts before predecessor ${p} ends`)
  }
  for (const c of t.checkpoints) {
    const d = c.milestoneId ? msById[c.milestoneId]?.date : c.date
    check(d && dayNumber(d) >= dayNumber(t.start) && dayNumber(d) <= dayNumber(t.end), `${t.id} checkpoint ${c.label} outside its bar`)
    check(!(c.milestoneId && t.predecessors.includes(c.milestoneId)), `${t.id} uses ${c.milestoneId} as both predecessor and checkpoint`)
  }
}
// Business rules from the prompt.
check(!taskById.T18.predecessors.some((p) => p.startsWith('T1') && taskById[p]?.workstreamId === 'R5'), 'Government must not wait for Audience')
check(!taskById.T21.predecessors.some((p) => ['M4', 'M5'].includes(p)), 'Local must not wait for AI M4/M5')
check(minimumDataMarker.date === '2026-11-06' && !milestones.some((m) => m.date === minimumDataMarker.date), '6 Nov marker must not be a milestone')
for (const r of relations) check(r.type !== 'hard_gate', `workstream relation ${r.from}->${r.to} must be supporting, not hard_gate`)
for (const p of dependencyPaths) for (const l of p.lanes) for (const n of l.nodes) {
  if (n.ref?.task) check(taskById[n.ref.task], `dep node ${n.id} unknown task`)
  if (n.ref?.milestone) check(msById[n.ref.milestone], `dep node ${n.id} unknown milestone`)
}
const cycle = findCycle()
check(!cycle, `dependency cycle: ${cycle?.join(' → ')}`)

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`✓ data OK — ${workstreams.length} workstreams, ${tasks.length} work packages, ${milestones.length} milestones, no cycles`)
