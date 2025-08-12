import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { PageTitle } from '@/components/material/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { RootState } from '@/redux'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { CourseSearchState } from '@/redux/courseSearch'
import { useGetCourseStatsQuery } from '@/redux/courseStats'
import { useAppSelector } from '@/redux/hooks'
import { CourseStat, Realisation } from '@/types/courseStat'
import { checkUserAccess, getFullStudyProgrammeRights, hasAccessToAllCourseStats } from '@/util/access'
import { parseQueryParams } from '@/util/queryparams'
import { Name } from '@oodikone/shared/types'
import { CourseTab } from './CourseTab'
import { FacultyStatisticsTab } from './FacultyStatisticsTab'
import { NewQueryButton } from './NewQueryButton'
import { SearchForm } from './SearchForm'
import { SummaryTab } from './SummaryTab'

export const ALL = {
  key: 'ALL',
  value: 'ALL',
  text: {
    fi: 'All',
    en: 'All',
    sv: 'All',
  },
  description: 'All students combined',
} as const

export type CourseStats = Record<string, { openStats: CourseStat; regularStats: CourseStat; unifyStats: CourseStat }>
export type CourseStudyProgramme = {
  key: string
  value: string
  description: string
  text: Name
  students: Record<string, string[]>
}
export type CourseStatisticsSummary = {
  coursecode: string
  name: Name
  summary: { passed: number; failed: number; passRate: string | null }
  realisations: { passed: number; failed: number; passRate: string | null; obfuscated: boolean | undefined }[]
}[]

const getCourseStats = (courseStats: CourseStats, openOrRegular: CourseSearchState): Record<string, CourseStat> =>
  Object.fromEntries(Object.entries(courseStats).map(([courseCode, value]) => [courseCode, value[openOrRegular]]))

const getCourseAlternatives = (
  courseStats: CourseStats,
  openOrRegular: CourseSearchState,
  selectedCourse: string | undefined
) => courseStats[selectedCourse!]?.[openOrRegular].alternatives ?? []

const getAvailableStats = (
  courseStats: CourseStats
): Record<string, { unify: boolean; open: boolean; university: boolean }> =>
  Object.fromEntries(
    Object.entries(courseStats).map(([courseCode, value]) => [
      courseCode,
      {
        unify: !!value.unifyStats.statistics.length,
        open: !!value.openStats.statistics.length,
        university: !!value.regularStats.statistics.length,
      },
    ])
  )

const mergeStudents = (students1: Record<string, string[]>, students2: Record<string, string[]>) => {
  Object.keys(students2).forEach(yearCode => {
    if (students1[yearCode]) {
      students1[yearCode] = [...students1[yearCode], ...students2[yearCode]]
    } else {
      students1[yearCode] = students2[yearCode]
    }
  })
  return students1
}

const getAllStudyProgrammes = (
  courseStats: Record<string, CourseStat>,
  selectedCourseCode: string | undefined
): CourseStudyProgramme[] => {
  const studentsFilterSet = new Set(
    selectedCourseCode
      ? courseStats[selectedCourseCode]?.statistics?.flatMap(({ students }) => students.studentNumbers)
      : Object.values(courseStats).flatMap(programme =>
          programme.statistics.flatMap(({ students }) => students.studentNumbers)
        )
  )

  const all: Record<string, CourseStudyProgramme> = {}
  Object.values(courseStats).forEach(({ programmes }) => {
    Object.entries(programmes).forEach(([code, { name, students }]) => {
      const filteredStudents = Object.entries(students).reduce<Record<string, string[]>>(
        (acc, [k, v]) => ({ ...acc, [k]: v.filter(student => studentsFilterSet.has(student)) }),
        {}
      )

      if (all[code]) all[code].students = mergeStudents(all[code].students, filteredStudents)
      else
        all[code] = {
          key: code,
          value: code,
          description: code === 'OTHER' ? 'Students with no associated programme' : '',
          text: name,
          students: filteredStudents,
        }
    })
  })

  const programmes = Object.values(all)
  const allStudents = programmes.reduce<Record<string, string[]>>((acc, curr) => mergeStudents(acc, curr.students), {})
  return [{ ...ALL, students: allStudents }, ...programmes]
}

const calculatePassRate = (passed: number, failed: number) => {
  const passRate = (100 * passed) / (passed + failed)
  return passRate ? passRate.toFixed(2) : null
}

const getRealisationStats = (
  realisation: Realisation,
  filterStudentFn: (studentNumber: string) => boolean,
  userHasAccessToAllStats: boolean
) => {
  const { name, attempts, obfuscated } = realisation
  const { passed, failed } = attempts.categories
  const passedAmount = userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
  const failedAmount = userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length
  return {
    passed: passedAmount,
    failed: failedAmount,
    realisation: name,
    passRate: calculatePassRate(passedAmount, failedAmount),
    obfuscated,
  }
}

const getSummaryStats = (
  statistics: Realisation[],
  filterStudentFn: (studentNumber: string) => boolean,
  userHasAccessToAllStats: boolean
) => {
  const summary = statistics.reduce<{ passed: number; failed: number; passRate: string | null }>(
    (acc, cur) => {
      const { passed, failed } = cur.attempts.categories
      acc.passed += userHasAccessToAllStats ? passed.filter(filterStudentFn).length : passed.length
      acc.failed += userHasAccessToAllStats ? failed.filter(filterStudentFn).length : failed.length
      return acc
    },
    { passed: 0, failed: 0, passRate: null }
  )

  summary.passRate = calculatePassRate(summary.passed, summary.failed)

  return summary
}

const summaryStatistics = (
  courseStats: Record<string, CourseStat>,
  programmes: CourseStudyProgramme[],
  programmeCodes: string[],
  userHasAccessToAllStats: boolean
) => {
  const filteredProgrammes = programmes.filter(programme => programmeCodes.includes(programme.key))
  const students = new Set(filteredProgrammes.flatMap(programme => Object.values(programme.students).flat()))

  const filterStudentFn = (studentNumber: string) => students.has(studentNumber)

  return Object.entries(courseStats).map(([coursecode, { statistics, name }]) => {
    // No filters based on programmes can be applied, if the
    // programme and student number data has been obfuscated
    const realisations = statistics.map(realisation =>
      getRealisationStats(realisation, filterStudentFn, userHasAccessToAllStats)
    )
    const summary = getSummaryStats(statistics, filterStudentFn, userHasAccessToAllStats)

    return {
      coursecode,
      name,
      summary,
      realisations,
    }
  })
}

export const CourseStatistics = () => {
  const { programmeRights, roles } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = hasAccessToAllCourseStats(roles, fullStudyProgrammeRights)

  const location = useLocation()
  const { tab: _, courseCodes, ...params } = parseQueryParams(location.search)
  const skipQuery = !courseCodes

  const { data: courseStatsData = {}, isFetching: loading } = useGetCourseStatsQuery(
    {
      ...params,
      codes: JSON.parse(courseCodes ?? '[]'),
    },
    {
      skip: skipQuery,
    }
  )

  const courses = Object.keys(courseStatsData)
  const statsIsEmpty = courses.length === 0
  const singleCourseStats = courses.length === 1
  const initialCourseCode = courses.at(0)

  const openOrRegular = useAppSelector((state: RootState) => state.courseSearch.openOrRegular)

  const [courseSummaryFormProgrammes, setCourseSummaryFormProgrammes] = useState<string[]>([ALL.value])
  const [tab, setTab] = useTabs(/* max tabs */ 3)

  const [selected, setSelected] = useState(initialCourseCode)
  useTitle(selected ? `${selected} - Course statistics` : 'Course statistics')

  useEffect(() => {
    setSelected(initialCourseCode)
    if (statsIsEmpty) setTab(0)
  }, [initialCourseCode])

  const switchToCourse = (courseCode: string) => {
    setSelected(courseCode)
    setTab(0)
  }

  if (!checkUserAccess(['courseStatistics', 'admin', 'fullSisuAccess'], roles) && !fullStudyProgrammeRights.length) {
    return <AccessDeniedMessage />
  }

  if (skipQuery)
    return (
      <Container maxWidth="lg">
        <PageTitle title="Course statistics" />
        <SearchForm />
      </Container>
    )

  const stats = getCourseStats(courseStatsData, openOrRegular)
  const availableStats = getAvailableStats(courseStatsData)
  const alternatives = getCourseAlternatives(courseStatsData, openOrRegular, selected)
  const programmes = getAllStudyProgrammes(stats, selected)
  const statistics = summaryStatistics(stats, programmes, courseSummaryFormProgrammes, userHasAccessToAllStats)

  return (
    <Container maxWidth="lg">
      <Backdrop
        open={loading}
        sx={theme => ({ color: theme.palette.grey[300], zIndex: theme => theme.zIndex.drawer + 1 })}
      >
        <CircularProgress color="inherit" size="3em" />
      </Backdrop>
      <PageTitle title="Course statistics" />
      <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <Tabs onChange={(_event, newTab) => setTab(newTab)} sx={{ flexGrow: 1 }} value={tab}>
          <Tab data-cy="CourseTab" label="Course" />
          <Tab data-cy="SummaryTab" disabled={singleCourseStats} label="Summary" />
          <Tab data-cy="FacultyStatisticsTab" disabled={!userHasAccessToAllStats} label="Faculty statistics" />
        </Tabs>
        <NewQueryButton />
      </Box>
      {tab === 0 && (
        <CourseTab
          alternatives={alternatives}
          availableStats={availableStats}
          loading={loading}
          openOrRegular={openOrRegular}
          programmes={programmes}
          selected={selected}
          setSelected={setSelected}
          stats={stats}
          userHasAccessToAllStats={userHasAccessToAllStats}
        />
      )}
      {tab === 1 && !singleCourseStats && (
        <SummaryTab
          courseSummaryFormProgrammes={courseSummaryFormProgrammes}
          onClickCourse={switchToCourse}
          programmes={programmes}
          setCourseSummaryFormProgrammes={setCourseSummaryFormProgrammes}
          statistics={statistics}
        />
      )}
      {tab === 2 && userHasAccessToAllStats ? (
        <FacultyStatisticsTab courseStats={courseStatsData} openOrRegular={openOrRegular} />
      ) : null}
    </Container>
  )
}
