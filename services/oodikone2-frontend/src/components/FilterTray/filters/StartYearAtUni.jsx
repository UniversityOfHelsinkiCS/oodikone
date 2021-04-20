import React, { useState, useEffect } from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import ClearFilterButton from './common/ClearFilterButton'
import FilterCard from './common/FilterCard'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

export default () => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = useFilters()
  const analytics = useAnalytics()

  const [value, setValue] = useState([])
  const name = 'startYearAtUni'
  const isActive = () => value.length > 0

  useEffect(() => {
    if (!isActive()) {
      removeFilter(name)
      analytics.clearFilter(name)
    } else {
      addFilter(name, student => value.some(year => year === new Date(student.started).getFullYear()))
      analytics.setFilter(name, value.join(', '))
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
      title="Starting Year"
      contextKey="startYearFilter"
      footer={<ClearFilterButton disabled={!isActive()} onClick={() => setValue([])} name={name} />}
      active={Object.keys(activeFilters).includes(name)}
      name={name}
    >
      <div className="card-content">
        <Form>
          <Dropdown
            multiple
            selection
            fluid
            options={options}
            button
            className="mini"
            placeholder="Choose Years to Include"
            onChange={(_, { value: inputValue }) => setValue(inputValue)}
            value={value}
            data-cy={`${name}-dropdown`}
          />
        </Form>
      </div>
    </FilterCard>
  )
}
