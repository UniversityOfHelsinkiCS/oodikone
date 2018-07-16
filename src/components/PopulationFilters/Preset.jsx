import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Icon, Form, Segment, Button, Confirm } from 'semantic-ui-react'
import { shape, func } from 'prop-types'
import { removePopulationFilter, setPopulationFilter, deletePopulationFilter } from '../../redux/populationFilters'
import { presetFilter } from '../../populationFilters'


class Preset extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    deletePopulationFilter: func.isRequired,
    destroy: func.isRequired
  }
  state = { open: false }

  handleSetFilter = (filter) => {
    this.props.filter.notSet = false
    this.props.setPopulationFilter(presetFilter(filter))
  }
  clearFilter = (destroy = false) => {
    this.props.filter.notSet = true
    if (destroy) {
      this.props.destroy(this.props.filter.id)
    }
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
          <Icon
            name="trash"
            onClick={() => this.setState({ open: true })}
          />
          <Confirm
            style={{
              marginTop: 'auto !important',
              display: 'inline-block !important',
              position: 'relative',
              top: '20%',
              left: '33%'
            }}
            open={this.state.open}
            cancelButton="Just remove from use"
            confirmButton="Delete for good"
            content="Are you sure you want to delete this filter?"
            onCancel={() => { this.setState({ open: false }); this.clearFilter() }}
            onConfirm={() => { this.clearFilter(true); this.props.deletePopulationFilter(filter) }}
            size="small"
          />
        </span>
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

export default connect(
  null,
  { removePopulationFilter, setPopulationFilter, deletePopulationFilter }
)(Preset)
