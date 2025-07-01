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
import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery, useGetPopulationStatisticsQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { DegreeProgramme } from '@/types/api/faculty'
import { getFullStudyProgrammeRights } from '@/util/access'
import { getCombinedProgrammeName } from '@/util/combinedProgramme'

import { parseQueryParams } from '@/util/queryparams'
import { getMonths } from '../PopulationSearch/common'

type Query = {
  months: string
  year: string
  years?: string[]
  semesters: string[]
  studentStatuses: string[]
  studyRights: {
    programme: string
    combinedProgramme: string
    studyTrack?: string
  }
  showBachelorAndMaster?: string
  tag?: any
}

const getYearText = (year: string) => {
  const yearIsNumber = !isNaN(+year)
  return yearIsNumber ? `${year} - ${+year + 1}` : ''
}

const parseQueryFromUrl = (location): [boolean, Query] => {
  const skipQuery = !location.search

  const { studyRights, ...rest } = parseQueryParams(location.search)

  if (studyRights === null || Array.isArray(studyRights)) throw Error()

  const query: Query = {
    months: getMonths('2017', 'FALL').toString(),
    year: '2017',
    semesters: ['FALL', 'SPRING'],
    studentStatuses: [],
    studyRights: studyRights ? JSON.parse(studyRights) : { programme: '', combinedProgramme: '' },
    showBachelorAndMaster: 'false',

    ...rest,
  }

  return [skipQuery, query]
}

const mapStudentDataToStudents = (programmeCode: string, combinedProgrammeCode: string, samples: any[] = []) =>
  samples.map(student => {
    const hopsCredits = student.studyplans?.find(plan => plan.programme_code === programmeCode)?.completed_credits ?? 0
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
  })

const useUserHasRestrictedAccess = (): boolean => {
  const { fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)

  return !fullAccessToStudentData && !fullStudyProgrammeRights.length
}

const useGetProgrammes = (): Record<string, DegreeProgramme> => {
  const { data: studyProgrammes } = useGetProgrammesQuery()

  return {
    ...studyProgrammes,
    'KH90_001+MH90_001': {
      code: 'KH90_001+MH90_001',
      curriculumPeriodIds: [],
      degreeProgrammeType: '',
      progId: '',
      name: {
        fi: 'Eläinlääketieteen kandiohjelma ja lisensiaatin koulutusohjelma',
        en: "Bachelor's and Degree Programme in Vetenary Medicine",
        sv: 'Kandidats- och Utbildningsprogrammet i veterinärmedicin',
      },
    },
  }
}

const useGetProgrammeText = (programmeCode: string, combinedProgrammeCode: string): string => {
  const { language, getTextIn } = useLanguage()

  const programmes = useGetProgrammes()
  const programmeName = getTextIn(programmes[programmeCode]?.name) ?? ''
  const combinedProgrammeName = getTextIn(programmes[combinedProgrammeCode]?.name) ?? ''

  return combinedProgrammeCode
    ? getCombinedProgrammeName(programmeName, combinedProgrammeName, language)
    : programmeName
}

export const PopulationStatistics = () => {
  useTitle('Class statistics')
  const [skipQuery, query] = parseQueryFromUrl(useLocation())

  const {
    data: population,
    isFetching: isLoading,
    isSuccess,
  } = useGetPopulationStatisticsQuery(query, {
    skip: skipQuery,
  })

  const { programme: programmeCode, combinedProgramme: combinedProgrammeCode, studyTrack } = query.studyRights

  const students = useMemo(
    () => mapStudentDataToStudents(programmeCode, combinedProgrammeCode, population?.students ?? []),
    [programmeCode, combinedProgrammeCode, population?.students]
  )

  const populationTags = useMemo(
    () =>
      new Map(population?.students.flatMap(({ tags }) => tags.map(({ tag_id, tag }) => [tag_id, tag.tagname])) ?? []),
    [population?.students]
  )

  const showBachelorAndMaster = !!combinedProgrammeCode || query?.showBachelorAndMaster === 'true'
  const programmeText = useGetProgrammeText(programmeCode, combinedProgrammeCode)

  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters, currentSemester } = semesters ?? { semesters: {}, currentSemester: null }

  const filters = [
    !useUserHasRestrictedAccess() ? ageFilter : null,
    citizenshipFilter,
    courseFilter({ courses: population?.coursestatistics }),
    creditDateFilter,
    creditsEarnedFilter,
    curriculumPeriodFilter,
    enrollmentStatusFilter({
      allSemesters: allSemesters ?? [],
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

    useDegreeProgrammeTypes([programmeCode])?.[programmeCode] === 'urn:code:degree-program-type:masters-degree'
      ? studyRightTypeFilter({ programme: programmeCode, year: query.year })
      : null,

    // For combined programme admission type is the same as they started in bachelor programme
    parseInt(query.year, 10) >= 2020 ? admissionTypeFilter({ programme: programmeCode }) : null,
  ].filter(item => !!item)

  const initialOptions = {
    [transferredToProgrammeFilter.key]: {
      transferred: false,
    },
    [hopsFilter.key]: {
      studyStart: (students[0] ?? {})?.studyrightStart,
    },
    [studyTrackFilter.key]: {
      selected: studyTrack ? [studyTrack] : [],
    },
    [tagsFilter.key]: {
      includedTags: query.tag ? [query.tag] : [],
      excludedTags: [],
    },
  }

  const showNoStudentsMessage = !students.length && !isLoading
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

  const title = skipQuery ? 'Class statistics' : `${programmeText} ${getYearText(query.year)}`

  return (
    <FilterView
      courses={population?.coursestatistics ?? []}
      displayTray={!skipQuery && isSuccess}
      filters={filters}
      initialOptions={initialOptions}
      name="PopulationStatistics"
      students={students}
    >
      {(filteredStudents, filteredCourses) => (
        <div className="segmentContainer" style={{ flexGrow: 1 }}>
          <Header align="center" className="segmentTitle" size="large">
            {title} {!skipQuery && showBachelorAndMaster && '(Bachelor + Master view)'}
            {!skipQuery && !!studyTrack && <Header.Subheader>studytrack {studyTrack}</Header.Subheader>}
            {!skipQuery && (
              <Header.Subheader>
                studytime {query.months} months, class size {students.length} students
              </Header.Subheader>
            )}
          </Header>
          {!skipQuery && showNoStudentsMessage && noStudentsMessage()}
          <Segment className="contentSegment" loading={isLoading}>
            <PopulationSearch
              combinedProgrammeCode={combinedProgrammeCode}
              isLoading={isLoading}
              populationTags={populationTags}
              query={query}
              skipQuery={skipQuery}
            />
            {!skipQuery && isSuccess && (
              <PopulationDetails
                filteredCourses={filteredCourses}
                filteredStudents={filteredStudents}
                isLoading={isLoading}
                programmeCodes={[programmeCode, combinedProgrammeCode]}
                query={query}
              />
            )}
          </Segment>
        </div>
      )}
    </FilterView>
  )
}
