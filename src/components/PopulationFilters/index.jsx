import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Segment, Header, Button } from 'semantic-ui-react'
import { arrayOf, object } from 'prop-types'

import CreditsLessThan from './CreditsLessThan'

class PopulationFilters extends Component {
  static propTypes = {
    populationFilters: arrayOf(object).isRequired
  }

  state = {
    visible: false
  }

  render() {
    if (!this.state.visible) {
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

const mapStateToProps = ({ populationFilters }) => ({
  populationFilters
})

export default connect(mapStateToProps)(PopulationFilters)
