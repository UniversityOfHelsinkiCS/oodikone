import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Input, Button, Form, Popup } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'

import { creditsAtLeast } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'
import infoTooltips from '../../common/infotooltips'

class CreditsAtLeast extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    language: string.isRequired
  }

  state = {
    limit: ''
  }

  handleChange = (e) => {
    this.setState({ limit: e.target.value })
  }

  handleLimit = () => {
    this.props.setPopulationFilter(creditsAtLeast({ credit: this.state.limit }))
    this.setState({ limit: '' })
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
            <Popup content={infoTooltips.PopulationStatistics.Filters.CreditsAtLeast[this.props.language]} trigger={<Icon style={{ float: 'right' }} name="info" />} />
            <Form.Group inline>
              <Form.Field>
                <label>Show only students with credits at least</label>
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
        Credits at least {filter.params.credit}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}
const mapStateToProps = ({ settings }) => ({
  language: settings.language
})
export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(CreditsAtLeast)
