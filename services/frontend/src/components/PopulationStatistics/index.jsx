import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocation, useHistory } from 'react-router-dom'
import { Header, Segment } from 'semantic-ui-react'
import { useGetSemestersQuery } from 'redux/semesters'
import populationToData from 'selectors/populationDetails'
import { getStudentTotalCredits, getUnifiedProgrammeName } from 'common'
import { useGetAuthorizedUserQuery } from 'redux/auth'
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
  const courses = useSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  const { query, queryIsSet, isLoading, selectedStudentsByYear, samples } = useSelector(
    populationToData.makePopulationsToData
  )
  const { isAdmin, rights } = useGetAuthorizedUserQuery()
  const onlyIamRights = !isAdmin && rights.length === 0
  useTitle('Class statistics')

  const { data: allSemesters } = useGetSemestersQuery()
  const programmeCode = query?.studyRights?.programme
  const combinedProgrammeCode = query?.studyRights?.combinedProgramme ? query?.studyRights?.combinedProgramme : ''
  const programmes = useSelector(store => store.populationProgrammes?.data?.programmes)
  const programmeName = programmes && programmeCode ? programmes[programmeCode]?.name : ''
  const combinedProgrammeName = programmes && combinedProgrammeCode ? programmes[combinedProgrammeCode]?.name : ''

  const filters = [
    studentNumberFilter,
    hopsFilter({ programmeCode, combinedProgrammeCode }),
    genderFilter,
    !onlyIamRights ? ageFilter : null,
    courseFilter({ courses }),
    creditsEarnedFilter,
    graduatedFromProgrammeFilter({ code: programmeCode, combinedProgrammeCode }),
    transferredToProgrammeFilter,
    startYearAtUniFilter,
    tagsFilter,
    creditDateFilter,
    enrollmentStatusFilter({
      allSemesters: allSemesters?.semesters ?? [],
      language,
    }),
    studyTrackFilter({ code: programmeCode }),
    studyrightStatusFilter({ code: programmeCode, combinedProgrammeCode }),
  ].filter(Boolean)

  // For combined programme admission type is the same as they started in bachelor programme
  if (parseInt(query?.year, 10) >= 2020) {
    filters.push(
      admissionTypeFilter({
        programme: programmeCode,
      })
    )
  }

  const programmeCodes = []
  if (programmeCode) programmeCodes.push(programmeCode)
  if (combinedProgrammeCode) programmeCodes.push(combinedProgrammeCode)

  const students = useMemo(() => {
    if (!samples) {
      return []
    }
    return samples.map(student => {
      const hopsCredits =
        student.studyplans?.find(plan => plan.programme_code === programmeCode)?.completed_credits ?? 0
      const hopsCombinedProgrammeCredits =
        student.studyplans?.find(plan => plan.programme_code === combinedProgrammeCode)?.completed_credits ?? 0
      const studyrightStartDate = new Date(student.studyrightStart)
      const courses = student.courses.filter(({ date }) => new Date(date) >= studyrightStartDate)
      const credits = getStudentTotalCredits({ courses })
      return {
        ...student,
        allCredits: student.credits,
        hopsCredits,
        hopsCombinedProgrammeCredits,
        credits,
      }
    })
  }, [samples, programmeCode, combinedProgrammeCode])

  const programmeText =
    query?.studyRights?.combinedProgramme !== '' && query?.studyRights?.combinedProgramme !== undefined
      ? getUnifiedProgrammeName(getTextIn(programmeName), getTextIn(combinedProgrammeName), language)
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
            <PopulationSearch history={history} location={location} combinedProgrammeCode={combinedProgrammeCode} />
            {location.search !== '' ? (
              <PopulationDetails
                queryIsSet={queryIsSet}
                query={query}
                isLoading={isLoading}
                programmeCodes={programmeCodes}
                dataExport={
                  <DataExport
                    students={filteredStudents}
                    programmeCode={query?.studyRights?.programme}
                    combinedProgrammeCode={combinedProgrammeCode}
                  />
                }
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
