import React, { Component } from 'react'
import { connect } from 'react-redux'
import { shape } from 'prop-types'
import { Message, Grid } from 'semantic-ui-react'
import selector from '../../selectors/oodilearnPopulations'
import PopulationCategoryGraph from './PopulationCategoryGraph'
import PopulationFilters from './PopulationFilters'
import PopulationStats from './PopulationStats'
import PopulationStackedBar from './PopulationStackedBar'

const HEADER = 'Population profile dimensions by category'
const DESCRIPTION = `
Each dimension is divided into average, below and above average groups 
based on the composition of the selected population.
`

class PopulationDashboard extends Component {
    state={}

    render() {
      return (
        <Grid>
          <Grid.Row>
            <Grid.Column>
              <Message
                header={HEADER}
                content={DESCRIPTION}
              />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <PopulationStats />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row stretched>
            <Grid.Column width={6}>
              <PopulationFilters />
            </Grid.Column>
            <Grid.Column width={10} verticalAlign="middle">
              <PopulationStackedBar />
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <PopulationCategoryGraph data={this.props.populationGraphSeries} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      )
    }
}

PopulationDashboard.propTypes = {
  populationGraphSeries: shape({})
}

PopulationDashboard.defaultProps = {
  populationGraphSeries: undefined
}

const mapStateToProps = state => ({
  populationGraphSeries: selector.getPopulationGraphSeries(state)
})

export default connect(mapStateToProps)(PopulationDashboard)
