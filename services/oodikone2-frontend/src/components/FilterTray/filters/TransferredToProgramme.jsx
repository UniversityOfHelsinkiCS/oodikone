import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Radio } from 'semantic-ui-react'
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

  const options = [
    { key: 'transfer-true', text: `Have (${count(true)})`, value: 1 },
    { key: 'transfer-false', text: `Have Not (${count(false)})`, value: 0 }
  ]

  return (
    <FilterCard
      title="Transfer Status"
      contextKey={name}
      active={active}
      footer={<ClearFilterButton disabled={!active} onClick={() => setValue(null)} />}
    >
      <Form>
        <div className="description-text">Show students who...</div>
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
