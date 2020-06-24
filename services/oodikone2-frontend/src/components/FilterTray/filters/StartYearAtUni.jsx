import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown } from 'semantic-ui-react'
import ClearFilterButton from './common/ClearFilterButton'
import FilterCard from './common/FilterCard'

const StartYearAtUni = ({ filterControl }) => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = filterControl

  const [value, setValue] = useState([])
  const name = 'startYearAtUni'
  const isActive = () => value.length > 0

  useEffect(() => {
    if (!isActive()) {
      removeFilter(name)
    } else {
      addFilter(name, student => value.some(year => year === new Date(student.started).getFullYear()))
    }
  }, [value])

  const countsByYear = {}
  withoutFilter(name).forEach(student => {
    const year = new Date(student.started).getFullYear()
    countsByYear[year] = countsByYear[year] ? countsByYear[year] + 1 : 1
  })

  const options = Object.keys(countsByYear).map(year => ({
    key: `year-${year}`,
    text: `${year} (${countsByYear[year]})`,
    value: Number(year)
  }))

  return (
    <FilterCard
      title="Starting Year at University"
      footer={<ClearFilterButton disabled={!isActive()} onClick={() => setValue([])} />}
      active={Object.keys(activeFilters).includes(name)}
    >
      <Form>
        <Dropdown
          multiple
          selection
          fluid
          options={options}
          button
          className="mini"
          placeholder="No Filter"
          onChange={(_, { value: inputValue }) => setValue(inputValue)}
          value={value}
        />
      </Form>
    </FilterCard>
  )
}

StartYearAtUni.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired,
    activeFilters: PropTypes.object.isRequired
  }).isRequired
}

export default StartYearAtUni
