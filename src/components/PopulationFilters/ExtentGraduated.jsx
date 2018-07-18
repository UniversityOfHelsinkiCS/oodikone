import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form } from 'semantic-ui-react'
import { shape, func } from 'prop-types'

import { extentGraduated } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class ExtentGraduated extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired
  }


  handleLimit = () => {
    const { filter } = this.props
    this.props.setPopulationFilter(extentGraduated(filter))
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
                <label>{filter.name.fi} suoritettu</label>
              </Form.Field>

              <Form.Field>
                <Button
                  onClick={this.handleLimit}
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
        <label>
          {filter.name.fi} suoritettu
        </label>
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
)(ExtentGraduated)
