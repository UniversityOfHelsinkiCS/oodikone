import React, { Component, useCallback } from 'react'
import { connect } from 'react-redux'
import { func, object, string, arrayOf, bool, shape } from 'prop-types'
import { Segment, Header, Message, Tab, Accordion, Popup } from 'semantic-ui-react'
import { getTranslate } from 'react-localize-redux'
import { flattenDeep, intersection } from 'lodash'
import scrollToComponent from 'react-scroll-to-component'
import ReactMarkdown from 'react-markdown'

import selectors from '../../selectors/populationDetails'
import { getTotalCreditsFromCourses, flattenStudyrights } from '../../common'
import { useTabChangeAnalytics } from '../../common/hooks'
import PopulationFilters from '../PopulationFilters'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import CourseQuarters from '../CourseQuarters'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import PopulationCreditGainTable from '../PopulationCreditGainTable'
import InfoBox from '../InfoBox'
import infoTooltips from '../../common/InfoToolTips'

const CourseStatisticsSegment = ({ samples, selectedStudents, translate, accordionView }) => {
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

  const { handleTabChange } = useTabChangeAnalytics('Population statistics', 'Change Credit statistics tab')

  if (accordionView)
    return (
      <>
        <Header>
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
      </>
    )

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
  translate: func.isRequired,
  accordionView: bool.isRequired
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
    tagstudent: arrayOf(shape({})).isRequired,
    studytracks: shape({}).isRequired,
    accordionView: bool.isRequired
  }

  constructor() {
    super()
    this.creditGraphRef = React.createRef()
    this.creditGainRef = React.createRef()
    this.courseTableRef = React.createRef()
    this.studentTableRef = React.createRef()
  }

  state = {
    activeIndex: []
  }

  componentDidUpdate = (prevProps, prevState) => {
    if (prevState.activeIndex.length < this.state.activeIndex.length) {
      const foundIndex = this.state.activeIndex.find(index => !prevState.activeIndex.includes(index))
      const refs = [this.creditGraphRef, this.creditGainRef, this.courseTableRef, this.studentTableRef]
      scrollToComponent(refs[foundIndex].current, { align: 'bottom' })
    }
  }

  handleClick = index => {
    this.setState(prevState => {
      const indexes = [...prevState.activeIndex].sort()
      if (indexes.includes(index)) {
        indexes.splice(indexes.findIndex(ind => ind === index), 1)
      } else {
        indexes.push(index)
      }

      return { activeIndex: indexes }
    })
  }

  renderCreditGainGraphs = () => {
    const { samples, translate, selectedStudents, accordionView } = this.props
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
    if (accordionView)
      return (
        <>
          <Header>
            <InfoBox content={CreditAccumulationGraph} />
          </Header>
          {samples.length > 0 && graphs}
        </>
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
    const { query, tagstudent, selectedStudents, samples, studytracks } = this.props

    const studyrights = samples.flatMap(student => flattenStudyrights(student.studyrights, query.studyRights.programme))
    const studytracksInPopulation = intersection(Object.keys(studytracks), studyrights)

    const excludedFilters = []

    if (!query.studentStatuses.includes('CANCELLED')) excludedFilters.push('CanceledStudyright')

    const taggedStudentNumbers = tagstudent.map(tag => tag.studentnumber)

    if (intersection(taggedStudentNumbers, selectedStudents) < 1) excludedFilters.push('TagFilter')

    if (studytracksInPopulation.length < 1) excludedFilters.push('StudytrackFilter')

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
    const accordionView = true
    const { Students, CreditStatistics, CoursesOf, CreditAccumulationGraph } = infoTooltips.PopulationStatistics

    const panels = [
      {
        key: 0,
        title: {
          content: (
            <>
              {this.state.activeIndex.includes(0) ? (
                <>
                  {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
                </>
              ) : (
                <Popup
                  trigger={
                    <span style={{ paddingRight: '70vw', paddingTop: '1vh', paddingBottom: '1vh' }}>
                      {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
                    </span>
                  }
                  position="top center"
                  offset="0, 50px"
                  wide="very"
                >
                  <Popup.Content>
                    {' '}
                    <ReactMarkdown source={CreditAccumulationGraph} escapeHtml={false} />
                  </Popup.Content>
                </Popup>
              )}
            </>
          )
        },
        onTitleClick: () => this.handleClick(0),
        content: {
          content: <div ref={this.creditGraphRef}>{this.renderCreditGainGraphs()}</div>
        }
      },
      {
        key: 1,
        title: {
          content: (
            <>
              {this.state.activeIndex.includes(1) ? (
                <>Credit statistics</>
              ) : (
                <Popup
                  trigger={
                    <span style={{ paddingRight: '70vw', paddingTop: '1vh', paddingBottom: '1vh' }}>
                      Credit statistics
                    </span>
                  }
                  position="top center"
                  offset="0, 50px"
                  wide="very"
                >
                  <Popup.Content>
                    {' '}
                    <ReactMarkdown source={CreditStatistics} escapeHtml={false} />
                  </Popup.Content>
                </Popup>
              )}
            </>
          )
        },
        onTitleClick: () => this.handleClick(1),
        content: {
          content: !query.years && (
            <div ref={this.creditGainRef}>
              <CourseStatisticsSegment
                accordionView={accordionView}
                samples={samples}
                selectedStudents={selectedStudents}
                translate={translate}
              />
            </div>
          )
        }
      },
      {
        key: 2,
        title: {
          content: (
            <>
              {this.state.activeIndex.includes(2) ? (
                <>Courses of population</>
              ) : (
                <Popup
                  trigger={
                    <span style={{ paddingRight: '70vw', paddingTop: '1vh', paddingBottom: '1vh' }}>
                      Courses of population
                    </span>
                  }
                  position="top center"
                  offset="0, 50px"
                  wide="very"
                >
                  <Popup.Content>
                    {' '}
                    <ReactMarkdown source={CoursesOf} escapeHtml={false} />
                  </Popup.Content>
                </Popup>
              )}
            </>
          )
        },
        onTitleClick: () => this.handleClick(2),
        content: {
          content: (
            <div ref={this.courseTableRef}>
              <PopulationCourses
                selectedStudents={selectedStudents}
                selectedStudentsByYear={selectedStudentsByYear}
                query={query}
                accordionView={accordionView}
              />
            </div>
          )
        }
      },
      {
        key: 3,
        title: {
          content: (
            <>
              {this.state.activeIndex.includes(3) ? (
                <>Students ({selectedStudents.length})</>
              ) : (
                <Popup
                  trigger={
                    <span style={{ paddingRight: '70vw', paddingTop: '1vh', paddingBottom: '1vh' }}>
                      Students ({selectedStudents.length})
                    </span>
                  }
                  position="top center"
                  offset="0, 50px"
                  wide="very"
                >
                  <Popup.Content>
                    {' '}
                    <ReactMarkdown source={Students} escapeHtml={false} />
                  </Popup.Content>
                </Popup>
              )}
            </>
          )
        },
        onTitleClick: () => this.handleClick(3),
        content: {
          content: (
            <div ref={this.studentTableRef}>
              <PopulationStudents accordionView={accordionView} />
            </div>
          )
        }
      }
    ]

    if (accordionView)
      return (
        <>
          <Accordion activeIndex={this.state.activeIndex} exclusive={false} styled fluid panels={panels} />
        </>
      )

    return (
      <div>
        <PopulationFilters samples={samples} exclude={this.getExcludedFilters()} accordionView={false} />
        {this.renderCreditGainGraphs()}
        {!query.years && (
          <CourseStatisticsSegment
            samples={samples}
            selectedStudents={selectedStudents}
            translate={translate}
            accordionView={accordionView}
          />
        )}
        <PopulationCourses
          selectedStudents={selectedStudents}
          selectedStudentsByYear={selectedStudentsByYear}
          query={query}
          accordionView={accordionView}
        />
        <PopulationStudents accordionView={accordionView} />
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
    tagstudent: state.tagstudent.data || {},
    studytracks: state.populationDegreesAndProgrammes.data.studyTracks || {}
  }
}

export default connect(mapStateToProps)(PopulationDetails)
