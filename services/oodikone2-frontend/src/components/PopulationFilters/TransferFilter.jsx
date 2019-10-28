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

const ANYWHERE = { code: 'anywhere', name: { en: 'Anywhere', fi: 'Anywhere', sv: 'Anywhere' } }

class TransferFilter extends Component {
  static propTypes = {
    filter: shape({}).isRequired,
    removePopulationFilter: func.isRequired,
    setPopulationFilter: func.isRequired,
    transfers: shape({}).isRequired,
    activeLanguage: string.isRequired,
    elementDetails: shape({}).isRequired
  }

  state = {
    selectedSource: '',
    selectedTarget: ''
  }

  getName = code => {
    const { activeLanguage, elementDetails } = this.props
    return getTextIn(code === ANYWHERE.code ? ANYWHERE.name : elementDetails[code].name, activeLanguage)
  }

  handleChange = (e, data) => {
    this.setState({ [data.name]: data.value })
  }

  handleFilter = () => {
    const { selectedSource, selectedTarget } = this.state
    this.props.setPopulationFilter(
      transferFilter({
        source: selectedSource,
        target: selectedTarget
      })
    )
  }

  clearFilter = () => {
    this.props.removePopulationFilter(this.props.filter.id)
  }

  renderFilterText = filter => {
    const sourceName = this.getName(filter.params.source)
    const targetName = this.getName(filter.params.target)
    let returnText = 'Showing students that transferred'
    if (filter.params.source !== ANYWHERE.code) {
      returnText = returnText.concat(` from ${sourceName}`)
    }
    if (filter.params.target !== ANYWHERE.code) {
      returnText = returnText.concat(` to ${targetName}`)
    }
    return returnText
  }

  render() {
    const { filter, transfers, activeLanguage, elementDetails } = this.props
    const { sources, targets } = transfers
    let filteredTargets = Object.keys(targets).map(code => elementDetails[code])
    let filteredSources = Object.keys(sources).map(code => elementDetails[code])
    if (this.state.selectedSource !== '' && this.state.selectedSource !== 'anywhere') {
      filteredTargets = Object.keys(sources[this.state.selectedSource].targets).map(code => elementDetails[code])
    }
    if (this.state.selectedTarget !== '' && this.state.selectedTarget !== 'anywhere') {
      filteredSources = Object.keys(targets[this.state.selectedTarget].sources).map(code => elementDetails[code])
    }
    filteredTargets.push(ANYWHERE)
    filteredSources.push(ANYWHERE)
    console.log(filteredSources, filteredTargets)
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
              <Form.Field style={{ width: 300 }}>
                <Dropdown
                  search
                  fluid
                  icon={null}
                  name="selectedSource"
                  placeholder="select source"
                  onChange={this.handleChange}
                  value={this.state.courseType}
                  options={sortBy(
                    filteredSources.map(({ code, name }) => ({
                      value: code,
                      text: getTextIn(name, activeLanguage)
                    })),
                    'text'
                  )}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
              </Form.Field>
              <Form.Field>
                <label> to </label>
              </Form.Field>
              <Form.Field style={{ width: 300 }}>
                <Dropdown
                  search
                  icon={null}
                  fluid
                  name="selectedTarget"
                  placeholder="select target"
                  onChange={this.handleChange}
                  value={this.state.discipline}
                  options={sortBy(
                    filteredTargets.map(({ code, name }) => ({
                      value: code,
                      text: getTextIn(name, activeLanguage)
                    })),
                    'text'
                  )}
                  selectOnBlur={false}
                  selectOnNavigation={false}
                />
              </Form.Field>
              <Form.Field>
                <Button
                  onClick={this.handleFilter}
                  disabled={this.state.selectedSource === '' || this.state.selectedTarget === ''}
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

const mapStateToProps = ({ localize, populations }) => ({
  activeLanguage: getActiveLanguage(localize).code,
  elementDetails: populations.data.elementdetails.data
})

export default connect(
  mapStateToProps,
  { setPopulationFilter, removePopulationFilter }
)(TransferFilter)
