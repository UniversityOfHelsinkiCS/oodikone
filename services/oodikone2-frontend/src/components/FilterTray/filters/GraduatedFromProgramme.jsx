import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

const GraduatedFromProgramme = ({ code }) => {
  const { addFilter, removeFilter, withoutFilter } = useFilters()
  const analytics = useAnalytics()
  const [value, setValue] = useState(null)
  const name = 'graduatedFromProgrammeFilter'
  const active = value !== null
  // Old-style study programmes need separation between bachelor's and master's.
  const combinedExtent = !code.includes('_')

  const graduated = studyrights =>
    studyrights.some(sr =>
      sr.studyright_elements.some(sre => {
        const dateMatch = new Date(sre.enddate) >= new Date(sr.enddate)
        return sre.code === code && dateMatch && sr.graduated
      })
    )

  const graduatedWithExtent = (studyrights, extent) => graduated(studyrights.filter(sr => sr.extentcode === extent))

  const filterFn = wanted => student =>
    combinedExtent && wanted > 0
      ? graduatedWithExtent(student.studyrights, wanted)
      : graduated(student.studyrights) === !!wanted

  useEffect(() => {
    if (active) {
      addFilter(name, filterFn(value))
      analytics.setFilter(name, value)
    } else {
      removeFilter(name)
      analytics.clearFilter(name)
    }
  }, [value])

  const count = wanted => withoutFilter(name).filter(filterFn(wanted)).length

  const options = [{ key: 'graduated-false', text: `Not Graduated (${count(0)})`, value: 0 }].concat(
    combinedExtent
      ? [
          { key: 'graduated-bachelor', text: `Graduated with Bachelor's (${count(1)})`, value: 1 },
          { key: 'graduated-master', text: `Graduated with Master's (${count(2)})`, value: 2 }
        ]
      : [{ key: 'graduated-true', text: `Graduated  (${count(1)})`, value: 1 }]
  )

  return (
    <FilterCard
      title="Graduated Students"
      contextKey={name}
      active={active}
      footer={<ClearFilterButton disabled={!active} onClick={() => setValue(null)} name={name} />}
      name={name}
    >
      <Form>
        <div className="description-text">Show students who have...</div>
        <div className="card-content">
          <Dropdown
            options={options}
            value={value}
            onChange={(_, { value: inputValue }) => setValue(inputValue)}
            placeholder="Choose Option"
            className="mini"
            selection
            selectOnBlur={false}
            fluid
            button
            data-cy={`${name}-dropdown`}
          />
        </div>
        <div className="description-text">...from this study programme.</div>
      </Form>
    </FilterCard>
  )
}

GraduatedFromProgramme.propTypes = {
  code: PropTypes.string.isRequired
}

const mapStateToProps = ({ populations }) => ({
  code: populations.query ? populations.query.studyRights.programme : ''
})

export default connect(mapStateToProps)(GraduatedFromProgramme)
