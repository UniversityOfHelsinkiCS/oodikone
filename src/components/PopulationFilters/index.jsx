import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Button } from 'semantic-ui-react'
import { func, arrayOf, object, bool } from 'prop-types'

import { getTranslate } from 'react-localize-redux'
import CreditsLessThan from './CreditsLessThan'
import SegmentDimmer from '../SegmentDimmer'

class PopulationFilters extends Component {
  static propTypes = {
    translate: func.isRequired,
    populationFilters: arrayOf(object).isRequired,
    loading: bool.isRequired
  }

  state = {
    visible: false
  }

  render() {
    if (this.props.populationFilters.length === 0 && !this.state.visible) {
      return (
        <Segment>
          <SegmentDimmer translate={this.props.translate} isLoading={this.props.loading} />
          <Header>Filters</Header>
          <Button onClick={() => this.setState({ visible: true })}>add</Button>
        </Segment>
      )
    }

    if (this.props.populationFilters.length === 0) {
      return (
        <Segment>
          <Header>Filters</Header>
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
