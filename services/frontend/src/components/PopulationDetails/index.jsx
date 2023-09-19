import React, { useRef, useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { Accordion, Dropdown, Radio } from 'semantic-ui-react'
import _ from 'lodash'
import useFilters from 'components/FilterView/useFilters'
import studyPlanFilter from 'components/FilterView/filters/hops'
import { creditDateFilter } from 'components/FilterView/filters'
import { useGetProgressCriteriaQuery } from 'redux/programmeProgressCriteria'
import { curriculumsApi } from 'redux/populationCourses'
import { chooseCurriculumToFetch } from 'common'
import { useLocalStorage } from '../../common/hooks'
import { useGetAuthorizedUserQuery } from '../../redux/auth'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import PopulationStudents from '../PopulationStudents'
import PopulationCourses from '../PopulationCourses'
import InfoBox from '../Info/InfoBox'
import CreditGainStats from './CreditGainStats'
import AgeStats from './AgeStats'
import infotooltips from '../../common/InfoToolTips'

const { useGetCurriculumsQuery, useGetCurriculumOptionsQuery } = curriculumsApi

const CurriculumPicker = ({ setCurriculum, programmeCodes, disabled, year }) => {
  const curriculumOptionsQuery = useGetCurriculumOptionsQuery({ code: programmeCodes[0] }, { skip: !programmeCodes[0] })
  const curriculums = curriculumOptionsQuery.data ?? []
  const [selectedCurriculum, setSelectedCurriculum] = useState(curriculums.length ? curriculums[0] : null)
  const chosenCurriculum = chooseCurriculumToFetch(curriculums, selectedCurriculum, year)
  const curriculumsQuery = useGetCurriculumsQuery(
    {
      code: programmeCodes[0],
      period_ids: chosenCurriculum?.curriculum_period_ids,
    },
    { skip: !chosenCurriculum?.curriculum_period_ids }
  )
  useEffect(() => {
    setCurriculum(curriculumsQuery.data ?? null)
  }, [curriculumsQuery.data])
  const formatCurriculumOptions = cur => {
    const years = _.sortBy(cur.curriculum_period_ids)
    if (years.length === 0) return 'error'
    if (years.length === 1) return years[0]
    return `${years[0]} - ${years[years.length - 1]}`
  }

  return (
    <Dropdown
      disabled={disabled}
      style={{
        padding: '4px',
        paddingLeft: '8px',
        marginLeft: '10px',
        background: '#e3e3e3',
      }}
      className="link item"
      value={chosenCurriculum}
      onChange={(_, { value }) => setSelectedCurriculum(value)}
      options={curriculums.map(cur => ({
        key: _.sortBy(cur.curriculum_period_ids).join(', '),
        value: cur,
        text: formatCurriculumOptions(cur),
      }))}
    />
  )
}

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
  const [activeIndex, setActiveIndex] = useLocalStorage('populationActiveIndex', [])
  const { isLoading: authLoading, rights, isAdmin } = useGetAuthorizedUserQuery()
  const creditGraphRef = useRef()
  const creditGainRef = useRef()
  const courseTableRef = useRef()
  const studentTableRef = useRef()
  const { useFilterSelector } = useFilters()
  const [curriculum, setCurriculum] = useState(null)
  const creditDateFilterOptions = useFilterSelector(creditDateFilter.selectors.selectOptions)
  const criteria = useGetProgressCriteriaQuery({ programmeCode: query?.studyRights?.programme })
  const [courseTableMode, setCourseTableMode] = useState('curriculum')
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
  }

  const RenderCreditGainGraphs = () => {
    const { CreditAccumulation } = infotooltips.PopulationStatistics
    const studyPlanFilterIsActive = useFilterSelector(studyPlanFilter.selectors.isActive)

    const graphs = (
      <CreditAccumulationGraphHighCharts
        students={filteredStudents}
        title="Id"
        trayOpen={() => {}}
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

  const onlyIamRights =
    !authLoading &&
    !isAdmin &&
    !rights.includes(query?.studyRights?.programme) &&
    !rights.includes(query?.studyRights?.combinedProgramme)

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
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Radio
                  style={{ marginBottom: '15px', marginTop: '5px', marginRight: '4px', fontWeight: 'bold' }}
                  label="Choose curriculum"
                  name="coursesRadioGroup"
                  value="curriculum"
                  onChange={(event, { value }) => setCourseTableMode(value)}
                  checked={courseTableMode === 'curriculum'}
                />
                <Radio
                  style={{ fontWeight: 'bold' }}
                  label="Show all courses"
                  name="coursesRadioGroup"
                  value="all"
                  onChange={(event, { value }) => setCourseTableMode(value)}
                  checked={courseTableMode === 'all'}
                />
              </div>
              <div>
                <CurriculumPicker
                  year={query?.year}
                  programmeCodes={programmeCodes}
                  setCurriculum={setCurriculum}
                  disabled={courseTableMode !== 'curriculum'}
                />
              </div>
            </div>
            <PopulationCourses
              query={query}
              curriculum={curriculum}
              allStudents={allStudents}
              filteredStudents={filteredStudents}
              selectedStudentsByYear={selectedStudentsByYear}
              onlyIamRights={onlyIamRights}
              courseTableMode={courseTableMode}
            />
          </div>
        ),
      },
    },
  ]

  if (!onlyIamRights) {
    panels.push({
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
              filteredStudents={filteredStudents}
              dataExport={dataExport}
              criteria={criteria?.data}
              programmeCode={query?.studyRights?.programme}
              year={query?.year}
              curriculum={curriculum}
            />
          </div>
        ),
      },
    })
  }
  return (
    <>
      <Accordion activeIndex={activeIndex} exclusive={false} styled fluid panels={panels} />
    </>
  )
}

export default connect(null)(PopulationDetails)
