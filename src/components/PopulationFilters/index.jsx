import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Button } from 'semantic-ui-react'
import { arrayOf, object } from 'prop-types'

import { getTranslate } from 'react-localize-redux'
import CreditsLessThan from './CreditsLessThan'

class PopulationFilters extends Component {
  static propTypes = {
    populationFilters: arrayOf(object).isRequired
  }

  state = {
    visible: false
  }

  render() {
    if (this.props.populationFilters.length === 0 && !this.state.visible) {
      return (
        <Segment>
          <Header>Filters</Header>
          <Button onClick={() => this.setState({ visible: true })}>add</Button>
        </Segment>
      )
    }

    if (this.props.populationFilters.length === 0) {
      return (
        <Segment>
          <Header>Filters</Header>
          <div>
            <em>
              Note that filters does not work yet when population is limited by students
              that have participated a specific course
            </em>
          </div>
          <CreditsLessThan filter={{ notSet: true }} />
          <Button onClick={() => this.setState({ visible: false })}>cancel</Button>
        </Segment>
      )
    }

    const filter = this.props.populationFilters[0]

    return (
      <Segment>
        <Header>Filters</Header>
        <CreditsLessThan filter={filter} />
      </Segment>
    )
  }
}

const mapStateToProps = ({ populationFilters, locale, graphSpinner }) => ({
  populationFilters,
  translate: getTranslate(locale),
  loading: graphSpinner
})

export default connect(mapStateToProps)(PopulationFilters)
