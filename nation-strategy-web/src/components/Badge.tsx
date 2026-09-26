import type { Basis } from '../data/nationPlan'

const LABEL: Record<Basis, string> = {
  meeting: 'From Meeting',
  meeting26: 'Meeting 26 ก.ย.',
  proposal: 'Mac Proposal',
  pending: 'TBC',
}
const ICON: Record<Basis, string> = { meeting: '●', meeting26: '●', proposal: '◆', pending: '◌' }

export function Badge({ kind, small }: { kind: Basis; small?: boolean }) {
  return (
    <span className={`badge badge-${kind}${small ? ' badge-sm' : ''}`}>
      <span aria-hidden="true">{ICON[kind]}</span> {LABEL[kind]}
    </span>
  )
}
