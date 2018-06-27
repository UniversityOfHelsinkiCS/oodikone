import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Icon, Form, Segment, Button } from 'semantic-ui-react'
import { shape, func } from 'prop-types'
import { removePopulationFilter } from '../../redux/populationFilters'


class Preset extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired
  }
  componentDidMount() {
    console.log('asd')
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
            <Form.Group inline>
              <Form.Field>
                <label>Presetfilter</label>
              </Form.Field>
              <Form.Field>
              </Form.Field>
              <Form.Field>
                <Button
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
  { removePopulationFilter }
)(Preset)
