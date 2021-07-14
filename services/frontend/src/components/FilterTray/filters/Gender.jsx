import React, { useState, useEffect } from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import ClearFilterButton from './common/ClearFilterButton'
import FilterCard from './common/FilterCard'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

export default () => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = useFilters()
  const analytics = useAnalytics()
  const [value, setValue] = useState(null)
  const name = 'genderFilter'

  const genderCodes = {
    female: { label: 'Female', value: 2 },
    male: { label: 'Male', value: 1 },
    other: { label: 'Other', value: 3 },
    unknown: { label: 'Unknown', value: 0 },
  }

  useEffect(() => {
    if (
      !Object.values(genderCodes)
        .map(gc => gc.value)
        .includes(value)
    ) {
      removeFilter(name)
      analytics.clearFilter(name)
    } else {
      addFilter(name, student => value === Number(student.gender_code))
      analytics.setFilter(name, value)
    }
  }, [value])

  const countsByGender = {}
  withoutFilter(name).forEach(student => {
    const gc = student.gender_code
    countsByGender[gc] = countsByGender[gc] ? countsByGender[gc] + 1 : 1
  })

  const count = genderCode => withoutFilter(name).filter(student => Number(student.gender_code) === genderCode).length

  const options = Object.entries(genderCodes).map(([key, gender]) => ({
    key,
    text: `${gender.label} (${count(gender.value)})`,
    value: gender.value,
  }))

  return (
    <FilterCard
      title="Gender"
      contextKey="genderFilter"
      footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} name={name} />}
      active={Object.keys(activeFilters).includes(name)}
      name={name}
    >
      <div className="card-content">
        <Form>
          <Dropdown
            options={options}
            value={value}
            onChange={(_, { value: inputValue }) => setValue(inputValue)}
            placeholder="Choose Gender"
            className="mini"
            selection
            selectOnBlur={false}
            fluid
            button
            clearable
            data-cy={`${name}-dropdown`}
          />
        </Form>
      </div>
    </FilterCard>
  )
}
