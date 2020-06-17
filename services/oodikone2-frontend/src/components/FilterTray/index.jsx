import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import lodash from 'lodash'
import { Button, Card, Header, Icon, Label } from 'semantic-ui-react'
import './filterTray.css'
import { useStore } from 'react-hookstore'
import TotalCredits from './filters/TotalCredits'
import Gender from './filters/Gender'
import StartYearAtUni from './filters/StartYearAtUni'
import Sidebar from '../Sidebar'

const FilterTray = ({ setFilteredStudents, allStudents, filteredStudents, children }) => {
  const [clickSaver] = useStore('clickSaver')
  const [open, setOpen] = useState(clickSaver)

  const [activeFilters, setActiveFilters] = useState({})

  const applyFilters = filters =>
    Object.values(filters).reduce((students, nextFilter) => students.filter(nextFilter), allStudents)

  useEffect(() => {
    setFilteredStudents(applyFilters(activeFilters))
  }, [activeFilters, allStudents])

  const addFilter = (name, filterFn) => setActiveFilters(prev => ({ ...prev, [name]: filterFn }))
  const removeFilter = name => setActiveFilters(prev => lodash.omit(prev, name))

  /**
   * Apply all active filters except for the one named as the argument.
   * This provides a way for a filter to count objects without itself affecting the sample.
   * @param {string} name Name of the filter to skip.
   */
  const withoutFilter = name => applyFilters(lodash.omit(activeFilters, name))

  const filterControl = { addFilter, removeFilter, withoutFilter, allStudents, filteredStudents }

  const noFilters = Object.keys(activeFilters).length

  return (
    <>
      <Sidebar open={open}>
        <Sidebar.Pusher>
          <Card.Group id="filter-tray">
            <Header size="medium">
              <Header.Content>
                Filters
                {noFilters > 0 && (
                  <Label color="blue" size="small">
                    <Icon name="filter" />
                    {noFilters}
                  </Label>
                )}
              </Header.Content>
              <div>
                <Icon name="bars" size="large" />
              </div>
            </Header>
            <TotalCredits filterControl={filterControl} />
            <Gender filterControl={filterControl} />
            <StartYearAtUni filterControl={filterControl} />
          </Card.Group>
          <div className="filter-tray-toggle inline-toggle" style={{ visibility: open ? 'visible' : 'hidden' }}>
            <Button secondary onClick={() => setOpen(false)}>
              <Icon name="angle double up" />
              <div className="button-label">Close Filters</div>
              <Icon name="angle double up" />
            </Button>
          </div>
        </Sidebar.Pusher>
        <Sidebar.Pushable>{children}</Sidebar.Pushable>
      </Sidebar>
      <div className="filter-tray-toggle" style={{ visibility: allStudents.length > 0 ? 'visible' : 'hidden' }}>
        <Button secondary onClick={() => setOpen(true)}>
          <Icon name="angle double down" />
          <div className="button-label">
            Filters
            {noFilters > 0 && (
              <Label color="grey" size="small">
                <Icon name="filter" />
                {noFilters}
              </Label>
            )}
          </div>
          <Icon name="angle double down" />
        </Button>
      </div>
    </>
  )
}

FilterTray.propTypes = {
  setFilteredStudents: PropTypes.func.isRequired,
  allStudents: PropTypes.arrayOf(PropTypes.shape({})),
  filteredStudents: PropTypes.arrayOf(PropTypes.shape({})),
  children: PropTypes.node.isRequired
}

FilterTray.defaultProps = {
  allStudents: [],
  filteredStudents: []
}

export default FilterTray
