import { useEffect, useRef, useState, useSyncExternalStore, type ElementType } from 'react'
import { useApp } from '../lib/appContext'
import { getText, hasText, setText } from '../lib/planStore'

/**
 * Editable wording.
 *
 * Present mode: renders the text (override if one was saved).
 * Edit mode: the text gets a dashed underline; clicking it opens the
 * text editor instead of whatever the surrounding card would do.
 *
 * Pass `k` for free wording (stored as a text override), or `value` + `onSave`
 * for text that belongs to plan data (task title, owner, milestone label …).
 */
interface Props {
  k?: string
  v?: string
  value?: string
  onSave?: (v: string) => void
  onReset?: () => void
  label?: string
  multiline?: boolean
  as?: ElementType
  className?: string
}

// ---- editor state (one dialog for the whole page) ---------------------------
interface EditorReq {
  label: string
  value: string
  original: string
  multiline: boolean
  save: (v: string) => void
  reset?: () => void
  anchor: HTMLElement | null
}
let current: EditorReq | null = null
const subs = new Set<() => void>()
const setCurrent = (r: EditorReq | null) => { current = r; subs.forEach((f) => f()) }
const useEditor = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => current)

export function E({ k, v = '', value, onSave, onReset, label, multiline, as: Tag = 'span', className }: Props) {
  const { editMode } = useApp()
  const shown = k ? getText(k, v) : (value ?? v)
  if (!editMode) return <Tag className={className}>{shown}</Tag>
  const open = (el: HTMLElement) => setCurrent({
    label: label ?? (k ? k : 'Text'),
    value: shown,
    original: k ? v : shown,
    multiline: !!multiline || shown.length > 60,
    save: (nv) => { if (k) setText(k, nv === v ? null : nv); else onSave?.(nv) },
    reset: k ? (hasText(k) ? () => setText(k, null) : undefined) : onReset,
    anchor: el,
  })
  return (
    <Tag
      className={`${className ?? ''} editable${k && hasText(k) ? ' is-edited-text' : ''}`}
      role="button"
      tabIndex={0}
      title="คลิกเพื่อแก้คำ"
      onClick={(e: React.MouseEvent<HTMLElement>) => { e.preventDefault(); e.stopPropagation(); open(e.currentTarget) }}
      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); open(e.currentTarget) }
      }}
    >{shown}</Tag>
  )
}

/** The single floating editor used by every <E>. */
export function TextEditor() {
  const req = useEditor()
  const [val, setVal] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (!req) return
    setVal(req.value)
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.select() })
  }, [req])
  if (!req) return null
  const close = () => { const a = req.anchor; setCurrent(null); if (a && document.contains(a)) a.focus({ preventScroll: true }) }
  const save = () => { const t = val.trim(); if (t && t !== req.value) req.save(t); close() }
  return (
    <div className="text-editor" role="dialog" aria-modal="true" aria-labelledby="te-label" onKeyDown={(e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
      if (e.key === 'Enter' && (!req.multiline || e.metaKey || e.ctrlKey)) { e.preventDefault(); save() }
    }}>
      <div className="te-card">
        <p className="te-label" id="te-label">✎ แก้คำ <span className="muted">· {req.label}</span></p>
        <textarea id="te-input" ref={ref} rows={req.multiline ? 4 : 2} value={val} onChange={(e) => setVal(e.target.value)} />
        {req.original !== req.value && <p className="te-orig">เดิม: {req.original}</p>}
        <div className="te-actions">
          <button type="button" className="btn btn-primary" onClick={save}>Save</button>
          <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
          {req.reset && <button type="button" className="seg" onClick={() => { req.reset!(); close() }}>Reset to original</button>}
          <span className="te-hint">{req.multiline ? 'Ctrl/⌘ + Enter = Save' : 'Enter = Save'} · Esc = Cancel</span>
        </div>
      </div>
    </div>
  )
}
