import React, { useRef } from 'react'
import { connect } from 'react-redux'
import { Accordion } from 'semantic-ui-react'
import useFilters from 'components/FilterView/useFilters'
import studyPlanFilter from 'components/FilterView/filters/hops'
import { creditDateFilter } from 'components/FilterView/filters'
import { useGetProgressCriteriaQuery } from 'redux/programmeProgressCriteria'
import { useLocalStorage } from '../../common/hooks'
import { useGetAuthorizedUserQuery } from '../../redux/auth'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import InfoBox from '../Info/InfoBox'
import CreditGainStats from './CreditGainStats'
import AgeStats from './AgeStats'
import useLanguage from '../LanguagePicker/useLanguage'
import sendEvent from '../../common/sendEvent'
import infotooltips from '../../common/InfoToolTips'

const sendAnalytics = sendEvent.populationStatistics

const PopulationDetails = ({
  allStudents,
  filteredStudents,
  queryIsSet,
  isLoading,
  query,
  dataExport,
  selectedStudentsByYear,
  programmeCodes,
}) => {
  const { language } = useLanguage()
  const [activeIndex, setActiveIndex] = useLocalStorage('populationActiveIndex', [])
  const { isLoading: authLoading, rights, isAdmin } = useGetAuthorizedUserQuery()
  const creditGraphRef = useRef()
  const creditGainRef = useRef()
  const courseTableRef = useRef()
  const studentTableRef = useRef()
  const { useFilterSelector } = useFilters()
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)
  const criteria = useGetProgressCriteriaQuery({ programmeCode: query?.studyRights?.programme })

  const handleClick = index => {
    const indexes = [...activeIndex].sort()
    if (indexes.includes(index)) {
      indexes.splice(
        indexes.findIndex(ind => ind === index),
        1
      )
    } else {
      indexes.push(index)
    }
    setActiveIndex(indexes)
    sendAnalytics(
      'Population statistics tab clicked',
      ['Credit accumulation', 'Credit statistics', 'Age distribution', 'Courses of population', 'Students'][index]
    )
    /**
     * Here used to be a :tunkki: that scrolled to the component that was opened. However,
     * it does not work with the way this view is now rendered. This is left here just as a
     * reminder in case we want to reimplement auto-scrolling once this component is refactored.
     */
  }

  const RenderCreditGainGraphs = () => {
    const { CreditAccumulation } = infotooltips.PopulationStatistics
    const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive)

    const graphs = (
      <CreditAccumulationGraphHighCharts
        students={filteredStudents}
        title="Id"
        trayOpen={() => {}}
        language={language}
        studyPlanFilterIsActive={studyPlanFilterIsActive}
        programmeCodes={programmeCodes}
      />
    )
    return (
      <>
        <InfoBox content={CreditAccumulation} />
        {filteredStudents.length > 0 && graphs}
      </>
    )
  }

  if (isLoading || !queryIsSet) {
    return null
  }

  const onlyIamRights = !authLoading && !isAdmin && !rights.includes(query?.studyRights?.programme)

  const panels = [
    {
      key: 0,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Credit accumulation (for {filteredStudents.length} students)
          </span>
        ),
      },
      onTitleClick: () => handleClick(0),
      content: {
        content: <div ref={creditGraphRef}>{RenderCreditGainGraphs()}</div>,
      },
    },
    {
      key: 1,
      title: {
        content: (
          <span
            style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}
            data-cy="credit-statistics"
          >
            Credit statistics
          </span>
        ),
      },
      onTitleClick: () => handleClick(1),
      content: {
        content: !query?.years ? (
          <div ref={creditGainRef}>
            <CreditGainStats
              query={query}
              filteredStudents={filteredStudents}
              creditDateFilterOptions={creditDateFilterOptions}
            />
          </div>
        ) : (
          <div>This table is omitted when searching population of multiple years</div>
        ),
      },
    },
    {
      key: 2,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Age distribution
          </span>
        ),
      },
      onTitleClick: () => handleClick(2),
      content: {
        content: <AgeStats filteredStudents={filteredStudents} query={query} />,
      },
    },
    {
      key: 3,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Courses of class
          </span>
        ),
      },
      onTitleClick: () => handleClick(3),
      content: {
        content: (
          <div ref={courseTableRef}>
            <PopulationCourses
              query={query}
              allStudents={allStudents}
              filteredStudents={filteredStudents}
              selectedStudentsByYear={selectedStudentsByYear}
              onlyIamRights={onlyIamRights}
            />
          </div>
        ),
      },
    },
    !onlyIamRights && {
      key: 4,
      title: {
        content: (
          <span style={{ paddingTop: '1vh', paddingBottom: '1vh', color: 'black', fontSize: 'large' }}>
            Students ({filteredStudents.length})
          </span>
        ),
      },
      onTitleClick: () => handleClick(4),
      content: {
        content: (
          <div ref={studentTableRef}>
            <PopulationStudents
              variant="population"
              language={language}
              filteredStudents={filteredStudents}
              dataExport={dataExport}
              criteria={criteria?.data}
              programmeCode={query?.studyRights?.programme}
              year={query?.year}
            />
          </div>
        ),
      },
    },
  ]

  return (
    <>
      <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
    </>
  )
}

export default connect(null)(PopulationDetails)
