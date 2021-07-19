import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

const AdmissionType = ({ code }) => {
  const { addFilter, removeFilter, activeFilters } = useFilters()
  const analytics = useAnalytics()
  const [value, setValue] = useState(null)
  const name = 'admissionTypeFilter'

  // Naming follows convention from SIS API (e.g urn:code:admissiont-type:m for "Muu")
  const admissionTypes = {
    M: 'Muu',
    KM: 'Kilpailumenestys',
    TV: 'Todistusvalinta',
    AV: 'Avoin väylä',
    KP: 'Koepisteet',
    YP: 'Yhteispisteet',
  }

  useEffect(() => {
    if (!value) {
      removeFilter(name)
      analytics.clearFilter(name)
    } else {
      addFilter(name, student =>
        student.studyrights.some(
          sr => sr.studyright_elements.some(elem => elem.code === code) && value === sr.admission_type
        )
      )
      analytics.setFilter(name, value)
    }
  }, [value])

  const options = Object.entries(admissionTypes).map(([key, admissionType]) => ({
    key,
    text: `${admissionType} (0)`,
    value: admissionType,
  }))

  return (
    <FilterCard
      title="Admission type"
      contextKey={name}
      active={Object.keys(activeFilters).includes(name)}
      footer={<ClearFilterButton disabled={!value} onClick={() => setValue(null)} name={name} />}
      name={name}
    >
      <div className="card-content">
        <Form>
          <Dropdown
            options={options}
            value={value}
            onChange={(_, { value: inputValue }) => setValue(inputValue)}
            placeholder="Choose admission type"
            className="mini"
            selection
            selectOnBlur={false}
            fluid
            button
            clearable
            data-cy={`${name}-dropdown`}
          />
        </Form>
      </div>
    </FilterCard>
  )
}

AdmissionType.propTypes = {
  code: PropTypes.string.isRequired,
}

const mapStateToProps = ({ populations }) => ({
  code: populations.query ? populations.query.studyRights.programme : '',
})

export default connect(mapStateToProps)(AdmissionType)
