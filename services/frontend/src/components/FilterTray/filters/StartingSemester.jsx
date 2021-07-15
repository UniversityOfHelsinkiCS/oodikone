/**
 * This filter clones the functionality of the old StartingThisSemester filter. However,
 * the new "Starting Year at University" filter offers essentially the same functionality
 * and more. Thus, this component is :deprekoitu: but left here for possible future use.
 */
import React, { useState, useEffect } from 'react'
import { Form, Radio } from 'semantic-ui-react'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

const StartingSemester = () => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = useFilters()
  const analytics = useAnalytics()
  const [value, setValue] = useState(null)
  const name = 'startingSemesterFilter'

  useEffect(() => {
    if (value === null) {
      removeFilter(name)
      analytics.clearFilter()
    } else {
      addFilter(name, student => student.starting === (value === 1))
      analytics.setFilter(name, value)
    }
  }, [value])

  const count = starting => withoutFilter(name).filter(student => student.starting === starting).length

  const options = [
    { key: 'during-this-semester', text: `During (${count(true)})`, value: 1 },
    { key: 'before-this-semester', text: `Before (${count(false)})`, value: 2 },
  ]

  return (
    <FilterCard
      title="Starting Semester"
      footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} />}
      active={Object.keys(activeFilters).includes(name)}
      name={name}
    >
      <Form>
        <div className="description-text">Show students who started...</div>
        {options.map(opt => (
          <Form.Field key={opt.key}>
            <Radio
              label={opt.text}
              value={opt.value}
              checked={value === opt.value}
              onChange={(_, { value: inputValue }) => setValue(inputValue)}
            />
          </Form.Field>
        ))}
        <div className="description-text">...selected semester.</div>
      </Form>
    </FilterCard>
  )
}

export default StartingSemester
