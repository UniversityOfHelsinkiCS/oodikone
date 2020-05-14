import React, { useState, useEffect } from 'react'
import lodash from 'lodash'
import { Sidebar, Segment, Button, Card, Header, Icon } from 'semantic-ui-react'
import './filterTray.css'
import TotalCredits from './filters/TotalCredits'
import Gender from './filters/Gender'

export default ({ setFilteredStudents, allStudents }) => {
  const [open, setOpen] = useState(false)

  const [activeFilters, setActiveFilters] = useState({})

  useEffect(() => {
    const filters = Object.values(activeFilters)
    const filtered = filters.reduce((students, nextFilter) => students.filter(nextFilter), allStudents)
    setFilteredStudents(filtered)
  }, [activeFilters, allStudents])

  const addFilter = (name, filterFn) => setActiveFilters(prev => ({ ...prev, [name]: filterFn }))
  const removeFilter = name => setActiveFilters(prev => lodash.omit(prev, name))
  const filterControl = { addFilter, removeFilter }

  return (
    <>
      <div id="filter-tray-toggle">
        <Button secondary onClick={() => setOpen(true)}>
          Filters
        </Button>
      </div>
      <div id="filter-tray">
        <Sidebar.Pushable as={Segment.Group} raised className="filter-tray-content">
          <Sidebar
            as="div"
            animation="overlay"
            icon="labeled"
            onHide={() => setOpen(false)}
            direction="left"
            visible={open}
            width="thin"
          >
            <Card.Group>
              <Header size="large">
                <Icon name="filter" />
                <Header.Content>Filters</Header.Content>
              </Header>
              <TotalCredits filterControl={filterControl} />
              <Gender filterControl={filterControl} />
            </Card.Group>
            <div>
              <Button secondary onClick={() => setOpen(false)}>
                Close Filters
              </Button>
            </div>
          </Sidebar>
        </Sidebar.Pushable>
      </div>
    </>
  )
}
