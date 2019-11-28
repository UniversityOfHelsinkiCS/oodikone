import React, { useState } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Input, Button, Form, Popup } from 'semantic-ui-react'
import { func, shape } from 'prop-types'

import infoTooltips from '../../common/InfoToolTips'
import { creditsBeforeStudyright } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import Track from './tracking'

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
    Track.set(__filename)
  }

  const clearFilter = () => {
    removePopulationFilterAction(filter.id)
    Track.cleared(__filename)
  }

  if (filter.notSet) {
    return (
      <Segment>
        <Form>
          <Popup
            content={infoTooltips.PopulationStatistics.Filters.CreditsBeforeStudyright}
            trigger={<Icon style={{ float: 'right' }} name="info" />}
          />
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
