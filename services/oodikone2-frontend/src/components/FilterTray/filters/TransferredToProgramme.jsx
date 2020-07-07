import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Button } from 'semantic-ui-react'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'

const TransferredToProgramme = ({ filterControl }) => {
  const { addFilter, removeFilter, withoutFilter } = filterControl
  const [value, setValue] = useState(null)
  const name = 'transferredToProgrammeFilter'
  const active = value !== null

  const filterFn = wanted => student => student.transferredStudyright === wanted

  useEffect(() => {
    if (active) {
      addFilter(name, filterFn(!!value))
    } else {
      removeFilter(name)
    }
  }, [value])

  const count = wanted => withoutFilter(name).filter(filterFn(wanted)).length

  const toggle = buttonValue => () => setValue(prev => (prev === buttonValue ? null : buttonValue))

  return (
    <FilterCard
      title="Transfer Status"
      contextKey={name}
      active={active}
      footer={<ClearFilterButton disabled={!active} onClick={() => setValue(null)} />}
    >
      <Form>
        <div className="description-text">Show students who...</div>
        <Form.Field className="flex-centered">
          <Button.Group size="small">
            <Button toggle active={value === 1} onClick={toggle(1)}>
              {`Have (${count(true)})`}
            </Button>
            <Button.Or text="OR" />
            <Button toggle negative={value === 0} active={value === 0} onClick={toggle(0)}>
              {`Have Not (${count(false)})`}
            </Button>
          </Button.Group>
        </Form.Field>
        <div className="description-text">...transferred to this study programme.</div>
      </Form>
    </FilterCard>
  )
}

TransferredToProgramme.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired
  }).isRequired
}

export default TransferredToProgramme
