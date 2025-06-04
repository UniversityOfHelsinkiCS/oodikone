import qs from 'query-string'
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
import { useGetProgrammesQuery, useGetPopulationStatisticsQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { getFullStudyProgrammeRights } from '@/util/access'
import { getCombinedProgrammeName } from '@/util/combinedProgramme'

const getYearText = year => {
  if (year === 'All') return ''
  return `${year} - ${Number(year) + 1}`
}

import { getMonths } from '../PopulationSearch/common'
const parseQueryFromUrl = () => {
  const initial = {
    year: '2017',
    semesters: ['FALL', 'SPRING'],
    studentStatuses: [],
    studyRights: {},
    months: getMonths('2017', 'FALL'),
    showBachelorAndMaster: false,
  }

  const { studyRights, months, ...rest } = qs.parse(location.search)

  if (studyRights === null || Array.isArray(studyRights)) throw Error()
  if (months === null || Array.isArray(months)) throw Error()

  const query = {
    ...initial,
    ...rest,
    studyRights: JSON.parse(studyRights),
    months: JSON.parse(months),
  }
  return query
}

export const PopulationStatistics = () => {
  const location = useLocation()
  const { language, getTextIn } = useLanguage()
  const courses = useAppSelector(store => store.populationSelectedStudentCourses.data?.coursestatistics)
  //
  const query: {
    months?: any
    year?: any
    years?: any[]
    studyRights?: {
      studyTrack?: any
      programme: any
      combinedProgramme: any
    }
    showBachelorAndMaster?: any
    tag?: any
  } = location.search ? parseQueryFromUrl() : {}

  const { data, isFetching: isLoading } = useGetPopulationStatisticsQuery(query, { skip: !Object.keys(query).length })
  const samples = data?.students ?? []
  const currentSemester = useCurrentSemester()

  const { fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const hasRestrictedAccess = !fullAccessToStudentData && fullStudyProgrammeRights.length === 0
  useTitle('Class statistics')

  const { data: allSemesters } = useGetSemestersQuery()
  const programmeCode = query.studyRights?.programme
  const combinedProgrammeCode = query.studyRights?.combinedProgramme ? query.studyRights?.combinedProgramme : ''
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
  const programmeName = programmes[programmeCode]?.name ?? ''
  const combinedProgrammeName = programmes[combinedProgrammeCode]?.name ?? ''
  const showBachelorAndMaster = query.showBachelorAndMaster === 'true' || combinedProgrammeCode !== ''

  const degreeProgrammeType = useDegreeProgrammeTypes([programmeCode])

  const programmeCodes = [programmeCode, combinedProgrammeCode].filter(Boolean)

  const selectedStudentsByYear = useMemo(() => {
    const selectedStudentsByYear = Object.fromEntries(
      samples.map(student => new Date(student.studyrightStart).getFullYear()).map(y => [y, [] as string[]])
    )
    samples.forEach(student => {
      selectedStudentsByYear[new Date(student.studyrightStart).getFullYear()].push(student.studentNumber)
    })

    return selectedStudentsByYear
  }, [samples])

  const students = useMemo(
    () =>
      samples.map(student => {
        const hopsCredits =
          student.studyplans?.find(plan => plan.programme_code === programmeCode)?.completed_credits ?? 0
        const hopsCombinedProgrammeCredits =
          student.studyplans?.find(plan => plan.programme_code === combinedProgrammeCode)?.completed_credits ?? 0
        const studyrightStartDate = new Date(student.studyrightStart)
        const courses = student.courses.filter(({ date }) => studyrightStartDate <= new Date(date))
        const credits = getStudentTotalCredits({ courses })
        return {
          ...student,
          allCredits: student.credits,
          hopsCredits,
          hopsCombinedProgrammeCredits,
          credits,
        }
      }),
    [samples, programmeCode, combinedProgrammeCode]
  )

  const programmeText =
    query.studyRights?.combinedProgramme !== '' && query.studyRights?.combinedProgramme !== undefined
      ? getCombinedProgrammeName(getTextIn(programmeName)!, getTextIn(combinedProgrammeName)!, language)
      : getTextIn(programmeName)
  const title = !location.search ? 'Class statistics' : `${programmeText} ${getYearText(query.year)}`

  const filters = [
    !hasRestrictedAccess ? ageFilter : null,
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

    degreeProgrammeType[programmeCode] === 'urn:code:degree-program-type:masters-degree'
      ? studyRightTypeFilter({
          programme: programmeCode,
          year: query.year,
        })
      : null,

    // For combined programme admission type is the same as they started in bachelor programme
    parseInt(query.year, 10) >= 2020
      ? admissionTypeFilter({
          programme: programmeCode,
        })
      : null,
  ].filter(item => !!item)

  const initialOptions = {
    [transferredToProgrammeFilter.key]: {
      transferred: false,
    },
    [hopsFilter.key]: {
      studyStart: (students[0] || {})?.studyrightStart,
    },
    [studyTrackFilter.key]: {
      selected: query.studyRights?.studyTrack ? [query.studyRights?.studyTrack] : [],
    },
    [tagsFilter.key]: {
      includedTags: query.tag ? [query.tag] : [],
      excludedTags: [],
    },
  }

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
      displayTray={!!location.search}
      filters={filters}
      initialOptions={initialOptions}
      name="PopulationStatistics"
      students={students}
    >
      {filteredStudents => (
        <div className="segmentContainer" style={{ flexGrow: 1 }}>
          <Header align="center" className="segmentTitle" size="large">
            {title} {query.showBachelorAndMaster === 'true' && '(Bachelor + Master view)'}
            {!!location.search && query.studyRights?.studyTrack && (
              <Header.Subheader>studytrack {query.studyRights.studyTrack}</Header.Subheader>
            )}
            {!!location.search && (
              <Header.Subheader>
                studytime {query.months} months, class size {students.length} students
              </Header.Subheader>
            )}
          </Header>
          {!!location.search && students?.length === 0 && !isLoading && noStudentsMessage()}
          <Segment className="contentSegment">
            <PopulationSearch combinedProgrammeCode={combinedProgrammeCode} query={query} />
            {!!location.search && (
              <PopulationDetails
                filteredStudents={filteredStudents}
                isLoading={isLoading}
                programmeCodes={programmeCodes}
                query={query}
                selectedStudentsByYear={selectedStudentsByYear}
              />
            )}
          </Segment>
        </div>
      )}
    </FilterView>
  )
}
