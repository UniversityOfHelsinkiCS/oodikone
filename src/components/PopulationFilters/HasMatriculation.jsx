import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Radio, Icon, Form, Segment, Button } from 'semantic-ui-react'
import { shape, func } from 'prop-types'

import { matriculationFilter } from '../../populationFilters'
import { clearPopulationFilters, setPopulationFilter } from '../../redux/populationFilters'

class MatriculationFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    clearPopulationFilters: func.isRequired,
    setPopulationFilter: func.isRequired
  }

  state = {
    matr: ''
  }

  handleChange = (e, { value }) => {
    this.setState({ matr: value })
  }

  handleMatr = () => {
    this.props.setPopulationFilter(matriculationFilter(this.state.matr))
    this.setState({ matr: '' })
  }

  clearFilter = () => {
    this.props.clearPopulationFilters()
  }

  render() {
    const { filter } = this.props
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Form.Group inline>
              <Form.Field>
                <label>Filter by matriculation examination</label>
              </Form.Field>
              <Form.Field>
                <Radio name="sex" onChange={this.handleChange} value="1" label="Yes" checked={this.state.matr === '1'} />
                <Radio name="sex" onChange={this.handleChange} value="0" label="No" checked={this.state.matr === '0'} />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleMatr}
                  disabled={this.state.matr === ''}
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
        {filter.params[0] ? 'Showing students that have done matriculation examination' : 'Showing students that have not done matriculation examination'}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

export default connect(
  null,
  { setPopulationFilter, clearPopulationFilters }
)(MatriculationFilter)
