import { useState } from 'react'
import { useApp } from '../lib/appContext'
import { canUndo, editCount, getSaveState, resetAll, saveNow, undo } from '../lib/planStore'
import { monthShort } from '../lib/dates'
import { Icon } from './Icon'

function stamp(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getDate()} ${monthShort(d.getMonth() + 1)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function statusText() {
  const save = getSaveState()
  if (save.status === 'saving') return save.message || 'Saving…'
  if (save.status === 'dirty') return save.message || 'มีการแก้ไข — จะบันทึกอัตโนมัติ'
  if (save.status === 'readonly' || save.status === 'error') return save.message
  return save.savedAt ? `Saved ${stamp(save.savedAt)}${save.mode === 'local' ? ' (ในเบราว์เซอร์นี้)' : ''}` : 'Baseline — ยังไม่มีการแก้ไข'
}

/** Present ⇄ Edit switch shown in the top bar. */
export function ModeSwitch() {
  const { editMode, setEditMode } = useApp()
  const save = getSaveState()
  return (
    <div className="mode-switch" role="group" aria-label="โหมด">
      <button type="button" className={`ms-opt${!editMode ? ' on' : ''}`} aria-pressed={!editMode} onClick={() => setEditMode(false)}>
        <Icon name="rocket" size={16} /><span>Present</span>
      </button>
      <button type="button" className={`ms-opt seg-edit${editMode ? ' on' : ''}`} aria-pressed={editMode} onClick={() => setEditMode(!editMode)} disabled={save.status === 'readonly'} title={save.status === 'readonly' ? save.message : 'แก้คำ วันที่ และผู้รับผิดชอบ'}>
        <Icon name="review" size={16} /><span>Edit</span>
      </button>
    </div>
  )
}

/** Toolbar pinned to the bottom of the screen while in Edit mode. */
export function EditDock() {
  const { editMode, setEditMode } = useApp()
  const [confirmReset, setConfirmReset] = useState(false)
  const save = getSaveState()
  if (!editMode) return null
  return (
    <div className="edit-dock" role="region" aria-label="แก้ไขแผน">
      <span className="dock-title"><Icon name="review" size={18} />Edit mode</span>
      <span className={`save-chip save-${save.status}`} role="status" aria-live="polite">
        <span className="save-dot" aria-hidden="true" />{statusText()}
      </span>
      <button type="button" className="seg" onClick={undo} disabled={!canUndo()}>↶ Undo</button>
      {(save.status === 'dirty' || save.status === 'error') && <button type="button" className="seg" onClick={() => void saveNow()}>Save now</button>}
      {editCount() > 0 && (confirmReset
        ? <span className="confirm"><span>คืนค่าเดิมทั้งหมด?</span><button type="button" className="seg danger" onClick={() => { resetAll(); setConfirmReset(false) }}>Reset</button><button type="button" className="seg" onClick={() => setConfirmReset(false)}>Cancel</button></span>
        : <button type="button" className="seg" onClick={() => setConfirmReset(true)}>Reset all</button>)}
      <span className="dock-hint">คลิกข้อความที่มีเส้นประเพื่อแก้คำ · Timeline ลากปรับวันได้</span>
      <button type="button" className="seg seg-present" onClick={() => setEditMode(false)}><Icon name="check" size={16} />Done → Present</button>
    </div>
  )
}
