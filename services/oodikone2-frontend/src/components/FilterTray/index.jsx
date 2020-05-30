import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import lodash from 'lodash'
import { Button, Card, Header, Icon } from 'semantic-ui-react'
import './filterTray.css'
import TotalCredits from './filters/TotalCredits'
import Gender from './filters/Gender'
import StartYearAtUni from './filters/StartYearAtUni'
import FilterStatusCard from './FilterStatusCard'
import Sidebar from '../Sidebar'
import FilterControlPanel from './FilterControlPanel'

const FilterTray = ({ setFilteredStudents, allStudents, filteredStudents, children }) => {
  const [open, setOpen] = useState(false)

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
            <Header size="large">
              <Icon name="filter" />
              <Header.Content>Filters</Header.Content>
            </Header>
            <TotalCredits filterControl={filterControl} />
            <Gender filterControl={filterControl} />
            <StartYearAtUni filterControl={filterControl} />
          </Card.Group>
        </Sidebar.Pusher>
        <Sidebar.Pushable>{children}</Sidebar.Pushable>
      </Sidebar>
      <FilterControlPanel open={open} setOpen={setOpen} noFilters={noFilters} />
      <div id="filter-tray-toggle" style={{ visibility: allStudents.length > 0 ? 'visible' : 'hidden' }}>
        <Button secondary onClick={() => setOpen(true)}>
          <Icon name="angle double down" />
          <div>
            Filters
            {noFilters > 0 ? <span className="no-filters">{` (${noFilters} active)`}</span> : null}
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
