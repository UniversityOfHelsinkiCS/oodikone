import React, { useRef } from 'react'
import { connect } from 'react-redux'
import { func, object, arrayOf, bool, shape } from 'prop-types'
import { Message, Accordion, Popup } from 'semantic-ui-react'
import scrollToComponent from 'react-scroll-to-component'
import ReactMarkdown from 'react-markdown'
import { useLocalStorage } from '../../common/hooks'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import InfoBox from '../InfoBox'
import infoTooltips from '../../common/InfoToolTips'
import CreditGainStats from './CreditGainStats'
import useFilters from '../FilterTray/useFilters'
import useFilterTray from '../FilterTray/useFilterTray'
import info from '../../common/markdown/populationStatistics/creditAccumulation.info.md'

const PopulationDetails = ({
  samples,
  translate,
  queryIsSet,
  isLoading,
  query,
  selectedStudentsByYear,
  mandatoryToggle
}) => {
  const { allStudents, filteredStudents } = useFilters()
  const [trayOpen] = useFilterTray('filterTray')
  // TODO: Refactor this away from children:
  const selectedStudents = filteredStudents.map(stu => stu.studentNumber)

  const [activeIndex, setActiveIndex] = useLocalStorage('populationActiveIndex', [])
  const creditGraphRef = useRef()
  const creditGainRef = useRef()
  const courseTableRef = useRef()
  const studentTableRef = useRef()

  const handleClick = index => {
    const indexes = [...activeIndex].sort()
    if (indexes.includes(index)) {
      indexes.splice(indexes.findIndex(ind => ind === index), 1)
    } else {
      indexes.push(index)
    }
    setActiveIndex(prev => {
      if (prev.length < indexes.length) {
        const foundIndex = indexes.find(index => !prev.includes(index))
        const refs = [creditGraphRef, creditGainRef, courseTableRef, studentTableRef]
        scrollToComponent(refs[foundIndex].current, { align: 'bottom' })
      }
      return indexes
    })
  }

  const renderCreditGainGraphs = () => {
    const graphs = (
      <CreditAccumulationGraphHighCharts
        students={samples}
        title={`${translate('populationStatistics.sampleId')}`}
        translate={translate}
        label={samples.label}
        maxCredits={samples.maxCredits}
        selectedStudents={selectedStudents}
        trayOpen={trayOpen}
      />
    )
    return (
      <>
        <InfoBox content={info} />
        {samples.length > 0 && graphs}
      </>
    )
  }

  if (isLoading || !queryIsSet) {
    return null
  }

  if (samples.length === 0) {
    return <Message negative content={`${translate('populationStatistics.emptyQueryResult')}`} />
  }

  const { Students, CreditStatistics, CoursesOf, CreditAccumulationGraph } = infoTooltips.PopulationStatistics

  const panels = [
    {
      key: 0,
      title: {
        content: (
          <>
            {activeIndex.includes(0) ? (
              <>
                {translate('populationStatistics.graphSegmentHeader')} (for {filteredStudents.length} students)
              </>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    {translate('populationStatistics.graphSegmentHeader')} (for {filteredStudents.length} students)
                  </span>
                }
                position="top center"
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
      onTitleClick: () => handleClick(0),
      content: {
        content: <div ref={creditGraphRef}>{renderCreditGainGraphs()}</div>
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
      onTitleClick: () => handleClick(1),
      content: {
        content: !query.years ? (
          <div ref={creditGainRef}>
            <CreditGainStats filteredStudents={filteredStudents} translate={translate} />
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
      onTitleClick: () => handleClick(2),
      content: {
        content: (
          <div ref={courseTableRef}>
            <PopulationCourses
              selectedStudents={selectedStudents}
              selectedStudentsByYear={selectedStudentsByYear}
              query={query}
              allStudents={allStudents}
              filteredStudents={filteredStudents}
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
              <>Students ({filteredStudents.length})</>
            ) : (
              <Popup
                trigger={
                  <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
                    Students ({filteredStudents.length})
                  </span>
                }
                position="top center"
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
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={studentTableRef}>
            <PopulationStudents mandatoryToggle={mandatoryToggle} filteredStudents={filteredStudents} />
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

PopulationDetails.propTypes = {
  translate: func.isRequired,
  samples: arrayOf(object).isRequired,
  queryIsSet: bool.isRequired,
  isLoading: bool.isRequired,
  selectedStudentsByYear: shape({}).isRequired,
  query: shape({}).isRequired,
  mandatoryToggle: bool.isRequired
}

export default connect(null)(PopulationDetails)
