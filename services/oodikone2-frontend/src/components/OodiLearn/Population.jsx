import React, { Component } from 'react'
import PopulationSearch from './PopulationSearch'
import PopulationPage from './PopulationPage'

class Population extends Component {
  state={
    selected: undefined
  }

  render() {
    return !this.state.selected
      ? <PopulationSearch handleClick={id => this.setState({ selected: id })} />
      : <PopulationPage
        goBack={() => this.setState({ selected: undefined })}
        population={this.state.selected}
      />
  }
}

export default Population
