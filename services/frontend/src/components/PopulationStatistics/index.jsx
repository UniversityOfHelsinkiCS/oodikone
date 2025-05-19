import { useMemo } from 'react'
import { useLocation } from 'react-router'
import { Header, Message, Segment } from 'semantic-ui-react'

import { getStudentTotalCredits } from '@/common'
import { FilterView } from '@/components/FilterView'
import {
  admissionTypeFilter,
  ageFilter,
  citizenshipFilter,
  courseFilter,
  creditDateFilter,
  creditsEarnedFilter,
  curriculumPeriodFilter,
  enrollmentStatusFilter,
  genderFilter,
  graduatedFromProgrammeFilter,
  hopsFilter,
  startYearAtUniFilter,
  studentNumberFilter,
  studyRightStatusFilter,
  studyRightTypeFilter,
  studyTrackFilter,
  tagsFilter,
  transferredToProgrammeFilter,
} from '@/components/FilterView/filters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PopulationDetails } from '@/components/PopulationDetails'
import { PopulationSearch } from '@/components/PopulationSearch'
import { useCurrentSemester } from '@/hooks/currentSemester'
import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useAppSelector } from '@/redux/hooks'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { makePopulationsToData } from '@/selectors/populationDetails'
import { getFullStudyProgrammeRights } from '@/util/access'
import { getCombinedProgrammeName } from '@/util/combinedProgramme'

const getYearText = year => {
  if (year === 'All') return ''
  return `${year} - ${Number(year) + 1}`
}

export const PopulationStatistics = () => {
  const location = useLocation()
  const { language, getTextIn } = useLanguage()
  const courses = useAppSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  const { query, queryIsSet, isLoading, selectedStudentsByYear, samples } = useAppSelector(makePopulationsToData)
  const currentSemester = useCurrentSemester()

  const { fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const onlyIamRights = !fullAccessToStudentData && fullStudyProgrammeRights.length === 0
  useTitle('Class statistics')

  const { data: allSemesters } = useGetSemestersQuery()
  const programmeCode = query?.studyRights?.programme
  const combinedProgrammeCode = query?.studyRights?.combinedProgramme ? query?.studyRights?.combinedProgramme : ''
  const { data: studyProgrammes } = useGetProgrammesQuery()
  const programmes = {
    ...studyProgrammes,
    'KH90_001+MH90_001': {
      code: 'KH90_001+MH90_001',
      name: {
        fi: 'Eläinlääketieteen kandiohjelma ja lisensiaatin koulutusohjelma',
        en: "Bachelor's and Degree Programme in Vetenary Medicine",
        sv: 'Kandidats- och Utbildningsprogrammet i veterinärmedicin',
      },
    },
  }
  const programmeName = programmes && programmeCode ? programmes[programmeCode]?.name : ''
  const combinedProgrammeName = programmes && combinedProgrammeCode ? programmes[combinedProgrammeCode]?.name : ''
  const showBachelorAndMaster = query?.showBachelorAndMaster === 'true' || combinedProgrammeCode !== ''

  const filters = [
    !onlyIamRights ? ageFilter : null,
    citizenshipFilter,
    courseFilter({ courses }),
    creditDateFilter,
    creditsEarnedFilter,
    curriculumPeriodFilter,
    enrollmentStatusFilter({
      allSemesters: allSemesters?.semesters ?? [],
      programme: programmeCode,
    }),
    genderFilter,
    graduatedFromProgrammeFilter({
      code: programmeCode,
      combinedProgrammeCode,
      showBachelorAndMaster,
    }),
    hopsFilter({ programmeCode, combinedProgrammeCode }),
    studentNumberFilter,
    startYearAtUniFilter,
    studyTrackFilter({ code: programmeCode }),
    studyRightStatusFilter({ code: programmeCode, combinedProgrammeCode, currentSemester, showBachelorAndMaster }),
    tagsFilter,
    transferredToProgrammeFilter,
  ].filter(Boolean)

  const degreeProgrammeType = useDegreeProgrammeTypes([programmeCode])

  if (programmeCode && degreeProgrammeType[programmeCode] === 'urn:code:degree-program-type:masters-degree') {
    filters.push(
      studyRightTypeFilter({
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
      ? getCombinedProgrammeName(getTextIn(programmeName), getTextIn(combinedProgrammeName), language)
      : getTextIn(programmeName)
  const title = location.search === '' ? 'Class statistics' : `${programmeText} ${getYearText(query?.year)}`

  const noStudentsMessage = () => (
    <div style={{ maxWidth: '80%' }}>
      <Message
        content={`
          Choose “Advanced settings” below and make sure you have the correct student groups included
          in the class. For example, if you are looking for students of a specialist training in
          medicine or dentistry, you must choose “Students with non-degree study right”.`}
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
        [studyTrackFilter.key]: {
          selected: query?.studyRights?.studyTrack ? [query?.studyRights?.studyTrack] : [],
        },
        [tagsFilter.key]: {
          includedTags: query?.tag ? [query.tag] : [],
          excludedTags: [],
        },
      }}
      name="PopulationStatistics"
      students={students}
    >
      {filteredStudents => (
        <div className="segmentContainer" style={{ flexGrow: 1 }}>
          <Header align="center" className="segmentTitle" size="large">
            {title} {query?.showBachelorAndMaster === 'true' && ' (Bachelor + Master view)'}
            {location.search !== '' && query?.studyRights?.studyTrack && (
              <Header.Subheader>studytrack {query.studyRights.studyTrack}</Header.Subheader>
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
            {location.search !== '' && (
              <PopulationDetails
                filteredStudents={filteredStudents}
                isLoading={isLoading}
                programmeCodes={programmeCodes}
                query={query}
                queryIsSet={queryIsSet}
                selectedStudentsByYear={selectedStudentsByYear}
              />
            )}
          </Segment>
        </div>
      )}
    </FilterView>
  )
}
