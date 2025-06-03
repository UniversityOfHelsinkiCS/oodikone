import { Popup, Button, Icon } from 'semantic-ui-react'

export const FilterToggle = ({ active, applyFilter, clearFilter, popupContent, disabled }) => {
  const toggleFilter = () => (active ? clearFilter() : applyFilter())
  const Toggle = (
    <Button basic={!active} disabled={disabled} icon onClick={toggleFilter} primary={active} size="mini">
      <Icon name="filter" />
    </Button>
  )

  return !disabled && popupContent ? (
    <Popup content={popupContent} size="mini" trigger={Toggle} />
  ) : (
    <div style={{ cursor: disabled ? 'not-allowed' : 'default' }}>{Toggle}</div>
  )
}
