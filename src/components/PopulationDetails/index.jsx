import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, object, string, arrayOf } from 'prop-types'
import { Segment, Header } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'

import { makePopulationsToData } from '../../selectors/populationDetails'
import { setPopulationLimitField, clearPopulationLimit } from '../../redux/populationLimit'

import PopulationFilters from '../PopulationFilters'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import CourseQuarters from '../CourseQuarters'
import PopulationLimiter from '../PopulationLimiter'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'

class PopulationDetails extends Component {
  static propTypes = {
    translate: func.isRequired,
    samples: arrayOf(object).isRequired,
    selectedStudents: arrayOf(string).isRequired
  }

  isSamplesRenderable = () => {
    const { samples } = this.props
    return samples && samples.length > 0
  }

  renderCourseStatistics = () => {
    const { samples, translate } = this.props
    let statistics = null
    if (samples) {
      statistics = (
        <CourseQuarters
          sample={samples.filter(s => this.props.selectedStudents.includes(s.studentNumber))}
          translate={translate}
        />
      )
    }
    return (
      <Segment>
        <Header size="medium" dividing>
          {translate('populationStatistics.creditStatisticsHeader')}
        </Header>
        <PopulationLimiter />
        {statistics}
      </Segment>
    )
  }

  renderCreditGainGraphs = () => {
    const { samples, translate } = this.props
    const graphs = (
      <CreditAccumulationGraphHighCharts
        students={samples}
        title={`${translate('populationStatistics.sampleId')}`}
        translate={translate}
        label={samples.label}
        maxCredits={samples.maxCredits}
        selectedStudents={this.props.selectedStudents}
      />
    )

    return (
      <Segment>
        <Header size="medium" dividing>
          {translate('populationStatistics.graphSegmentHeader')}
        </Header>
        <PopulationLimiter />
        {graphs}
      </Segment>
    )
  }

  render() {
    if (!this.isSamplesRenderable()) {
      return null
    }

    return (
      <div>
        <PopulationFilters />
        {this.renderCourseStatistics()}
        {this.renderCreditGainGraphs()}
        <PopulationStudents
          samples={this.props.samples}
          selectedStudents={this.props.selectedStudents}
        />
        <PopulationCourses />
      </div>
    )
  }
}

const populationsToData = makePopulationsToData()

const mapStateToProps = (state) => {
  const allSamples = populationsToData(state)
  const allStudents = allSamples.length > 0 ? allSamples.map(s => s.studentNumber) : []

  let selectedStudents = state.populationLimit
    ? state.populationLimit.course.students[state.populationLimit.field]
    : allStudents

  if (state.populationFilters.length > 0) {
    const { filter } = state.populationFilters[0]
    selectedStudents =
      allSamples.length > 0 ? allSamples.filter(filter).map(s => s.studentNumber) : []
  }
  const credits = allSamples.map(s =>
    s.courses.filter(c => c.passed).reduce((sum, c) => c.credits + sum, 0))
  allSamples.maxCredits = Math.round(Math.max(...credits) / 10) * 10

  return {
    samples: allSamples,
    selected: state.populationLimit,
    selectedStudents,
    translate: getTranslate(state.locale)
  }
}

export default connect(mapStateToProps, {
  setPopulationLimitField,
  clearPopulationLimit
})(PopulationDetails)
