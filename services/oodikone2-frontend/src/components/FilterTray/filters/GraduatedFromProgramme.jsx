import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Form, Button } from 'semantic-ui-react'
import { connect } from 'react-redux'
import FilterCard from './common/FilterCard'
import ClearFilterButton from './common/ClearFilterButton'

const GraduatedFromProgramme = ({ filterControl, code }) => {
  const { addFilter, removeFilter, withoutFilter } = filterControl
  const [value, setValue] = useState(null)
  const name = 'graduatedFromProgrammeFilter'
  const active = value !== null

  const filterFn = wanted => student => {
    const studyright = student.studyrights.find(sr => sr.studyright_elements.map(sre => sre.code).includes(code))
    return studyright && !!studyright.graduated === !!wanted
  }

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
      title="Graduated Students"
      contextKey={name}
      active={active}
      footer={<ClearFilterButton disabled={!active} onClick={() => setValue(null)} />}
    >
      <Form>
        <div className="description-text">Show students who...</div>
        <Form.Field className="flex-centered">
          <Button.Group size="small">
            <Button toggle active={value === 1} onClick={toggle(1)}>
              {`Have (${count(true)})`}
            </Button>
            <Button.Or text="OR" />
            <Button toggle active={value === 0} onClick={toggle(0)}>
              {`Have Not (${count(false)})`}
            </Button>
          </Button.Group>
        </Form.Field>
        <div className="description-text">...graduated from this study programme.</div>
      </Form>
    </FilterCard>
  )
}

GraduatedFromProgramme.propTypes = {
  filterControl: PropTypes.shape({
    addFilter: PropTypes.func.isRequired,
    removeFilter: PropTypes.func.isRequired,
    withoutFilter: PropTypes.func.isRequired
  }).isRequired,
  code: PropTypes.string.isRequired
}

const mapStateToProps = ({ populations }) => ({
  code: populations.query ? populations.query.studyRights.programme : ''
})

export default connect(mapStateToProps)(GraduatedFromProgramme)
