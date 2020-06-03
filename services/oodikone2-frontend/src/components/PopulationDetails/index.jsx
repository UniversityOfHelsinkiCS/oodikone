import React, { Component, useCallback } from 'react'
import { connect } from 'react-redux'
import { func, object, string, arrayOf, bool, shape, number } from 'prop-types'
import { Header, Message, Tab, Accordion, Popup } from 'semantic-ui-react'
import scrollToComponent from 'react-scroll-to-component'
import ReactMarkdown from 'react-markdown'

import { useTabChangeAnalytics, useLocalStorage } from '../../common/hooks'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import CourseQuarters from '../CourseQuarters'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import PopulationCreditGainTable from '../PopulationCreditGainTable'
import InfoBox from '../InfoBox'
import infoTooltips from '../../common/InfoToolTips'

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

  const { handleTabChange } = useTabChangeAnalytics('Population statistics', 'Change Credit statistics tab')
  return (
    <>
      <Header>
        <InfoBox content={CreditStatistics.Infobox} />
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
}

CourseStatisticsSegment.propTypes = {
  samples: arrayOf(object).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  translate: func.isRequired
}

const withActiveIndex = Component => props => {
  const [activeIndex, setActiveIndex] = useLocalStorage('populationActiveIndex', [])
  return <Component {...props} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
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
    activeIndex: arrayOf(number).isRequired,
    setActiveIndex: func.isRequired,
    mandatoryToggle: bool.isRequired
  }

  constructor() {
    super()
    this.creditGraphRef = React.createRef()
    this.creditGainRef = React.createRef()
    this.courseTableRef = React.createRef()
    this.studentTableRef = React.createRef()
  }

  componentDidUpdate = prevProps => {
    if (prevProps.activeIndex.length < this.props.activeIndex.length) {
      const foundIndex = this.props.activeIndex.find(index => !prevProps.activeIndex.includes(index))
      const refs = [this.creditGraphRef, this.creditGainRef, this.courseTableRef, this.studentTableRef]
      scrollToComponent(refs[foundIndex].current, { align: 'bottom' })
    }
  }

  handleClick = index => {
    const indexes = [...this.props.activeIndex].sort()
    if (indexes.includes(index)) {
      indexes.splice(indexes.findIndex(ind => ind === index), 1)
    } else {
      indexes.push(index)
    }
    this.props.setActiveIndex(indexes)
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
      <>
        <Header>
          <InfoBox content={CreditAccumulationGraph.Infobox} />
        </Header>
        {samples.length > 0 && graphs}
      </>
    )
  }

  render() {
    const { samples, translate, queryIsSet, isLoading, activeIndex } = this.props

    if (isLoading || !queryIsSet) {
      return null
    }

    if (samples.length === 0) {
      return <Message negative content={`${translate('populationStatistics.emptyQueryResult')}`} />
    }

    const { query, selectedStudents, selectedStudentsByYear } = this.props
    const { Students, CreditStatistics, CoursesOf, CreditAccumulationGraph } = infoTooltips.PopulationStatistics

    const panels = [
      {
        key: 0,
        title: {
          content: (
            <>
              {activeIndex.includes(0) ? (
                <>
                  {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
                </>
              ) : (
                <Popup
                  trigger={
                    <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                      {translate('populationStatistics.graphSegmentHeader')} (for {selectedStudents.length} students)
                    </span>
                  }
                  position="top center"
                  offset="0, 50px"
                  wide="very"
                >
                  <Popup.Content>
                    {' '}
                    <ReactMarkdown source={CreditAccumulationGraph.AccordionTitle} escapeHtml={false} />
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
              {activeIndex.includes(1) ? (
                <>Credit statistics</>
              ) : (
                <Popup
                  trigger={
                    <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                      Credit statistics
                    </span>
                  }
                  position="top center"
                  offset="0, 50px"
                  wide="very"
                >
                  <Popup.Content>
                    {' '}
                    <ReactMarkdown source={CreditStatistics.AccordionTitle} escapeHtml={false} />
                  </Popup.Content>
                </Popup>
              )}
            </>
          )
        },
        onTitleClick: () => this.handleClick(1),
        content: {
          content: !query.years ? (
            <div ref={this.creditGainRef}>
              <CourseStatisticsSegment samples={samples} selectedStudents={selectedStudents} translate={translate} />
            </div>
          ) : (
            <div>This table is omitted when searching population of multiple years</div>
          )
        }
      },
      {
        key: 2,
        title: {
          content: (
            <>
              {activeIndex.includes(2) ? (
                <>Courses of population</>
              ) : (
                <Popup
                  trigger={
                    <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                      Courses of population
                    </span>
                  }
                  position="top center"
                  offset="0, 50px"
                  wide="very"
                >
                  <Popup.Content>
                    {' '}
                    <ReactMarkdown source={CoursesOf.AccordionTitle} escapeHtml={false} />
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
                accordionView
                selectedStudents={selectedStudents}
                selectedStudentsByYear={selectedStudentsByYear}
                query={query}
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
              {activeIndex.includes(3) ? (
                <>Students ({selectedStudents.length})</>
              ) : (
                <Popup
                  trigger={
                    <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                      Students ({selectedStudents.length})
                    </span>
                  }
                  position="top center"
                  offset="0, 50px"
                  wide="very"
                >
                  <Popup.Content>
                    {' '}
                    <ReactMarkdown source={Students.AccordionTitle} escapeHtml={false} />
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
              <PopulationStudents accordionView mandatoryToggle={this.props.mandatoryToggle} />
            </div>
          )
        }
      }
    ]

    return (
      <>
        <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
      </>
    )
  }
}

export default connect(null)(withActiveIndex(PopulationDetails))
