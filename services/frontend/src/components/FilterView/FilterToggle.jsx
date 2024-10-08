import { Popup, Button, Icon } from 'semantic-ui-react'

export const FilterToggle = ({ active, applyFilter, clearFilter, popupContent, disabled }) => {
  const toggleFilter = () => {
    if (active) {
      clearFilter()
    } else {
      applyFilter()
    }
  }

  const Toggle = () => (
    <Button basic={!active} disabled={disabled} icon onClick={toggleFilter} primary={active} size="mini">
      <Icon name="filter" />
    </Button>
  )

  // Trigger must be wrapped in <div> for the tooltip to work.
  // See https://stackoverflow.com/questions/63611315/semantics-popup-does-not-show-up-when-passing-a-custom-component-as-trigger
  return !disabled && popupContent ? (
    <Popup
      content={popupContent}
      size="mini"
      trigger={
        <div>
          <Toggle />
        </div>
      }
    />
  ) : (
    <div style={{ cursor: disabled ? 'not-allowed' : 'default' }}>
      <Toggle />
    </div>
  )
}
