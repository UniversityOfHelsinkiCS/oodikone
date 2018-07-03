import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Icon, Form, Segment, Button } from 'semantic-ui-react'
import { shape, func } from 'prop-types'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import { presetFilter } from '../../populationFilters'


class Preset extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired
  }
  handleSetFilter = (filter) => {
    this.props.filter.notSet = false
    this.props.setPopulationFilter(presetFilter(filter))
  }
  clearFilter = () => {
    this.props.filter.notSet = true
    this.props.removePopulationFilter(this.props.filter.id)
  }
  render() {
    const { filter } = this.props
    console.log(this.props)
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Form.Group inline>
              <Form.Field>
                <label>{filter.name}</label>
              </Form.Field>
              <Form.Field>
                <Button onClick={() => this.handleSetFilter(filter)}>
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
        {filter.name}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

export default connect(
  null,
  { removePopulationFilter, setPopulationFilter }
)(Preset)
