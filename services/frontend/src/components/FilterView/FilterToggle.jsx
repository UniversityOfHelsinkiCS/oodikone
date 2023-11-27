import React from 'react'
import { Popup, Button, Icon } from 'semantic-ui-react'

export const FilterToggle = ({ active, applyFilter, clearFilter, popupContent }) => {
  const toggleFilter = () => {
    if (active) {
      clearFilter()
    } else {
      applyFilter()
    }
  }

  const Toggle = () => (
    <Button onClick={toggleFilter} size="mini" icon basic={!active} primary={active}>
      <Icon name="filter" />
    </Button>
  )

  // Trigger must be wrapped in <div> for the tooltip to work.
  // See https://stackoverflow.com/questions/63611315/semantics-popup-does-not-show-up-when-passing-a-custom-component-as-trigger
  return popupContent ? (
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
    <Toggle />
  )
}
