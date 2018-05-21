import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, object, string, arrayOf } from 'prop-types'
import { Segment, Header } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { makePopulationsToData } from '../../selectors/populationDetails'
import { setPopulationLimitField, clearPopulationLimit } from '../../redux/populationLimit'

import CreditAccumulationGraph from '../CreditAccumulationGraph'
import CourseQuarters from '../CourseQuarters'
import PopulationLimiter from '../PopulationLimiter'

class PopulationDetails extends Component {
  static propTypes = {
    translate: func.isRequired,
    samples: arrayOf(arrayOf(object)).isRequired,
    selectedStudents: arrayOf(string).isRequired
  }

  isSamplesRenderable = () => {
    const { samples } = this.props
    return samples && samples.length > 0
  }

  renderCourseStatistics = () => {
    const { samples, translate } = this.props
    let statistics = []
    if (samples) {
      statistics = samples.map((sample, i) =>
        (<CourseQuarters
          key={`course-quarters-${i}`} // eslint-disable-line react/no-array-index-key
          sample={sample}
          title={`${translate('populationStatistics.sampleId')}: ${i}`}
          translate={translate}
        />))
    }
    return (
      <Segment>
        <Header size="medium" dividing>{translate('populationStatistics.creditStatisticsHeader')}</Header>
        {statistics}
      </Segment>
    )
  }

  renderCreditGainGraphs = () => {
    const { samples, translate } = this.props
    const graphs = samples.map((sample, i) => (
      <CreditAccumulationGraph
        key={`credit-graph-${i}`} // eslint-disable-line react/no-array-index-key
        students={sample}
        title={`${translate('populationStatistics.sampleId')}: ${i}`}
        translate={translate}
        label={sample.label}
        maxCredits={sample.maxCredits}
        selectedStudents={this.props.selectedStudents}
      />
    ))

    return (
      <Segment>
        <Header size="medium" dividing>{translate('populationStatistics.graphSegmentHeader')}</Header>
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
        {this.renderCourseStatistics()}
        {this.renderCreditGainGraphs()}
      </div>
    )
  }
}

const populationsToData = makePopulationsToData()

const mapStateToProps = (state) => {
  const allSamples = populationsToData(state)

  const all = allSamples.length > 0 ? allSamples[0].map(s => s.studentNumber) : []

  return {
    samples: allSamples.map((sample) => {
      const credits = sample
        .map(s => s.courses.filter(c => c.passed).reduce((sum, c) => c.credits + sum, 0))

      sample.maxCredits = Math.round(Math.max(...credits) / 10) * 10
      return sample
    }),
    selected: state.populationLimit,
    selectedStudents: state.populationLimit ?
      state.populationLimit.course.students[state.populationLimit.field] :
      all,
    translate: getTranslate(state.locale)
  }
}

export default connect(mapStateToProps, {
  setPopulationLimitField, clearPopulationLimit
})(PopulationDetails)

