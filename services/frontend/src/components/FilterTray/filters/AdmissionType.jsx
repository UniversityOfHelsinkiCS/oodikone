import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Form, Dropdown } from 'semantic-ui-react'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

const AdmissionType = ({ overrideCode = '' }) => {
  const { query } = useSelector(({ populations }) => populations)
  const code = overrideCode || query?.studyRights.programme || ''
  const { addFilter, removeFilter, activeFilters, withoutFilter } = useFilters()
  const analytics = useAnalytics()
  // Using undefined as default, since students can be filtered with null value
  const [value, setValue] = useState(undefined)
  const name = 'admissionTypeFilter'

  // Naming follows convention from SIS API (e.g urn:code:admissiont-type:m for "Muu")
  const admissionTypes = {
    M: 'Muu',
    KM: 'Kilpailumenestys',
    TV: 'Todistusvalinta',
    AV: 'Avoin väylä',
    KP: 'Koepisteet',
    YP: 'Yhteispisteet',
    N: null,
  }

  const filterFunction = value => student => {
    return value === 'Ei valintatapaa'
      ? student.studyrights.some(sr => sr.studyright_elements.some(e => e.code === code) && !sr.admission_type)
      : student.studyrights.some(sr => sr.studyright_elements.some(e => e.code === code) && value === sr.admission_type)
  }

  useEffect(() => {
    if (!value) {
      removeFilter(name)
      analytics.clearFilter(name)
    } else {
      addFilter(name, filterFunction(value))
      analytics.setFilter(name, value)
    }
  }, [value])

  const count = admissionType => withoutFilter(name).filter(filterFunction(admissionType)).length

  const options = Object.entries(admissionTypes).map(([key, admissionType]) => {
    const value = admissionType || 'Ei valintatapaa'
    return {
      key,
      text: `${value} (${count(admissionType)})`,
      value,
    }
  })

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

export default AdmissionType
