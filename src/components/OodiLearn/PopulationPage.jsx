import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, string, shape } from 'prop-types'
import { Segment, Menu } from 'semantic-ui-react'
import selector from '../../selectors/oodilearnPopulations'

class PopulationPage extends Component {
    state={}

    render() {
      return (
        <Segment basic>
          <Menu>
            <Menu.Item icon="arrow circle left" onClick={this.props.goBack} />
            <Menu.Item header content={this.props.population} />
          </Menu>
          <Segment>
            <pre>
              {JSON.stringify(this.props.data, null, 2)}
            </pre>
          </Segment>
        </Segment>
      )
    }
}

PopulationPage.propTypes = {
  goBack: func.isRequired,
  population: string.isRequired,
  data: shape({}).isRequired
}

const mapStateToProps = (state, props) => ({
  data: selector.getPopulation(state, props.population)
})

export default connect(mapStateToProps)(PopulationPage)
