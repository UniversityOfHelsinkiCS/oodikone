// Not in use currently, but code left here for possible future use.
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Dropdown, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { connect } from 'react-redux'
import FilterCard from './common/FilterCard'
import NumericInput from './common/NumericInput'
import { getStudentGradeMean } from '../../../common'
import useFilters from '../useFilters'

const GradeMean = ({ translate }) => {
  const { addFilter, removeFilter } = useFilters()
  const [comparator, setComparator] = useState('<')
  const [value, setValue] = useState('')
  const name = 'gradeMeanFilter'

  const filters = gradeMean => ({
    '<': student => getStudentGradeMean(student) < Number(gradeMean),
    '≤': student => getStudentGradeMean(student) <= Number(gradeMean),
    '≥': student => getStudentGradeMean(student) >= Number(gradeMean),
    '>': student => getStudentGradeMean(student) > Number(gradeMean)
  })

  const options = Object.keys(filters(0)).map(c => ({ key: c, text: c, value: c }))

  useEffect(() => {
    if (value === '') {
      removeFilter(name)
    } else {
      addFilter(name, filters(value)[comparator])
    }
  }, [comparator, value])

  return (
    <FilterCard title={translate('gradeMeanFilter.title')}>
      <NumericInput
        onChange={(_, { value: inputValue }) => setValue(inputValue)}
        onClear={() => setValue('')}
        value={value}
        clearButtonDisabled={!value}
        className="comparator-input"
        label={
          <Popup
            content={translate('gradeMeanFilter.comparatorTooltip')}
            position="top left"
            pinned
            size="mini"
            on="hover"
            trigger={
              <Dropdown
                options={options}
                onChange={(_, { value: inputValue }) => setComparator(inputValue)}
                value={comparator}
                fluid
              />
            }
          />
        }
      />
    </FilterCard>
  )
}

GradeMean.propTypes = {
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(GradeMean)
