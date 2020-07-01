import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown } from 'semantic-ui-react'
import ClearFilterButton from './common/ClearFilterButton'
import FilterCard from './common/FilterCard'

const Gender = ({ filterControl }) => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = filterControl
  const [value, setValue] = useState(null)
  const name = 'gender'

  const genderCodes = {
    female: { label: 'Female', value: 2 },
    male: { label: 'Male', value: 1 },
    other: { label: 'Other', value: 9 },
    unknown: { label: 'Unknown', value: 0 }
  }

  useEffect(() => {
    if (!value) {
      removeFilter(name)
    } else {
      addFilter(name, student => value === student.gender_code)
    }
  }, [value])

  const countsByGender = {}
  withoutFilter(name).forEach(student => {
    const gc = student.gender_code
    countsByGender[gc] = countsByGender[gc] ? countsByGender[gc] + 1 : 1
  })

  const count = genderCode => withoutFilter(name).filter(student => student.gender_code === genderCode).length

  const options = Object.entries(genderCodes).map(([key, gender]) => ({
    key,
    text: `${gender.label} (${count(gender.value)})`,
    value: gender.value
  }))

  return (
    <FilterCard
      title="Gender"
      footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} />}
      active={Object.keys(activeFilters).includes(name)}
    >
      <Form>
        <Dropdown
          options={options}
          value={value}
          onChange={(_, { value: inputValue }) => setValue(inputValue)}
          placeholder="Choose Gender"
          className="mini"
          selection
          fluid
          button
        />
      </Form>
    </FilterCard>
  )
}

Gender.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired,
    activeFilters: PropTypes.object.isRequired
  }).isRequired
}

export default Gender
