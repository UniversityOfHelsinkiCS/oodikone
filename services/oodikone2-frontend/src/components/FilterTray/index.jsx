import React from 'react'
import PropTypes from 'prop-types'
import { Button, Card, Header, Icon, Label, Popup } from 'semantic-ui-react'
import './filterTray.css'
import Sidebar from '../Sidebar'
import useFilterTray from './useFilterTray'
import useFilters from './useFilters'
import useAnalytics from './useAnalytics'

export const contextKey = 'filterTray'

const FilterTray = ({ children, filterSet, visible }) => {
  const [open, setOpen] = useFilterTray(contextKey)
  const { allStudents, activeFilters } = useFilters()
  const analytics = useAnalytics()

  if (!visible) {
    return children
  }

  const noFilters = Object.keys(activeFilters).length

  const openTray = () => {
    setOpen(true)
    analytics.openTray()
  }

  const closeTray = () => {
    setOpen(false)
    analytics.closeTray()
  }

  return (
    <>
      <Sidebar open={open}>
        <Sidebar.Pusher>
          <div id="filter-tray-container">
            <Header size="medium">
              <Header.Content>
                Filters
                {noFilters > 0 && (
                  <Popup
                    content="Number of active filters."
                    position="bottom center"
                    pinned
                    size="mini"
                    on="hover"
                    trigger={
                      <Label color="blue" size="small" data-cy="active-filter-count">
                        <Icon name="filter" />
                        {noFilters}
                      </Label>
                    }
                  />
                )}
              </Header.Content>
              {/*
              <div>
                <Icon name="bars" size="large" />
              </div>
              */}
            </Header>
            <Card.Group id="filter-tray">{filterSet}</Card.Group>
          </div>
          <div className="filter-tray-toggle inline-toggle" style={{ visibility: open ? 'visible' : 'hidden' }}>
            <Button secondary onClick={closeTray} data-cy="filter-toggle-close">
              <Icon name="angle double up" />
              <div className="button-label">Close Filters</div>
              <Icon name="angle double up" />
            </Button>
          </div>
        </Sidebar.Pusher>
        <Sidebar.Pushable>{children}</Sidebar.Pushable>
      </Sidebar>
      <div className="filter-tray-toggle" style={{ visibility: allStudents.length > 0 ? 'visible' : 'hidden' }}>
        <Button secondary onClick={openTray} data-cy="filter-toggle-open">
          <Icon name="angle double down" />
          <div className="button-label">
            Filters
            {noFilters > 0 && (
              <Popup
                content="Number of active filters."
                position="right center"
                pinned
                size="mini"
                on="hover"
                trigger={
                  <Label color="blue" size="small">
                    <Icon name="filter" />
                    {noFilters}
                  </Label>
                }
              />
            )}
          </div>
          <Icon name="angle double down" />
        </Button>
      </div>
    </>
  )
}

FilterTray.propTypes = {
  children: PropTypes.node.isRequired,
  filterSet: PropTypes.node.isRequired,
  visible: PropTypes.bool
}

FilterTray.defaultProps = {
  visible: true
}

export default FilterTray
