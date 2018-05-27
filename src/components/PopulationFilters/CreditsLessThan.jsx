import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Input, Button, Form } from 'semantic-ui-react'
import { shape, func } from 'prop-types'
import { setLoading } from '../../redux/graphSpinner'

import { creditsLessThan } from '../../populationFilters'
import { clearPopulationFilters, setPopulationFilter } from '../../redux/populationFilters'

class CreditsLessThan extends Component {
  static propTypes = {
    setLoading: func.isRequired,
    filter: shape({}).isRequired,
    clearPopulationFilters: func.isRequired,
    setPopulationFilter: func.isRequired
  }

  state = {
    limit: ''
  }

  handleChange = (e) => {
    this.setState({ limit: e.target.value })
  }

  handleLimit = () => {
    this.props.setLoading()
    setTimeout(() => {
      this.props.setPopulationFilter(creditsLessThan(this.state.limit))
      this.setState({ limit: '' })
    }, 0)
  }

  clearFilter = () => {
    this.props.setLoading()
    setTimeout(() => {
      this.props.clearPopulationFilters()
    }, 0)
  }

  render() {
    const { filter } = this.props

    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Form.Group inline>
              <Form.Field>
                <label>Show only students with credits less than</label>
              </Form.Field>
              <Form.Field>
                <Input
                  type="number"
                  onChange={this.handleChange}
                  value={this.state.limit}
                />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleLimit}
                  disabled={this.state.limit.length === 0}
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
        Credits less than {filter.params[0]}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

export default connect(
  null,
  { setPopulationFilter, clearPopulationFilters, setLoading }
)(CreditsLessThan)
