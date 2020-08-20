import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Form } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getTranslate } from 'react-localize-redux'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'

const Grade = ({ translate }) => {
  const { addFilter, removeFilter, withoutFilter, activeFilters } = useFilters()
  const analytics = useAnalytics()
  const [value, setValue] = useState(null)
  const name = 'gradeFilter'

  return (
    <FilterCard
      title={translate('gradeFilter.title')}
      contextKey="gradeFilter"
      footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} name={name} />}
      active={Object.keys(activeFilters).includes(name)}
      name={name}
    >
      <div className="card-content">
        <Form />
      </div>
    </FilterCard>
  )
}

Grade.propTypes = {
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(Grade)
