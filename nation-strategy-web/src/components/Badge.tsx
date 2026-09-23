import type { Basis } from '../data/nationPlan'

const LABEL: Record<Basis, string> = {
  meeting: 'จากประชุม',
  proposal: 'แผนที่ Mac เสนอ',
  pending: 'รอยืนยัน',
}
const ICON: Record<Basis, string> = { meeting: '●', proposal: '◆', pending: '◌' }

export function Badge({ kind, small }: { kind: Basis; small?: boolean }) {
  return (
    <span className={`badge badge-${kind}${small ? ' badge-sm' : ''}`}>
      <span aria-hidden="true">{ICON[kind]}</span> {LABEL[kind]}
    </span>
  )
}
