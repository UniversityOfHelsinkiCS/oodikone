import { Icon } from 'semantic-ui-react'

import './filterToggleIcon.css'

interface FilterToggleIconProps {
  isActive: boolean
  onClick: () => void
}

export const FilterToggleIcon = ({ isActive, onClick }: FilterToggleIconProps) => (
  <span className={`flexIcon ${isActive ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
    <Icon name="filter" onClick={onClick} />
    <Icon name={isActive ? 'remove' : 'add'} onClick={onClick} size="tiny" />
  </span>
)
