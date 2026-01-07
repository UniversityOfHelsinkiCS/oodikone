import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import Alert, { type AlertProps } from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import type { ReactNode } from 'react'
import { useLocation, type Location } from 'react-router'

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
import { useFilters } from '@/components/FilterView/useFilters'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PopulationDetails } from '@/components/PopulationDetails'
import { PopulationSearch } from '@/components/PopulationSearch'
import { useDegreeProgrammeTypes } from '@/hooks/degreeProgrammeTypes'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery, useGetPopulationStatisticsQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { DegreeProgramme } from '@/types/api/faculty'
import type { PopulationQuery } from '@/types/populationSearch'
import { getFullStudyProgrammeRights } from '@/util/access'
import { getCombinedProgrammeName } from '@/util/combinedProgramme'

import { parseQueryParams } from '@/util/queryparams'
import { DegreeProgrammeType } from '@oodikone/shared/types'
import { formatToArray } from '@oodikone/shared/util'

import { PageTitle } from '../common/PageTitle'
import { PageLoading } from '../Loading'

const getYearText = (years: number[]) => (years.length >= 1 ? `${years[0]} - ${years.at(-1)! + 1}` : '')

const parseQueryFromUrl = (location: Location): [boolean, PopulationQuery] => {
  const skipQuery = !location.search
  const { years, semesters, programme, studentStatuses, combinedProgramme, studyTrack, showBachelorAndMaster, tag } =
    parseQueryParams(location.search)

  const dirtyQuery = {
    years: formatToArray(years).map(year => parseInt(year, 10)),
    semesters: semesters ? formatToArray(semesters) : ['FALL', 'SPRING'],
    programme,
    studentStatuses: studentStatuses ? formatToArray(studentStatuses) : [],
    combinedProgramme,
    studyTrack,
    showBachelorAndMaster: showBachelorAndMaster === 'true',
    tag,
  }

  // Drop undefined fields from obj
  const query = Object.fromEntries(Object.entries(dirtyQuery).filter(([_, arg]) => arg !== undefined))
  return [skipQuery, query as PopulationQuery]
}

const useUserHasRestrictedAccess = () => {
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
      degreeProgrammeType: DegreeProgrammeType.BACHELOR,
      progId: '',
      name: {
        fi: 'Eläinlääketieteen kandiohjelma ja lisensiaatin koulutusohjelma',
        en: "Bachelor's and Degree Programme in Vetenary Medicine",
        sv: 'Kandidats- och Utbildningsprogrammet i veterinärmedicin',
      },
    },
  }
}

const useGetProgrammeText = (programmeCode: string, combinedProgrammeCode?: string): string => {
  const { language, getTextIn } = useLanguage()

  const programmes = useGetProgrammes()
  const programmeName = getTextIn(programmes[programmeCode]?.name) ?? ''

  if (combinedProgrammeCode) {
    const combinedProgrammeName = getTextIn(programmes[combinedProgrammeCode]?.name) ?? ''
    return getCombinedProgrammeName(programmeName, combinedProgrammeName, language)
  }

  return programmeName
}

const HelpInfoCard = ({
  title,
  body,
  severity = 'info',
}: {
  title: string
  body: ReactNode
  severity?: AlertProps['severity']
}) => (
  <Box sx={{ maxWidth: '80%', mx: 'auto', my: 1 }}>
    <Alert
      icon={severity === 'info' ? <HelpOutlineIcon sx={{ fontSize: '2.5em', alignSelf: 'center', mx: 1.5 }} /> : false}
      severity={severity}
      sx={{ fontSize: '1.2em', p: 2 }}
    >
      <AlertTitle>
        <Typography component="span" variant="h6">
          {title}
        </Typography>
      </AlertTitle>
      {body}
    </Alert>
  </Box>
)

const StudyTrackNames = () => {
  const { useFilterSelector } = useFilters()
  const { getTextIn } = useLanguage()

  const selectedStudyTracks = useFilterSelector(studyTrackFilter.selectors.selectedStudyTracks())
  const studyTrackString = selectedStudyTracks.map(elem => `${elem.code} - ${getTextIn(elem.name)}`)

  if (selectedStudyTracks.length === 0) return null

  return (
    <Typography color="text.secondary" fontWeight="standard" variant="h6">
      Studytrack {studyTrackString.join(' | ')}
    </Typography>
  )
}

export const PopulationStatistics = () => {
  useTitle('Class statistics')
  const location = useLocation()

  const [skipQuery, query] = parseQueryFromUrl(location)
  const isSingleYear = query.years.length === 1

  const {
    data: population,
    isFetching: isLoading,
    isSuccess,
    isError,
    refetch,
  } = useGetPopulationStatisticsQuery(query, {
    skip: skipQuery,
  })

  const dataIsReady = isSuccess && !isLoading

  const { programme: programmeCode, combinedProgramme: combinedProgrammeCode, studyTrack } = query

  const students = population?.students ?? []
  const courses = population?.coursestatistics.courses ?? []

  const populationTags = new Map<string, string>(
    students.flatMap(({ tags }) => tags.map(({ tag_id, tag }) => [tag_id, tag.tagname]))
  )

  const showBachelorAndMaster = !!combinedProgrammeCode || !!query.showBachelorAndMaster
  const programmeText = useGetProgrammeText(programmeCode, combinedProgrammeCode)

  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters, currentSemester } = semesters ?? { semesters: {}, currentSemester: null }

  const enableStudyRightTypeFilter =
    useDegreeProgrammeTypes([programmeCode])?.[programmeCode] === 'urn:code:degree-program-type:masters-degree'

  const filters = [
    !useUserHasRestrictedAccess() ? ageFilter() : null,
    citizenshipFilter(),
    courseFilter({ courses }),
    creditDateFilter(),
    creditsEarnedFilter(),
    curriculumPeriodFilter(),
    enrollmentStatusFilter({
      allSemesters: allSemesters ?? [],
      programme: programmeCode,
    }),
    genderFilter(),
    graduatedFromProgrammeFilter({
      code: programmeCode,
      combinedProgrammeCode,
      showBachelorAndMaster,
    }),
    hopsFilter({ programmeCode, combinedProgrammeCode }),
    studentNumberFilter(),
    startYearAtUniFilter(),
    studyTrackFilter({ code: programmeCode }),
    studyRightStatusFilter({ code: programmeCode, combinedProgrammeCode, currentSemester, showBachelorAndMaster }),
    tagsFilter(),
    transferredToProgrammeFilter(),
    enableStudyRightTypeFilter ? studyRightTypeFilter({ programme: programmeCode }) : null,

    // For combined programme admission type is the same as for those starting in bachelor programme
    isSingleYear ? (query.years[0] >= 2020 ? admissionTypeFilter({ programme: programmeCode }) : null) : null,
  ].filter(item => !!item)

  const initialOptions = {
    [transferredToProgrammeFilter.key]: {
      transferred: 'false',
    },
    [hopsFilter.key]: {
      studyStart: students.some(student => !!student?.studyrightStart),
    },
    [studyTrackFilter.key]: {
      selected: studyTrack ? [studyTrack] : [],
    },
    [tagsFilter.key]: {
      includedTags: query.tag ? [query.tag] : [],
      excludedTags: [],
    },
  }

  const errorCardTitle = 'Error occured while fetching data!'
  const errorCardBody = (
    <Box sx={{ display: 'flex', flexDirection: 'column', pt: 1, gap: 1 }}>
      <Typography>
        If the error persists contact <Link href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</Link>.
      </Typography>
      <Box sx={{ width: 'fit-content', mx: 'auto' }}>
        <Button color="error" onClick={() => void refetch()} variant="contained">
          Retry
        </Button>
      </Box>
    </Box>
  )

  const helpCardTitle = 'Not seeing any students?'
  const helpCardBody = `
        Choose “View advanced settings” below and make sure you have the correct student groups included
        in the class. For example, if you are looking for students of a specialist training in
        medicine or dentistry, you must choose “Students with non-degree study right”.`

  const title = `${programmeText} ${getYearText(query.years)}${showBachelorAndMaster ? ' (Bachelor & Master view)' : ''} ${programmeCode}`

  // Show search form if URL contains no query
  if (skipQuery) return <PopulationSearch />

  // else display population from query
  return (
    <FilterView
      coursestatistics={population?.coursestatistics}
      displayTray={!isLoading}
      filters={filters}
      initialOptions={initialOptions}
      name="PopulationStatistics"
      students={students}
    >
      {(filteredStudents, filteredCourses) => (
        <>
          <PageLoading isLoading={isLoading} />
          <PageTitle title={title}>
            <StudyTrackNames />
            <Typography color="text.secondary" fontWeight="standard" variant="h6">
              Class size {students.length} students
            </Typography>
          </PageTitle>
          {isError ? <HelpInfoCard body={errorCardBody} severity="error" title={errorCardTitle} /> : null}
          {dataIsReady && !students.length ? <HelpInfoCard body={helpCardBody} title={helpCardTitle} /> : null}
          {isSuccess ? (
            <PopulationDetails
              filteredCourses={filteredCourses}
              filteredStudents={filteredStudents}
              isLoading={isLoading}
              populationTags={populationTags}
              query={query}
            />
          ) : null}
        </>
      )}
    </FilterView>
  )
}
