import React, { useState, useEffect } from 'react'
import { Form, Button } from 'semantic-ui-react'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

export default () => {
  const { addFilter, removeFilter, withoutFilter } = useFilters()
  const analytics = useAnalytics()
  const [value, setValue] = useState(0)
  const name = 'transferredToProgrammeFilter'
  const active = value !== null

  const filterFn = wanted => student => student.transferredStudyright === wanted

  useEffect(() => {
    if (active) {
      addFilter(name, filterFn(!!value))
      analytics.setFilter(name, value)
    } else {
      removeFilter(name)
      analytics.clearFilter(name)
    }
  }, [value])

  const count = wanted => withoutFilter(name).filter(filterFn(wanted)).length

  const toggle = buttonValue => () => setValue(prev => (prev === buttonValue ? null : buttonValue))

  return (
    <FilterCard
      title="Transfer Status"
      contextKey={name}
      active={active}
      footer={<ClearFilterButton disabled={!active} onClick={() => setValue(null)} name={name} />}
      name={name}
    >
      <Form>
        <div className="description-text">Show students who...</div>
        <div className="card-content">
          <Form.Field className="flex-centered">
            <Button.Group size="small">
              <Button toggle active={value === 1} onClick={toggle(1)} data-cy={`${name}-have`}>
                {`Have (${count(true)})`}
              </Button>
              <Button.Or text="OR" />
              <Button toggle active={value === 0} onClick={toggle(0)} data-cy={`${name}-havenot`}>
                {`Have Not (${count(false)})`}
              </Button>
            </Button.Group>
          </Form.Field>
        </div>
        <div className="description-text">...transferred to this study programme.</div>
      </Form>
    </FilterCard>
  )
}
