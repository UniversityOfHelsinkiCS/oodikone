import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { func, shape } from 'prop-types'
import { programmeFilter } from '../../populationFilters'

import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'


const ProgrammeFilter = ({ removePopulationFilterAction, setPopulationFilterAction, allStudyrights, filter }) => {
  const [programme, setProgramme] = useState('')
  const [programmeName, setName] = useState('')

  const handleFilter = () => {
    setPopulationFilterAction(programmeFilter({ programme }))
  }
  const handleChange = (e, { value }) => {
    setProgramme(value)
    const chosenProgrammeName = allStudyrights.find(sr => sr.code === value)
    setName(chosenProgrammeName.name.fi)
  }
  const clearFilter = () => {
    removePopulationFilterAction(filter.id)
    setProgramme('')
    setName('')
  }
  const options = allStudyrights.programmes.map(p => ({ key: p.code, text: p.name.fi, value: p.code }))
  if (filter.notSet) {
    return (
      <Segment>
        <Form>
          <Popup
            trigger={<Icon style={{ float: 'right' }} name="info" />}
          />
          <Form.Group inline>
            <Form.Field>
              <label>Select students that are in programme </label>
            </Form.Field>
            <Form.Field>
              <Dropdown
                placeholder="select"
                options={options}
                onChange={handleChange}
              />
            </Form.Field>
            <Form.Field>
              <Button onClick={handleFilter}>
                set filter
              </Button>
            </Form.Field>
          </Form.Group>
        </Form>
      </Segment>
    )
  }
  return (
    <Segment>
      Students that are in programme {programmeName}
      <span style={{ float: 'right' }}>
        <Icon name="remove" onClick={clearFilter} />
      </span>
    </Segment>
  )
}
ProgrammeFilter.propTypes = {
  setPopulationFilterAction: func.isRequired,
  removePopulationFilterAction: func.isRequired,
  filter: shape({}).isRequired,
  allStudyrights: shape({}).isRequired
}

export default connect(null, {
  setPopulationFilterAction: setPopulationFilter,
  removePopulationFilterAction: removePopulationFilter
})(ProgrammeFilter)
