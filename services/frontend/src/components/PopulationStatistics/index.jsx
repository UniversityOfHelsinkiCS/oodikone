import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { Header, Message, Segment } from 'semantic-ui-react'

import {
  getFullStudyProgrammeRights,
  getStudentTotalCredits,
  getUnifiedProgrammeName,
  isMastersProgramme,
} from '@/common'
import { useTitle } from '@/common/hooks'
import { FilterView } from '@/components/FilterView'
import {
  admissionTypeFilter,
  ageFilter,
  citizenshipFilter,
  courseFilter,
  creditDateFilter,
  creditsEarnedFilter,
  enrollmentStatusFilter,
  genderFilter,
  graduatedFromProgrammeFilter,
  hopsFilter,
  startYearAtUniFilter,
  studentNumberFilter,
  studyrightStatusFilter,
  studyrightTypeFilter,
  studyTrackFilter,
  tagsFilter,
  transferredToProgrammeFilter,
} from '@/components/FilterView/filters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PopulationDetails } from '@/components/PopulationDetails'
import { ConnectedPopulationSearch as PopulationSearch } from '@/components/PopulationSearch'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetSemestersQuery } from '@/redux/semesters'
import { makePopulationsToData } from '@/selectors/populationDetails'
import { DataExport } from './DataExport'

const getYearText = year => {
  if (year === 'All') return ''
  return `${year} - ${Number(year) + 1}`
}

export const PopulationStatistics = () => {
  const location = useLocation()
  const { language, getTextIn } = useLanguage()
  const courses = useSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  const { query, queryIsSet, isLoading, selectedStudentsByYear, samples } = useSelector(makePopulationsToData)

  const { isAdmin, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const onlyIamRights = !isAdmin && fullStudyProgrammeRights.length === 0
  useTitle('Class statistics')

  const { data: allSemesters } = useGetSemestersQuery()
  const programmeCode = query?.studyRights?.programme
  const combinedProgrammeCode = query?.studyRights?.combinedProgramme ? query?.studyRights?.combinedProgramme : ''
  const programmes = useSelector(store => store.populationProgrammes?.data?.programmes)
  const programmeName = programmes && programmeCode ? programmes[programmeCode]?.name : ''
  const combinedProgrammeName = programmes && combinedProgrammeCode ? programmes[combinedProgrammeCode]?.name : ''

  const filters = [
    !onlyIamRights ? ageFilter : null,
    citizenshipFilter,
    courseFilter({ courses }),
    creditDateFilter,
    creditsEarnedFilter,
    enrollmentStatusFilter({
      allSemesters: allSemesters?.semesters ?? [],
      language,
    }),
    genderFilter,
    graduatedFromProgrammeFilter({ code: programmeCode, combinedProgrammeCode }),
    hopsFilter({ programmeCode, combinedProgrammeCode }),
    studentNumberFilter,
    startYearAtUniFilter,
    studyTrackFilter({ code: programmeCode }),
    studyrightStatusFilter({ code: programmeCode, combinedProgrammeCode }),
    tagsFilter,
    transferredToProgrammeFilter,
  ].filter(Boolean)

  if (programmeCode && isMastersProgramme(programmeCode)) {
    filters.push(
      studyrightTypeFilter({
        programme: programmeCode,
        year: query?.year,
      })
    )
  }

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

  const noStudentsMessage = () => (
    <div style={{ maxWidth: '80%' }}>
      <Message
        content="Choose “Advanced settings” below and make sure you have the correct student groups included in the class. For example, if you are looking for students of a specialist training in medicine or dentistry, you must choose “Students with non-degree study right”."
        header="Not seeing any students?"
        icon="question"
        info
        size="large"
      />
    </div>
  )

  return (
    <FilterView
      displayTray={location.search !== ''}
      filters={filters}
      initialOptions={{
        [transferredToProgrammeFilter.key]: {
          transferred: false,
        },
        [hopsFilter.key]: {
          studyStart: (students[0] || {}).studyrightStart,
        },
      }}
      name="PopulationStatistics"
      students={students}
    >
      {filteredStudents => (
        <div className="segmentContainer" style={{ flexGrow: 1 }}>
          <Header align="center" className="segmentTitle" size="large">
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
          {students?.length === 0 && location.search !== '' && !isLoading && noStudentsMessage()}
          <Segment className="contentSegment">
            <PopulationSearch combinedProgrammeCode={combinedProgrammeCode} />
            {location.search !== '' ? (
              <PopulationDetails
                allStudents={samples}
                dataExport={
                  <DataExport
                    combinedProgrammeCode={combinedProgrammeCode}
                    programmeCode={query?.studyRights?.programme}
                    students={filteredStudents}
                  />
                }
                filteredStudents={filteredStudents}
                isLoading={isLoading}
                programmeCodes={programmeCodes}
                query={query}
                queryIsSet={queryIsSet}
                selectedStudentsByYear={selectedStudentsByYear}
              />
            ) : null}
          </Segment>
        </div>
      )}
    </FilterView>
  )
}
