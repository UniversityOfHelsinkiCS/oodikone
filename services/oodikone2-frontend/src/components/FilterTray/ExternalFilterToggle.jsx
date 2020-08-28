import React from 'react'
import PropTypes from 'prop-types'
import { Popup, Button, Icon } from 'semantic-ui-react'
import { contextKey as filterTrayContextKey } from './index'
import useFilterTray from './useFilterTray'
import useAnalytics from './useAnalytics'

const ExternalFilterToggle = ({
  filterPanelContextKey,
  applyFilter,
  clearFilter,
  filterName,
  active,
  popupContent
}) => {
  const [, setFilterTrayOpen] = useFilterTray(filterTrayContextKey)
  const [, setCreditFilterOpen] = useFilterTray(filterPanelContextKey)
  const filterAnalytics = useAnalytics()

  const updateFilters = () => {
    if (active) {
      clearFilter()
      filterAnalytics.clearFilterViaTable(filterName)
    } else {
      applyFilter()
      filterAnalytics.setFilterViaTable(filterName)

      if (filterPanelContextKey) {
        setFilterTrayOpen(true)
        setCreditFilterOpen(true)
      }
    }
  }

  const Toggle = () => (
    <Button onClick={updateFilters} size="mini" icon basic={!active} primary={active}>
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

ExternalFilterToggle.propTypes = {
  /** Used to open the filter's panel, if given. If not given, the filter tray will not be opened either. */
  filterPanelContextKey: PropTypes.string,
  /** Function to apply the filter when toggled on. */
  applyFilter: PropTypes.func.isRequired,
  /** Function to clear the filter when toggled off. */
  clearFilter: PropTypes.func.isRequired,
  /** Name to display in analytics. */
  filterName: PropTypes.string.isRequired,
  /** Toggle state. Must be controlled in the parent. */
  active: PropTypes.bool.isRequired,
  /** Content to show in the tooltip, if given. Tooltip is not shown if omitted. */
  popupContent: PropTypes.node
}

ExternalFilterToggle.defaultProps = {
  filterPanelContextKey: undefined,
  popupContent: undefined
}

export default ExternalFilterToggle
