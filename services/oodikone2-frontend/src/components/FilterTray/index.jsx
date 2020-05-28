import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import lodash from 'lodash'
import { Sidebar, Segment, Button, Card, Header, Icon } from 'semantic-ui-react'
import './filterTray.css'
import TotalCredits from './filters/TotalCredits'
import Gender from './filters/Gender'
import StartYearAtUni from './filters/StartYearAtUni'

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

  return (
    <>
      <div id="filter-tray">
        <Sidebar.Pushable as="div">
          <Sidebar as="div" animation="uncover" direction="left" visible={open}>
            <Card.Group>
              <Header size="large">
                <Icon name="filter" />
                <Header.Content>Filters</Header.Content>
              </Header>
              <TotalCredits filterControl={filterControl} />
              <Gender filterControl={filterControl} />
              <StartYearAtUni filterControl={filterControl} />
            </Card.Group>
          </Sidebar>
          <Sidebar.Pusher className={open ? 'pushed' : null}>{children}</Sidebar.Pusher>
        </Sidebar.Pushable>
      </div>
      {open ? (
        <Button secondary onClick={() => setOpen(false)} id="filter-close-button">
          Close Filters
        </Button>
      ) : (
        <div id="filter-tray-toggle">
          <Button secondary onClick={() => setOpen(true)}>
            Filters
          </Button>
        </div>
      )}
    </>
  )
}

FilterTray.propTypes = {
  setFilteredStudents: PropTypes.func.isRequired,
  allStudents: PropTypes.arrayOf(PropTypes.shape({})),
  filteredStudents: PropTypes.arrayOf(PropTypes.shape({}))
}

FilterTray.defaultProps = {
  allStudents: [],
  filteredStudents: []
}

export default FilterTray
