import React, { Component } from 'react'
import { connect } from 'react-redux'
import { func, object, string, arrayOf, bool, shape } from 'prop-types'
import { Segment, Header, Message, Tab } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { flattenDeep, intersection } from 'lodash'
import selectors from '../../selectors/populationDetails'
import { getTotalCreditsFromCourses } from '../../common'
import PopulationFilters from '../PopulationFilters'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import CourseQuarters from '../CourseQuarters'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import PopulationCreditGainTable from '../PopulationCreditGainTable'
import InfoBox from '../InfoBox'
import infoTooltips from '../../common/InfoToolTips'

class PopulationDetails extends Component {
  static propTypes = {
    translate: func.isRequired,
    samples: arrayOf(object).isRequired,
    selectedStudents: arrayOf(string).isRequired,
    queryIsSet: bool.isRequired,
    isLoading: bool.isRequired,
    selectedStudentsByYear: shape({}).isRequired,
    query: shape({}).isRequired,
    tagstudent: arrayOf(shape({})).isRequired
  }

  renderCourseStatistics = () => {
    const { samples, translate } = this.props
    const { CreditStatistics } = infoTooltips.PopulationStatistics
    let statistics = null

    if (samples) {
      statistics = (
        <Tab
          menu={{ pointing: true }}
          panes={[
            {
              menuItem: 'Credits gained',
              render: () => (
                <Tab.Pane attached={false}>
                  <PopulationCreditGainTable
                    sample={samples.filter(s => this.props.selectedStudents.includes(s.studentNumber))}
                    translate={translate}
                  />
                </Tab.Pane>
              )
            },
            {
              menuItem: 'Quarters',
              render: () => (
                <Tab.Pane attached={false}>
                  <CourseQuarters
                    sample={samples.filter(s => this.props.selectedStudents.includes(s.studentNumber))}
                    translate={translate}
                  />
                </Tab.Pane>
              )
            }
          ]}
        />
      )
    }

    return (
      <Segment>
        <Header size="medium" dividing>
          {translate('populationStatistics.creditStatisticsHeader')}
          <InfoBox content={CreditStatistics} />
        </Header>
        {statistics}
      </Segment>
    )
  }

  renderCreditGainGraphs = () => {
    const { samples, translate } = this.props
    const { CreditAccumulationGraph } = infoTooltips.PopulationStatistics

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
          {translate('populationStatistics.graphSegmentHeader')} (for {this.props.selectedStudents.length} students)
          <InfoBox content={CreditAccumulationGraph} />
        </Header>
        {samples.length > 0 ? graphs : null}
      </Segment>
    )
  }

  getExcludedFilters = () => {
    const excludedFilters = []
    if (!this.props.query.studentStatuses.includes('CANCELLED')) {
      excludedFilters.push('CanceledStudyright')
    }
    const taggedStudentNumbers = this.props.tagstudent.map(tag => tag.studentnumber)
    if (intersection(taggedStudentNumbers, this.props.selectedStudents) < 1) {
      excludedFilters.push('TagFilter')
    }

    return excludedFilters
  }

  render() {
    const { samples, translate, queryIsSet, isLoading } = this.props

    if (isLoading || !queryIsSet) {
      return null
    }

    if (samples.length === 0) {
      return <Message negative content={`${translate('populationStatistics.emptyQueryResult')}`} />
    }

    return (
      <div>
        <PopulationFilters samples={this.props.samples} exclude={this.getExcludedFilters()} />
        {this.renderCreditGainGraphs()}
        {!this.props.query.years ? this.renderCourseStatistics() : null}
        <PopulationCourses
          selectedStudents={this.props.selectedStudents}
          selectedStudentsByYear={this.props.selectedStudentsByYear}
          query={this.props.query}
        />
        <PopulationStudents />
      </div>
    )
  }
}

const mapStateToProps = state => {
  const { samples, selectedStudents, complemented, selectedStudentsByYear } = selectors.makePopulationsToData(state)
  // REFACTOR YES, IF YOU SEE THIS COMMENT YOU ARE OBLIGATED TO FIX IT
  if (samples.length > 0) {
    const creditsAndDates = samples.map(s => {
      const passedCourses = s.courses.filter(c => c.passed)
      const passedCredits = getTotalCreditsFromCourses(passedCourses)
      const dates = passedCourses.map(c => c.date)
      const datesWithCredits = passedCourses.filter(c => c.credits > 0).map(c => c.date)
      return { passedCredits, dates, datesWithCredits }
    })
    const credits = creditsAndDates.map(cd => cd.passedCredits)
    const dates = flattenDeep(creditsAndDates.map(cd => cd.dates)).map(date => new Date(date).getTime())
    const datesWithCredits = flattenDeep(creditsAndDates.map(cd => cd.datesWithCredits)).map(date =>
      new Date(date).getTime()
    )
    samples.maxCredits = Math.max(...credits)
    samples.maxDate = Math.max(...dates)
    samples.minDate = Math.min(...dates)
    samples.minDateWithCredits = Math.min(...datesWithCredits)
  }

  return {
    samples,
    selectedStudents,
    selectedStudentsByYear,
    complemented,
    translate: getTranslate(state.localize),
    queryIsSet: !!state.populations.query,
    isLoading: state.populations.pending === true,
    query: state.populations.query || {},
    tagstudent: state.tagstudent.data || {}
  }
}

export default connect(mapStateToProps)(PopulationDetails)
