import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Button } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { connect } from 'react-redux'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'
import useFilters from '../useFilters'

const TransferredToProgramme = ({ translate }) => {
  const { addFilter, removeFilter, withoutFilter } = useFilters()
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

  const toggle = buttonValue => () => setValue(prev => (prev === buttonValue ? null : buttonValue))

  return (
    <FilterCard
      title={translate('transferFilter.title')}
      contextKey={name}
      active={active}
      footer={<ClearFilterButton disabled={!active} onClick={() => setValue(null)} name={name} />}
      name={name}
    >
      <Form>
        <div className="description-text">{translate('transferFilter.descriptionUpper')}</div>
        <Form.Field className="flex-centered">
          <Button.Group size="small">
            <Button toggle active={value === 1} onClick={toggle(1)} data-cy={`${name}-have`}>
              {`${translate('transferFilter.have')} (${count(true)})`}
            </Button>
            <Button.Or text="OR" />
            <Button toggle active={value === 0} onClick={toggle(0)} data-cy={`${name}-havenot`}>
              {`${translate('transferFilter.haveNot')} (${count(false)})`}
            </Button>
          </Button.Group>
        </Form.Field>
        <div className="description-text">{translate('transferFilter.descriptionLower')}</div>
      </Form>
    </FilterCard>
  )
}

TransferredToProgramme.propTypes = {
  translate: PropTypes.func.isRequired
}

const mapStateToProps = ({ localize }) => ({ translate: getTranslate(localize) })

export default connect(mapStateToProps)(TransferredToProgramme)
