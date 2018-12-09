import React, { Component } from 'react'
import { connect } from 'react-redux'
import { shape } from 'prop-types'
import { Segment } from 'semantic-ui-react'
import selector from '../../selectors/oodilearnPopulations'
import PopulationCategorySpider from './PopulationCategorySpider'
import PopulationCategoryGraph from './PopulationCategoryGraph'

class PopulationDashboard extends Component {
    state={}

    render() {
      return (
        <Segment basic>
          <PopulationCategorySpider data={this.props.populationCategories} />
          <PopulationCategoryGraph data={this.props.populationGraphSeries} />
        </Segment>
      )
    }
}

PopulationDashboard.propTypes = {
  populationCategories: shape({}),
  populationGraphSeries: shape({})
}

PopulationDashboard.defaultProps = {
  populationCategories: undefined,
  populationGraphSeries: undefined
}

const mapStateToProps = state => ({
  populationCategories: selector.getPopulationCategorySeries(state),
  populationGraphSeries: selector.getPopulationGraphSeries(state)
})

export default connect(mapStateToProps)(PopulationDashboard)
