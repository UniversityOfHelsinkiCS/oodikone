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

/**
 * Grade filter.
 * Only applicable to a single course.
 */
const Grade = ({ translate }) => {
  const { addFilter, removeFilter, withoutFilter, activeFilters, allStudents } = useFilters()
  const analytics = useAnalytics()
  const [value, setValue] = useState(null)
  const name = 'gradeFilter'

  /*
  const filterFn = student => 

  // Filter function update hook.
  useEffect(() => {
    if (value.length) {
      addFilter(name, )
    } else {
      
    }
  })
  */

  return (
    <FilterCard
      title={translate('gradeFilter.title')}
      contextKey="gradeFilter"
      footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} name={name} />}
      active={Object.keys(activeFilters).includes(name)}
      name={name}
    >
      <div className="card-content">
        <Form>
          {[5, 4, 3, 2, 1, 0].map(grade => (
            <Form.Field>
              <Checkbox label={grade} />
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
