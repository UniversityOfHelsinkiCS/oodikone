// FIXME: Remove when feature is ready.
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Checkbox } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getTranslate } from 'react-localize-redux'
import useFilters from '../../useFilters'
import useAnalytics from '../../useAnalytics'
import FilterCard from '../common/FilterCard'
import ClearFilterButton from '../common/ClearFilterButton'
import useGradeFilter from './useGradeFilter'

/**
 * Grade filter.
 * Only applicable to a single course.
 */
const Grade = ({ translate }) => {
  const { addFilter, removeFilter, activeFilters } = useFilters()
  const { value, setValue, grades } = useGradeFilter()
  const analytics = useAnalytics()
  const name = 'gradeFilter'
  const options = Object.keys(grades).sort((a, b) => b - a)

  // Filter function update hook.
  useEffect(() => {
    if (value.length) {
      const studentNumbers = value.reduce((a, b) => a.concat(grades[b]), [])
      addFilter(name, student => studentNumbers.includes(student.studentNumber))
    } else {
      removeFilter(name)
    }
  }, [value])

  const checked = grade => value.includes(grade)

  const onChange = grade => () => {
    if (checked(grade)) {
      setValue(value.filter(val => val !== grade))
    } else {
      setValue(value.concat(grade))
    }
  }

  return (
    <FilterCard
      title={translate('gradeFilter.title')}
      contextKey="gradeFilter"
      footer={<ClearFilterButton disabled={!value.length} onClick={() => setValue([])} name={name} />}
      active={Object.keys(activeFilters).includes(name)}
      name={name}
    >
      <div className="card-content">
        <Form>
          {options.map(grade => (
            <Form.Field key={`grade-filter-option-${grade}`}>
              <Checkbox
                label={
                  <label>
                    {grade}
                    <span className="filter-option-count">{`(${grades[grade].length} students)`}</span>
                  </label>
                }
                checked={checked(grade)}
                onChange={onChange(grade)}
              />
            </Form.Field>
          ))}
        </Form>
      </div>
    </FilterCard>
  )
}

Grade.propTypes = {
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(Grade)
