import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Dropdown, Popup } from 'semantic-ui-react'
import { shape, func } from 'prop-types'

import infoTooltips from '../../common/InfoToolTips'
import { gradeMeanFilter } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class GradeMeanFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired
  }

  state = {
    gradeMean: 0,
    comparator: ''
  }

  handleFilter = () => {
    this.props.setPopulationFilter(gradeMeanFilter({
      gradeMean: this.state.gradeMean, comparator: this.state.comparator
    }))
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
              content={infoTooltips.PopulationStatistics.Filters.GradeMeanFilter}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                <label>Select students that have grade mean </label>
              </Form.Field>
              <Form.Field>
                <Dropdown
                  placeholder="select comparator"
                  onChange={(e, data) => this.setState({ comparator: data.value })}
                  options={[{ key: 1, text: 'less than', value: 'less' }, { key: 2, text: 'more than', value: 'more' }]}
                  selectOnBlur={false}
                />

              </Form.Field>
              <Form.Field>
                <Dropdown
                  placeholder="select grade mean"
                  options={[{ key: 1, text: '1', value: 1 },
                  { key: 2, text: '2', value: 2 },
                  { key: 3, text: '3', value: 3 },
                  { key: 4, text: '4', value: 4 },
                  { key: 5, text: '5', value: 5 }]}
                  onChange={(e, data) => this.setState({ gradeMean: data.value })}
                  selectOnBlur={false}
                />

              </Form.Field>
              <Form.Field>
                <Button onClick={this.handleFilter}>
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
        Students that have grade mean {this.props.filter.params.comparator} than {this.props.filter.params.gradeMean}
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
)(GradeMeanFilter)
