import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Icon, Form, Segment, Button, Confirm, Grid } from 'semantic-ui-react'
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
                <em>
                  {filter.description}
                </em>
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
      <Segment >
        <Grid>
          <Grid.Column floated="left" width={12}>
            <Form>
              <Form.Field inline>
                <label>
                  {filter.name}
                </label>
                <em>
                  {filter.description}
                </em>
              </Form.Field>
            </Form>
          </Grid.Column>
          <Grid.Column floated="right">
            <Form style={{ float: 'right' }}>
              <Form.Group inline>
                <Form.Field>
                  <Icon
                    name="trash"
                    onClick={() => this.setState({ open: true })}
                  />
                  <Confirm
                    open={this.state.open}
                    cancelButton="Just remove from use"
                    confirmButton="Delete for good"
                    content="Are you sure you want to delete this filter?"
                    onCancel={() => { this.setState({ open: false }); this.clearFilter() }}
                    onConfirm={() => {
                      this.clearFilter(true)
                      this.props.deletePopulationFilter(filter)
                      this.setState({ open: false })
                    }}
                    size="small"
                  />
                </Form.Field>
                <Form.Field >
                  <Icon name="remove" onClick={() => this.clearFilter(false)} />
                </Form.Field>
              </Form.Group>
            </Form>
          </Grid.Column>
        </Grid>
      </Segment >
    )
  }
}

export default connect(
  null,
  { removePopulationFilter, setPopulationFilter, deletePopulationFilter }
)(Preset)
