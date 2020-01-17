import React, { Component, useCallback } from 'react'
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
import TSA from '../../common/tsa'

const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent('Population statistics', action, name, value)

const useTabChangeAnalytics = action => {
  const previousTabIndex = React.useRef(0)

  const handleTabChange = useCallback(
    (e, data) => {
      const { activeIndex, panes } = data

      if (previousTabIndex.current !== activeIndex) {
        sendAnalytics(action, panes[activeIndex].menuItem)
        previousTabIndex.current = activeIndex
      }
    },
    [action, previousTabIndex]
  )

  return { handleTabChange }
}

const CourseStatisticsSegment = ({ samples, selectedStudents, translate }) => {
  const { CreditStatistics } = infoTooltips.PopulationStatistics

  const renderCreditsGainTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <PopulationCreditGainTable
          sample={samples.filter(s => selectedStudents.includes(s.studentNumber))}
          translate={translate}
        />
      </Tab.Pane>
    )
  }, [samples, selectedStudents, translate])

  const renderQuartersTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <CourseQuarters
          sample={samples.filter(s => selectedStudents.includes(s.studentNumber))}
          translate={translate}
        />
      </Tab.Pane>
    )
  }, [samples, selectedStudents, translate])

  const { handleTabChange } = useTabChangeAnalytics('Change Credit statistics tab')

  return (
    <Segment>
      <Header size="medium" dividing>
        {translate('populationStatistics.creditStatisticsHeader')}
        <InfoBox content={CreditStatistics} />
      </Header>

      {samples && (
        <Tab
          onTabChange={handleTabChange}
          menu={{ pointing: true }}
          panes={[
            {
              menuItem: 'Credits gained',
              render: renderCreditsGainTab
            },
            {
              menuItem: 'Quarters',
              render: renderQuartersTab
            }
          ]}
        />
      )}
    </Segment>
  )
}

CourseStatisticsSegment.propTypes = {
  samples: arrayOf(object).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  translate: func.isRequired
}

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

  renderCreditGainGraphs = () => {
    const { samples, translate, selectedStudents } = this.props
    const { CreditAccumulationGraph } = infoTooltips.PopulationStatistics

    const graphs = (
      <CreditAccumulationGraphHighCharts
        students={samples}
        title={`${translate('populationStatistics.sampleId')}`}
        translate={translate}
        label={samples.label}
        maxCredits={samples.maxCredits}
        selectedStudents={selectedStudents}
      />
    )

    return (
      <Segment>
        <Header size="medium" dividing>
          {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
          <InfoBox content={CreditAccumulationGraph} />
        </Header>
        {samples.length > 0 && graphs}
      </Segment>
    )
  }

  getExcludedFilters = () => {
    const { query, tagstudent, selectedStudents } = this.props

    const excludedFilters = []
    if (!query.studentStatuses.includes('CANCELLED')) {
      excludedFilters.push('CanceledStudyright')
    }
    const taggedStudentNumbers = tagstudent.map(tag => tag.studentnumber)
    if (intersection(taggedStudentNumbers, selectedStudents) < 1) {
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

    const { query, selectedStudents, selectedStudentsByYear } = this.props
    return (
      <div>
        <PopulationFilters samples={samples} exclude={this.getExcludedFilters()} />
        {this.renderCreditGainGraphs()}
        {!query.years && (
          <CourseStatisticsSegment samples={samples} selectedStudents={selectedStudents} translate={translate} />
        )}
        <PopulationCourses
          selectedStudents={selectedStudents}
          selectedStudentsByYear={selectedStudentsByYear}
          query={query}
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
