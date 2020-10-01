import React, { useRef } from 'react'
import { connect } from 'react-redux'
import { object, arrayOf, bool, shape } from 'prop-types'
import { Message, Accordion } from 'semantic-ui-react'
import scrollToComponent from 'react-scroll-to-component'
import { useLocalStorage } from '../../common/hooks'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import InfoBox from '../InfoBox'
import CreditGainStats from './CreditGainStats'
import useFilters from '../FilterTray/useFilters'
import useFilterTray from '../FilterTray/useFilterTray'
import info from '../../common/markdown/populationStatistics/creditAccumulation.info.md'
import useLanguage from '../LanguagePicker/useLanguage'

const PopulationDetails = ({ samples, queryIsSet, isLoading, query, selectedStudentsByYear, mandatoryToggle }) => {
  const { allStudents, filteredStudents } = useFilters()
  const [trayOpen] = useFilterTray('filterTray')
  const { language } = useLanguage()
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
        title="Id"
        label={samples.label}
        maxCredits={samples.maxCredits}
        selectedStudents={selectedStudents}
        trayOpen={trayOpen}
        language={language}
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
    return <Message negative content="No statistics found for the given query." />
  }

  const panels = [
    {
      key: 0,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit accumulation (for {filteredStudents.length} students)
          </span>
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
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit statistics
          </span>
        )
      },
      onTitleClick: () => handleClick(1),
      content: {
        content: !query.years ? (
          <div ref={creditGainRef}>
            <CreditGainStats filteredStudents={filteredStudents} />
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
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Courses of population
          </span>
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
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({filteredStudents.length})
          </span>
        )
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={studentTableRef}>
            <PopulationStudents
              language={language}
              mandatoryToggle={mandatoryToggle}
              filteredStudents={filteredStudents}
            />
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
  samples: arrayOf(object).isRequired,
  queryIsSet: bool.isRequired,
  isLoading: bool.isRequired,
  selectedStudentsByYear: shape({}).isRequired,
  query: shape({}).isRequired,
  mandatoryToggle: bool.isRequired
}

export default connect(null)(PopulationDetails)
