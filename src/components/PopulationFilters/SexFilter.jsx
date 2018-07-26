import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Radio, Icon, Form, Segment, Button } from 'semantic-ui-react'
import { shape, func } from 'prop-types'

import { sexFilter } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class SexFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired
  }

  state = {
    sex: ''
  }

  handleChange = (e, { value }) => {
    this.setState({ sex: value })
  }

  handleSex = () => {
    this.props.setPopulationFilter(sexFilter({ gender: this.state.sex }))
    this.setState({ sex: '' })
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
                <label>Filter by gender</label>
              </Form.Field>
              <Form.Field>
                <Radio name="sex" onChange={this.handleChange} value="male" label="Male" checked={this.state.sex === 'male'} />
                <Radio name="sex" onChange={this.handleChange} value="female" label="Female" checked={this.state.sex === 'female'} />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleSex}
                  disabled={this.state.sex === ''}
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
        {`Showing only ${filter.params.sex} students.`}
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
)(SexFilter)
