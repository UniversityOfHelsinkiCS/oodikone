import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, string, bool } from 'prop-types'
import { Segment, Menu } from 'semantic-ui-react'
import selector from '../../selectors/oodilearnPopulations'
import { getOodilearnPopulation } from '../../redux/oodilearnPopulation'
import PagePlaceholder from './PagePlaceholder'
import PopulationDashboard from './PopulationDashboard'
import { clear } from '../../redux/oodilearnPopulationForm'
import { courseSelectActions } from '../../redux/oodilearnPopulationCourseSelect'

class PopulationPage extends Component {
    state={}

    componentDidMount() {
      this.props.clearFilters()
      this.props.clearCourseSelection()
      this.props.getOodilearnPopulation(this.props.population)
    }

    render() {
      return (
        <Segment basic>
          <Menu>
            <Menu.Item icon="arrow circle left" onClick={this.props.goBack} />
            <Menu.Item header content={this.props.population} />
          </Menu>
          <Segment loading={this.props.loading}>
            { this.props.loading ? <PagePlaceholder /> : <PopulationDashboard /> }
          </Segment>
        </Segment>
      )
    }
}

PopulationPage.propTypes = {
  goBack: func.isRequired,
  population: string.isRequired,
  getOodilearnPopulation: func.isRequired,
  loading: bool.isRequired,
  clearFilters: func.isRequired,
  clearCourseSelection: func.isRequired
}

const mapStateToProps = state => ({
  data: selector.getPopulation(state),
  loading: selector.populationIsLoading(state)
})

export default connect(mapStateToProps, {
  getOodilearnPopulation,
  clearFilters: clear,
  clearCourseSelection: courseSelectActions.clear
})(PopulationPage)
