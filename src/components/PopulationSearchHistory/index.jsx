import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, shape, arrayOf, object, bool } from 'prop-types'
import { getTranslate } from 'react-localize-redux'

import PopulationQueryCard from '../PopulationQueryCard'
import { removePopulation } from '../../redux/populations'
import { clearPopulationCourses } from '../../redux/populationCourses'
import { clearPopulationFilters } from '../../redux/populationFilters'

import styles from './populationSearchHistory.css'

class PopulationSearchHistory extends Component {
  static propTypes = {
    translate: func.isRequired,
    removePopulation: func.isRequired,
    populations: shape({
      pending: bool,
      error: bool,
      data: arrayOf(object),
      query: object
    }).isRequired,
    units: object // eslint-disable-line
  }

  removePopulation = uuid => this.props.removePopulation(uuid)

  renderQueryCards = () => {
    const { populations, translate, units } = this.props
    return populations.query ? (<PopulationQueryCard
      key={`population-${populations.query.uuid}`}
      translate={translate}
      population={populations.data}
      query={populations.query}
      queryId={0}
      unit={units.data.find(u => u.id === populations.query.studyRights[0])} // Possibly deprecated
      units={units.data.filter(u => populations.query.studyRights.some(sr => sr === u.id))}
      removeSampleFn={this.removePopulation}
    />) : null
  }

  render() {
    return (
      <div className={styles.historyContainer} >
        {this.renderQueryCards()}
      </div>
    )
  }
}

const mapStateToProps = ({ populations, units, locale }) => ({
  populations,
  units,
  translate: getTranslate(locale)
})

const mapDispatchToProps = dispatch => ({
  removePopulation: (uuid) => {
    dispatch(removePopulation(uuid))
    dispatch(clearPopulationCourses())
    dispatch(clearPopulationFilters())
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(PopulationSearchHistory)
