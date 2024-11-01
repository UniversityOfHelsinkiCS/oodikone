import { Icon } from 'semantic-ui-react'

interface FilterToggleIconProps {
  isActive: boolean
  onClick: () => void
}

export const FilterToggleIcon = ({ isActive, onClick }: FilterToggleIconProps) => (
  <span style={{ alignItems: 'flex-end', cursor: 'pointer', display: 'inline-flex' }}>
    <Icon name="filter" onClick={onClick} />
    <Icon
      color={isActive ? 'red' : undefined}
      name={isActive ? 'remove' : 'add'}
      onClick={onClick}
      size="tiny"
      style={{ marginLeft: '-9px' }}
    />
  </span>
)
