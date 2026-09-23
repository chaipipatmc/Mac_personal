import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppContext, type AppApi } from './lib/appContext'
import { SCENES, buildHash, parseHash, type SceneId, type Selection, type TimelineFocus } from './lib/selection'
import { TopBar, BottomNav } from './components/Navigation'
import { DetailPanel } from './components/DetailPanel'
import { DirectionScene } from './components/DirectionScene'
import { StrategyMap } from './components/StrategyMap'
import { ValueFlow } from './components/ValueFlow'
import { PriorityLanes } from './components/PriorityLanes'
import { DependencyMap } from './components/DependencyMap'
import { InteractiveGantt } from './components/InteractiveGantt'
import { AcceptanceScene } from './components/AcceptanceScene'
import { DecisionSummary } from './components/DecisionSummary'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function selectionFromFocus(focus: TimelineFocus): Selection | null {
  if (focus.task) return { kind: 'task', id: focus.task }
  if (focus.milestone) return { kind: 'milestone', id: focus.milestone }
  if (focus.workstream) return { kind: 'workstream', id: focus.workstream }
  return null
}

const TIMELINE_KINDS = new Set(['task', 'milestone', 'workstream'])

export default function App() {
  const initial = useMemo(() => parseHash(window.location.hash), [])
  const [active, setActive] = useState<SceneId>(initial.scene)
  const [selection, setSelection] = useState<Selection | null>(() => selectionFromFocus(initial.focus))
  const [timelineFocus, setTimelineFocus] = useState<TimelineFocus>(initial.focus)
  const triggerRef = useRef<HTMLElement | null>(null)
  const lockSpyUntil = useRef(0)
  const activeRef = useRef(active)
  activeRef.current = active

  const scrollToScene = useCallback((scene: SceneId, smooth = true) => {
    const el = document.getElementById(scene)
    if (!el) return
    lockSpyUntil.current = Date.now() + 900
    el.scrollIntoView({ behavior: smooth && !reducedMotion() ? 'smooth' : 'auto', block: 'start' })
    setActive(scene)
  }, [])

  const applyFocus = useCallback((focus: TimelineFocus) => {
    setTimelineFocus(focus)
    const sel = selectionFromFocus(focus)
    setSelection(sel)
  }, [])

  const goScene = useCallback((scene: SceneId, focus: TimelineFocus = {}) => {
    const hash = buildHash(scene, focus)
    if (hash !== window.location.hash) window.history.pushState(null, '', hash)
    scrollToScene(scene)
    if (scene === 'timeline' && Object.keys(focus).length) applyFocus(focus)
  }, [scrollToScene, applyFocus])

  const openInTimeline = useCallback((focus: TimelineFocus) => {
    triggerRef.current = null
    goScene('timeline', focus)
  }, [goScene])

  const select = useCallback((sel: Selection, trigger?: HTMLElement | null) => {
    if (trigger !== undefined) triggerRef.current = trigger
    else if (document.activeElement instanceof HTMLElement && !document.activeElement.closest('.panel')) triggerRef.current = document.activeElement
    setSelection(sel)
    if (TIMELINE_KINDS.has(sel.kind)) {
      const focus: TimelineFocus = sel.kind === 'task' ? { task: sel.id } : sel.kind === 'milestone' ? { milestone: sel.id as TimelineFocus['milestone'] } : { workstream: sel.id as TimelineFocus['workstream'] }
      setTimelineFocus((prev) => sel.kind === 'milestone' && prev.workstream ? { ...focus, workstream: prev.workstream } : focus)
    }
  }, [])

  const close = useCallback(() => {
    setSelection(null)
    const t = triggerRef.current
    triggerRef.current = null
    if (t && document.contains(t)) t.focus({ preventScroll: true })
  }, [])

  // Initial scroll + Back/Forward.
  useEffect(() => {
    if (window.location.hash) requestAnimationFrame(() => scrollToScene(initial.scene, false))
    const onPop = () => {
      const r = parseHash(window.location.hash)
      scrollToScene(r.scene, false)
      if (Object.keys(r.focus).length) applyFocus(r.focus)
      else { setSelection(null); setTimelineFocus({}) }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [initial.scene, scrollToScene, applyFocus])

  // Keep a shareable hash for the Timeline selection.
  useEffect(() => {
    if (active !== 'timeline') return
    const hash = buildHash('timeline', selection && TIMELINE_KINDS.has(selection.kind) ? timelineFocus : {})
    if (hash !== window.location.hash) window.history.replaceState(null, '', hash)
  }, [active, selection, timelineFocus])

  // Scroll spy.
  useEffect(() => {
    const els = SCENES.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver((entries) => {
      if (Date.now() < lockSpyUntil.current) return
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (!hit) return
      const id = hit.target.id as SceneId
      if (id !== activeRef.current) {
        setActive(id)
        window.history.replaceState(null, '', buildHash(id))
      }
    }, { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.01] })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Arrow keys step through scenes when focus is not inside an interactive region.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      const t = e.target as HTMLElement
      if (t.closest('input, select, textarea, .panel, .gantt-scroll, [role="toolbar"], [role="dialog"]')) return
      const i = SCENES.findIndex((s) => s.id === activeRef.current)
      const next = SCENES[i + (e.key === 'ArrowRight' ? 1 : -1)]
      if (next) { e.preventDefault(); goScene(next.id) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goScene])

  useEffect(() => {
    document.body.classList.toggle('panel-open', !!selection)
  }, [selection])

  const api: AppApi = useMemo(() => ({
    selection, select, close, goScene, openInTimeline, timelineFocus,
    isSelected: (kind, id) => selection?.kind === kind && selection.id === id,
  }), [selection, select, close, goScene, openInTimeline, timelineFocus])

  return (
    <AppContext.Provider value={api}>
      <a className="skip" href="#timeline" onClick={(e) => { e.preventDefault(); goScene('timeline') }}>ข้ามไป Timeline</a>
      <TopBar active={active} />
      <main id="main">
        <DirectionScene />
        <StrategyMap />
        <ValueFlow />
        <PriorityLanes />
        <DependencyMap />
        <InteractiveGantt />
        <AcceptanceScene />
        <DecisionSummary />
        <footer className="site-footer">
          <p>ร่างเพื่อหารือและอนุมัติ · ข้อมูล ณ 23 ก.ย. 2026 · ภาพแผน ไม่ใช่ Live Tracker</p>
          <button type="button" className="link-btn" onClick={(e) => select({ kind: 'about', id: 'about' }, e.currentTarget)}>ที่มาข้อมูลและข้อจำกัด</button>
        </footer>
      </main>
      <BottomNav active={active} />
      <DetailPanel />
    </AppContext.Provider>
  )
}
