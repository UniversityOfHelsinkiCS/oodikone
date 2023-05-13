import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useHistory } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import { useGetSemestersQuery } from 'redux/semesters'
import populationToData from 'selectors/populationDetails'
import { getStudentTotalCredits } from 'common'
import PopulationDetails from '../PopulationDetails'
import { useTitle } from '../../common/hooks'
import useLanguage from '../LanguagePicker/useLanguage'
import FilterView from '../FilterView'
import PopulationSearch from '../PopulationSearch'
import DataExport from './DataExport'
import {
  ageFilter,
  courseFilter,
  creditsEarnedFilter,
  genderFilter,
  graduatedFromProgrammeFilter,
  transferredToProgrammeFilter,
  startYearAtUniFilter,
  admissionTypeFilter,
  tagsFilter,
  creditDateFilter,
  enrollmentStatusFilter,
  studyTrackFilter,
  studyrightStatusFilter,
  studentNumberFilter,
  hopsFilter,
} from '../FilterView/filters'

const getYearText = year => {
  if (year === 'All') return ''
  return `${year} - ${Number(year) + 1}`
}
const PopulationStatistics = () => {
  const location = useLocation()
  const { language, getTextIn } = useLanguage()
  const history = useHistory()
  // const { query, queryIsSet, isLoading, students } = useSelector(selectPopulations)
  const courses = useSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  const { query, queryIsSet, isLoading, selectedStudentsByYear, samples } = useSelector(
    populationToData.makePopulationsToData
  )
  // Option to set other Study programme in cases of combined view (e.g., eläinlääkkis)
  const [filterByBachelor, setFilterByBachelor] = useState(true)
  useTitle('Class statistics')

  const { data: allSemesters } = useGetSemestersQuery()
  const programmeCode = query?.studyRights?.programme
  const combinedProgrammeCode = query?.studyRights?.combinedProgramme
  const programmes = useSelector(store => store.populationProgrammes?.data?.programmes)
  const programmeName = programmes && programmeCode ? programmes[programmeCode]?.name : ''
  const combinedProgrammeName = programmes && combinedProgrammeCode ? programmes[combinedProgrammeCode]?.name : ''
  const chosenProgrammeCode = filterByBachelor || !combinedProgrammeCode ? programmeCode : combinedProgrammeCode
  const filters = [
    studentNumberFilter,
    hopsFilter({ programmeCode: chosenProgrammeCode }),
    genderFilter,
    ageFilter,
    courseFilter({ courses }),
    creditsEarnedFilter,
    graduatedFromProgrammeFilter({ code: chosenProgrammeCode }),
    transferredToProgrammeFilter,
    startYearAtUniFilter,
    tagsFilter,
    creditDateFilter,
    enrollmentStatusFilter({
      allSemesters: allSemesters?.semesters ?? [],
      language,
    }),
    studyTrackFilter({ code: chosenProgrammeCode }),
    studyrightStatusFilter({ code: chosenProgrammeCode }),
  ]

  if (parseInt(query?.year, 10) >= 2020) {
    filters.push(
      admissionTypeFilter({
        programme: chosenProgrammeCode,
      })
    )
  }

  const students = useMemo(() => {
    if (!samples) {
      return []
    }
    return samples.map(student => {
      const hopsCredits =
        student.studyplans?.find(plan => plan.programme_code === chosenProgrammeCode)?.completed_credits ?? 0
      const studyrightStartDate = new Date(student.studyrightStart)
      const courses = student.courses.filter(({ date }) => new Date(date) >= studyrightStartDate)
      const credits = getStudentTotalCredits({ courses })
      return {
        ...student,
        allCredits: student.credits,
        hopsCredits,
        credits,
      }
    })
  }, [samples, chosenProgrammeCode])

  const unifyProgrammeName = (bachelor, masterLisenciate) => {
    if (language === 'fi')
      return `${bachelor} ja ${
        masterLisenciate?.includes('lisensiaatin') ? 'lisensiaatin koulutusojelma' : 'maisterin koulutusohjelma'
      }`
    if (language === 'en') return `${bachelor?.split(' ')[0]} and ${masterLisenciate}`
    if (language === 'sv') return `${bachelor?.split('programmet')[0]}- och ${masterLisenciate}`
    return bachelor
  }

  const programmeText =
    query?.studyRights?.combinedProgramme !== undefined
      ? unifyProgrammeName(getTextIn(programmeName), getTextIn(combinedProgrammeName))
      : getTextIn(programmeName)
  const title = location.search === '' ? 'Class statistics' : `${programmeText} ${getYearText(query?.year)}`

  return (
    <FilterView
      name="PopulationStatistics"
      filters={filters}
      students={students}
      displayTray={location.search !== ''}
      initialOptions={{
        [transferredToProgrammeFilter.key]: {
          transferred: false,
        },
        [hopsFilter.key]: {
          studyStart: (students[0] || {}).studyrightStart,
        },
      }}
    >
      {filteredStudents => (
        <div className="segmentContainer" style={{ flexGrow: 1 }}>
          <Header className="segmentTitle" size="large" align="center">
            {title}
            {location.search !== '' && query?.studyRights?.studyTrack && query?.studyRights?.studyTrack !== '' && (
              <Header.Subheader> studytrack {query?.studyRights?.studyTrack}</Header.Subheader>
            )}
            {location.search !== '' && (
              <Header.Subheader>
                studytime {query?.months} months, class size {students.length} students
              </Header.Subheader>
            )}
          </Header>

          <Segment className="contentSegment">
            <PopulationSearch
              history={history}
              location={location}
              unifiedProgramme={{ programmeCode, combinedProgrammeCode, filterByBachelor, setFilterByBachelor }}
            />
            {location.search !== '' ? (
              <PopulationDetails
                queryIsSet={queryIsSet}
                query={query}
                isLoading={isLoading}
                dataExport={<DataExport students={filteredStudents} programmeCode={query?.studyRights?.programme} />}
                allStudents={samples}
                selectedStudentsByYear={selectedStudentsByYear}
                filteredStudents={filteredStudents}
              />
            ) : null}
          </Segment>
        </div>
      )}
    </FilterView>
  )
}

export default PopulationStatistics
