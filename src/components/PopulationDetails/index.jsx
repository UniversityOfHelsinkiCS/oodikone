import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, object, string, arrayOf, bool } from 'prop-types'
import { Segment, Header, Message } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import _ from 'lodash'

import { makePopulationsToData } from '../../selectors/populationDetails'

import PopulationFilters from '../PopulationFilters'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import CourseQuarters from '../CourseQuarters'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import CourseParticipationFilters from '../PopulationFilters/CourseParticipationFilters'

class PopulationDetails extends Component {
  static propTypes = {
    translate: func.isRequired,
    samples: arrayOf(object).isRequired,
    selectedStudents: arrayOf(string).isRequired,
    queryIsSet: bool.isRequired,
    isLoading: bool.isRequired
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
        <CourseParticipationFilters />
        {graphs}
      </Segment>
    )
  }

  render() {
    const { samples, translate, queryIsSet, isLoading } = this.props
    if (isLoading || !queryIsSet) {
      return null
    }
    if (samples.length === 0) {
      return (
        <Message negative content={`${translate('populationStatistics.emptyQueryResult')}`} />
      )
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
  const samples = populationsToData(state)
  let selectedStudents = samples.length > 0 ? samples.map(s => s.studentNumber) : []

  // TODO refactor to more functional approach where the whole sample is not tested for each filter
  if (samples.length > 0 && state.populationFilters.length > 0) {
    const matchingStudents = state.populationFilters
      .map(f => samples.filter(f.filter).map(s => s.studentNumber))

    selectedStudents = _.intersection(...matchingStudents)
  }

  if (samples.length > 0) {
    const credits = samples.map(s =>
      s.courses.filter(c => c.passed).reduce((sum, c) => c.credits + sum, 0))
    samples.maxCredits = Math.round(Math.max(...credits) / 10) * 10
  }

  return {
    samples,
    selectedStudents,
    translate: getTranslate(state.locale),
    queryIsSet: !!state.populations.query,
    isLoading: state.populations.pending === true
  }
}

export default connect(mapStateToProps)(PopulationDetails)
