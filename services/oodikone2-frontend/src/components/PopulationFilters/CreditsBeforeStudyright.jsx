import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Input, Button, Form } from 'semantic-ui-react'
import { func, shape } from 'prop-types'

import { creditsBeforeStudyright } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

const CreditsBeforeStudyright = ({ filter, removePopulationFilterAction, setPopulationFilterAction }) => {
  const [limit, setLimit] = useState('')

  const handleChange = e => {
    if (Number(e.target.value) > -1) {
      setLimit(e.target.value)
    }
  }

  const handleLimit = () => {
    setPopulationFilterAction(creditsBeforeStudyright({ credit: limit }))
    setLimit('')
  }

  const clearFilter = () => {
    removePopulationFilterAction(filter.id)
  }

  if (filter.notSet) {
    return (
      <Segment>
        <Form>
          <Form.Group inline>
            <Form.Field>
              <label>Show only students with credits more than</label>
            </Form.Field>
            <Form.Field>
              <Input type="number" onChange={handleChange} value={limit} />
            </Form.Field>
            <Form.Field>
              <label>before start of studyright</label>
            </Form.Field>
            <Form.Field>
              <Button onClick={handleLimit} disabled={limit.length === 0}>
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
      Credits more than {filter.params.credit} before studyright
      <span style={{ float: 'right' }}>
        <Icon name="remove" onClick={clearFilter} />
      </span>
    </Segment>
  )
}

CreditsBeforeStudyright.propTypes = {
  setPopulationFilterAction: func.isRequired,
  removePopulationFilterAction: func.isRequired,
  filter: shape({}).isRequired
}

export default connect(
  null,
  {
    setPopulationFilterAction: setPopulationFilter,
    removePopulationFilterAction: removePopulationFilter
  }
)(CreditsBeforeStudyright)
