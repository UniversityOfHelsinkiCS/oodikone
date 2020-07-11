import React from 'react'
import PropTypes from 'prop-types'
import { Button, Card, Header, Icon, Label, Popup } from 'semantic-ui-react'
import './filterTray.css'
import { getTranslate } from 'react-localize-redux'
import { connect } from 'react-redux'
import Sidebar from '../Sidebar'
import useFilterTray from './useFilterTray'
import useFilters from './useFilters'

export const contextKey = 'filterTray'

const FilterTray = ({ children, translate, filterSet }) => {
  const [open, setOpen] = useFilterTray(contextKey)
  const { allStudents, activeFilters } = useFilters()

  const noFilters = Object.keys(activeFilters).length

  return (
    <>
      <Sidebar open={open}>
        <Sidebar.Pusher>
          <Card.Group id="filter-tray">
            <Header size="medium">
              <Header.Content>
                {translate('filters.trayTitle')}
                {noFilters > 0 && (
                  <Popup
                    content={translate('filters.filterCountTooltip')}
                    position="bottom center"
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
              </Header.Content>
              <div>
                <Icon name="bars" size="large" />
              </div>
            </Header>
            {filterSet}
          </Card.Group>
          <div className="filter-tray-toggle inline-toggle" style={{ visibility: open ? 'visible' : 'hidden' }}>
            <Button secondary onClick={() => setOpen(false)} data-cy="filter-toggle-close">
              <Icon name="angle double up" />
              <div className="button-label">{translate('filters.trayClose')}</div>
              <Icon name="angle double up" />
            </Button>
          </div>
        </Sidebar.Pusher>
        <Sidebar.Pushable>{children}</Sidebar.Pushable>
      </Sidebar>
      <div className="filter-tray-toggle" style={{ visibility: allStudents.length > 0 ? 'visible' : 'hidden' }}>
        <Button secondary onClick={() => setOpen(true)} data-cy="filter-toggle-open">
          <Icon name="angle double down" />
          <div className="button-label">
            {translate('filters.trayOpen')}
            {noFilters > 0 && (
              <Popup
                content={translate('filters.filterCountTooltip')}
                position="right center"
                pinned
                size="mini"
                on="hover"
                trigger={
                  <Label color="grey" size="small">
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
  translate: PropTypes.func.isRequired,
  filterSet: PropTypes.node.isRequired
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(FilterTray)
