import React from 'react'
import { connect } from 'react-redux'
import { Segment } from 'semantic-ui-react'
import { shape } from 'prop-types'
import selector from '../../selectors/oodilearnPopulations'

const PopulationStats = ({ stats }) => (
  <Segment>
    <pre style={{ overflow: 'auto' }}>
      {JSON.stringify(stats, null, 2)}
    </pre>
  </Segment>
)

PopulationStats.propTypes = {
  stats: shape({}).isRequired
}

const mapStateToProps = state => ({
  stats: selector.getFilteredPopulationStats(state)
})

export default connect(mapStateToProps)(PopulationStats)
