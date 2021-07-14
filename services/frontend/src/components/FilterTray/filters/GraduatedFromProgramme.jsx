import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Radio } from 'semantic-ui-react'
import { connect } from 'react-redux'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

const GraduatedFromProgramme = ({ code }) => {
  const { addFilter, removeFilter } = useFilters()
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

  const options = [{ key: 'graduated-false', text: `Not Graduated`, value: 0 }].concat(
    combinedExtent
      ? [
          { key: 'graduated-bachelor', text: `Graduated with Bachelor's`, value: 1 },
          { key: 'graduated-master', text: `Graduated with Master's`, value: 2 },
        ]
      : [{ key: 'graduated-true', text: `Graduated`, value: 1 }]
  )

  return (
    <FilterCard
      title="Graduation Status"
      contextKey={name}
      active={active}
      footer={<ClearFilterButton disabled={!active} onClick={() => setValue(null)} name={name} />}
      name={name}
    >
      <Form>
        <div className="card-content">
          <Form.Field>
            <Radio
              label="All"
              checked={value === null}
              onChange={() => setValue(null)}
              style={{ marginBottom: '0.5rem' }}
              data-cy={`${name}-all`}
            />
            {options.map(option => (
              <Radio
                key={option.key}
                label={option.text}
                name="radioGroup"
                style={{ marginBottom: '0.5rem' }}
                checked={value === option.value}
                onChange={() => setValue(option.value)}
                data-cy={`${name}-${option.key}`}
              />
            ))}
          </Form.Field>
        </div>
      </Form>
    </FilterCard>
  )
}

GraduatedFromProgramme.propTypes = {
  code: PropTypes.string.isRequired,
}

const mapStateToProps = ({ populations }) => ({
  code: populations.query ? populations.query.studyRights.programme : '',
})

export default connect(mapStateToProps)(GraduatedFromProgramme)
