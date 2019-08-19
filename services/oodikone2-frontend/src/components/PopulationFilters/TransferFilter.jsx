import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Segment, Icon, Dropdown, Button, Form, Popup } from 'semantic-ui-react'
import { shape, func, string } from 'prop-types'
import { sortBy } from 'lodash'

import infoTooltips from '../../common/InfoToolTips'
import { getTextIn } from '../../common'
import { transferFilter } from '../../populationFilters'
import { removePopulationFilter, setPopulationFilter } from '../../redux/populationFilters'

class TransferFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    transfers: shape({}).isRequired,
    activeLanguage: string.isRequired
  }

  state = {
    selectedSource: '',
    selectedTarget: ''
  }

  getName = (code) => {
    const { transfers, activeLanguage } = this.props
    const mergedTransfers = { ...Object.values(transfers)[0], ...Object.values(transfers)[1] }
    return getTextIn(mergedTransfers[code].name, activeLanguage)
  }

  handleChange = (e, data) => {
    this.setState({ [data.name]: data.value })
  }

  handleFilter = () => {
    const { selectedSource, selectedTarget } = this.state
    this.props.setPopulationFilter(transferFilter({
      source: selectedSource,
      target: selectedTarget
    }))
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  renderFilterText = (filter) => {
    const sourceName = this.getName(filter.params.source)
    const targetName = this.getName(filter.params.target)
    let returnText = 'Showing students that transferred'
    if (sourceName !== 'Anywhere') {
      returnText = returnText.concat(` from ${sourceName}`)
    }
    if (targetName !== 'Anywhere') {
      returnText = returnText.concat(` to ${targetName}`)
    }
    return returnText
  }

  render() {
    const { filter, transfers, activeLanguage } = this.props
    const { sources, targets } = transfers
    sources.anywhere = { name: { en: 'Anywhere', fi: 'Anywhere' }, targets }
    targets.anywhere = { name: { en: 'Anywhere', fi: 'Anywhere' }, sources }
    let filteredTargets = targets
    let filteredSources = sources
    if (this.state.selectedSource !== '') {
      filteredTargets = {
        ...sources[this.state.selectedSource].targets,
        anywhere: { name: { en: 'Anywhere', fi: 'Anywhere' } }
      }
    }
    if (this.state.selectedTarget !== '') {
      filteredSources = {
        ...targets[this.state.selectedTarget].sources,
        anywhere: { name: { en: 'Anywhere', fi: 'Anywhere' } }
      }
    }
    if (filter.notSet) {
      return (
        <Segment>
          <Form>
            <Popup
              content={infoTooltips.PopulationStatistics.Filters.TransferFilter}
              trigger={<Icon style={{ float: 'right' }} name="info" />}
            />
            <Form.Group inline>
              <Form.Field>
                <label>Students that transferred from </label>
              </Form.Field>
              <Form.Field
                style={{ width: 300 }}
              >
                <Dropdown
                  search
                  fluid
                  icon={null}
                  name="selectedSource"
                  placeholder="select source"
                  onChange={this.handleChange}
                  value={this.state.courseType}
                  options={sortBy(Object.entries(filteredSources).map(([value, text]) => ({
                    value,
                    text: getTextIn(text.name, activeLanguage)
                  })), entry => entry.text)}
                  selectOnBlur={false}
                />
              </Form.Field>
              <Form.Field>
                <label> to </label>
              </Form.Field>
              <Form.Field
                style={{ width: 300 }}
              >
                <Dropdown
                  search
                  icon={null}
                  fluid
                  name="selectedTarget"
                  placeholder="select target"
                  onChange={this.handleChange}
                  value={this.state.discipline}
                  options={sortBy(Object.entries(filteredTargets).map(([value, text]) => ({
                    value,
                    text: getTextIn(text.name, activeLanguage)
                  })), entry => entry.text)}
                  selectOnBlur={false}
                />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleFilter}
                  disabled={this.state.selectedSource === '' ||
                    this.state.selectedTarget === ''
                  }
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
        {this.renderFilterText(filter)}
        <span style={{ float: 'right' }}>
          <Icon name="remove" onClick={this.clearFilter} />
        </span>
      </Segment>
    )
  }
}

const mapStateToProps = ({ localize }) => ({
  activeLanguage: getActiveLanguage(localize).code
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(TransferFilter)
