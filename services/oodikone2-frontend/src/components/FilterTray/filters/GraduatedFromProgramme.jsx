import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Dropdown } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getTranslate } from 'react-localize-redux'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'
import useFilters from '../useFilters'
import useAnalytics from '../useAnalytics'

const GraduatedFromProgramme = ({ code, translate }) => {
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

  const options = [
    { key: 'graduated-false', text: `${translate('gradFromProgFilter.optNot')} (${count(0)})`, value: 0 }
  ].concat(
    combinedExtent
      ? [
          { key: 'graduated-bachelor', text: `${translate('gradFromProgFilter.optBachelor')} (${count(1)})`, value: 1 },
          { key: 'graduated-master', text: `${translate('gradFromProgFilter.optMaster')} (${count(2)})`, value: 2 }
        ]
      : [{ key: 'graduated-true', text: `${translate('gradFromProgFilter.optGrad')}  (${count(1)})`, value: 1 }]
  )

  return (
    <FilterCard
      title={translate('gradFromProgFilter.title')}
      contextKey={name}
      active={active}
      footer={<ClearFilterButton disabled={!active} onClick={() => setValue(null)} name={name} />}
      name={name}
    >
      <Form>
        <div className="description-text">{translate('gradFromProgFilter.descriptionUpper')}</div>
        <div className="card-content">
          <Dropdown
            options={options}
            value={value}
            onChange={(_, { value: inputValue }) => setValue(inputValue)}
            placeholder={translate('gradFromProgFilter.dropdownLabel')}
            className="mini"
            selection
            fluid
            button
            data-cy={`${name}-dropdown`}
          />
        </div>
        <div className="description-text">{translate('gradFromProgFilter.descriptionLower')}</div>
      </Form>
    </FilterCard>
  )
}

GraduatedFromProgramme.propTypes = {
  code: PropTypes.string.isRequired,
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ populations, localize }) => ({
  code: populations.query ? populations.query.studyRights.programme : '',
  translate: getTranslate(localize)
})

export default connect(mapStateToProps)(GraduatedFromProgramme)
