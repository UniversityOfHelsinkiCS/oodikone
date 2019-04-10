import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Popup, Dropdown } from 'semantic-ui-react'
import { shape, func } from 'prop-types'

import infoTooltips from '../../common/InfoToolTips'
import { startingThisSemester } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

const dropDownOptions = [
  {
    text: 'started ',
    value: 'started'
  },
  {
    text: 'did not start ',
    value: 'didnotstart'
  }
]

class StartingThisSemester extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired
  }

  state = {
    starting: true
  }

  handleChange = (e, data) => {
    this.setState({ starting: data.value === 'started' })
  }

  handleRadio = () => {
    this.props.setPopulationFilter(startingThisSemester({ starting: this.state.starting }))
    this.setState({ starting: true })
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  render() {
    const { filter } = this.props

    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup
              content={infoTooltips.PopulationStatistics.Filters.StartingThisSemester}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                <label>Show only students that</label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  search
                  fluid
                  name="degree"
                  defaultValue="started"
                  onChange={this.handleChange}
                  options={dropDownOptions}
                />
              </Form.Field>
              <Form.Field>
                <label>this semester</label>
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleRadio}
                >
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
        {filter.params.starting ? 'Started this semester' : 'Had started before this semester'}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

export default connect(
  null,
  { setPopulationFilter, removePopulationFilter }
)(StartingThisSemester)
