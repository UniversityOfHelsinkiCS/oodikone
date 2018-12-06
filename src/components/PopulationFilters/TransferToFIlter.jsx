import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Icon, Button, Form, Popup, Radio } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'
import _ from 'lodash'

import infoTooltips from '../../common/infotooltips'
import { transferToFilter } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class TransferToFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    language: string.isRequired
  }

  state = {
    negated: false
  }

  handleRadio = () => {
    this.props.setPopulationFilter(transferToFilter({ negated: this.state.negated }))
    this.setState({ starting: true })
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  render() {
    const { filter } = this.props
    const toggleLabel = this.state.starting
      ? 'did not transfer to this studyright'
      : 'transferred to this studyright'

    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup
              content={infoTooltips.PopulationStatistics.Filters.StartingThisSemester[this.props.language]}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                <label>Show only students that</label>
              </Form.Field>
              <Form.Field>
                <Radio
                  toggle
                  label={toggleLabel}
                  checked={this.state.starting}
                  onChange={() => this.setState({ negated: !this.state.negated })}
                />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleRadio}
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
        {filter.params.starting ? 'Had not transferred' : 'Had not transferred'}
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
)(TransferToFilter)
