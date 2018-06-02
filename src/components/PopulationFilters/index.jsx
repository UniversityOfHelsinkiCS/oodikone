import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Button } from 'semantic-ui-react'
import { arrayOf, object, func } from 'prop-types'
import _ from 'lodash'

import { getTranslate } from 'react-localize-redux'
import CreditsLessThan from './CreditsLessThan'
import CreditsAtLeast from './CreditsAtLeast'
import { clearPopulationFilters } from '../../redux/populationFilters'


const componentFor = {
  CreditsAtLeast,
  CreditsLessThan
}

class PopulationFilters extends Component {
  static propTypes = {
    populationFilters: arrayOf(object).isRequired,
    clearPopulationFilters: func.isRequired
  }

  state = {
    visible: false
  }

  renderAddFilters() {
    const allFilters = Object.keys(componentFor).map(f => String(f))
    const setFilters = this.props.populationFilters.map(f => f.type)
    const unsetFilters = _.difference(allFilters, setFilters)

    if (unsetFilters.length === 0) {
      return null
    }

    if (!this.state.visible) {
      return (
        <Segment>
          <Header>Add filters</Header>
          <Button onClick={() => this.setState({ visible: true })}>add</Button>
        </Segment>
      )
    }

    return (
      <Segment>
        <Header>Add filters</Header>
        <div>
          <em>
            Note that filters does not work yet when population is limited by students
            that have participated a specific course
          </em>
        </div>
        {unsetFilters.map(filterName =>
          React.createElement(componentFor[filterName], {
            filter: { notSet: true }, key: filterName
          }))}
        <Button onClick={() => this.setState({ visible: false })}>cancel</Button>
      </Segment>
    )
  }

  renderSetFilters() {
    const setFilters = this.props.populationFilters.map(f => f.type)

    if (setFilters.length === 0) {
      return null
    }

    return (
      <Segment>
        <Header>Filters</Header>
        {this.props.populationFilters.map(filter =>
          React.createElement(componentFor[filter.type], { filter, key: filter.id }))}
        <Button onClick={this.props.clearPopulationFilters}>clear all filters</Button>
      </Segment>
    )
  }

  render() {
    return (
      <div>
        {this.renderAddFilters()}
        {this.renderSetFilters()}
      </div>
    )
  }
}

const mapStateToProps = ({ populationFilters, locale, graphSpinner }) => ({
  populationFilters,
  translate: getTranslate(locale),
  loading: graphSpinner
})

export default connect(mapStateToProps, { clearPopulationFilters })(PopulationFilters)
