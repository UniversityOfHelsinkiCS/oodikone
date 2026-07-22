import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

import { difference, flatten, max, min, pickBy, uniq } from 'lodash-es'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { ProgrammeDropdown } from '@/components/CourseStatistics/ProgrammeDropdown'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import { LoadingSkeleton } from '@/components/Section/LoadingSkeleton'
import { useSemesters } from '@/hooks/useSemesters'
import type { CourseSearchState } from '@/pages/CourseStatistics'
import { countTotalStats } from '@/pages/CourseStatistics/CourseTab/SingleCourseStats/countTotalStats'
import { ResultTabs } from '@/pages/CourseStatistics/CourseTab/SingleCourseStats/ResultTabs'
import { YearFilter } from '@/pages/CourseStatistics/CourseTab/SingleCourseStats/YearFilter'
import { ALL, CourseStudyProgramme } from '@/pages/CourseStatistics/util'
import { useGetCourseStatsQuery } from '@/redux/courseStats'
import { useAppDispatch } from '@/redux/hooks'
import { useGetMaxYearsToCreatePopulationFromQuery } from '@/redux/populations'
import { setSelectedCourse, clearSelectedCourse } from '@/redux/selectedCourse'
import { DoNotDisturbIcon } from '@/theme'
import {
  Attempts,
  AvailableStats,
  CourseStat,
  Enrollment,
  FormattedStats,
  ProgrammeStats,
  Students,
} from '@/types/courseStat'
import { DropdownOption } from '@/types/dropdownOption'
import { parseQueryParams, queryParamsToString } from '@/util/queryparams'
import { Name } from '@oodikone/shared/types'
import { enrollmentTimeDateThresholdYearCode, yearToYearCode } from '@oodikone/shared/util'

const countFilteredStudents = (stat: Record<string, string[]>, filter: (studentNumber: string) => boolean) => {
  if (!stat) {
    return {} as Record<string, number>
  }
  return Object.entries(stat).reduce(
    (acc, entry) => {
      const [category, students] = entry
      return {
        ...acc,
        [category]: students.filter(filter).length,
      }
    },
    {} as Record<string, number>
  )
}

export const SingleCourseStats = ({
  coursecode,
  availableStats,
  userHasAccessToAllStats,

  loading,
  toggleOpenAndRegularCourses,
  openOrRegular,
  programmes,
  combineSubstitutions,
}: {
  coursecode: string
  availableStats: AvailableStats
  userHasAccessToAllStats: boolean

  loading: boolean
  toggleOpenAndRegularCourses: (state: CourseSearchState) => void
  openOrRegular: CourseSearchState
  programmes: CourseStudyProgramme[]
  combineSubstitutions: boolean
}) => {
  const [primary, setPrimary] = useState<string[]>([ALL.value])
  const [comparison, setComparison] = useState<string[]>([])

  // These are "incorrectly" reversed to allow them to be replaced with min/max when stats arrive
  const [minFromYearCode, setMinFromYearCode] = useState(yearToYearCode(new Date().getFullYear()))
  const [maxToYearCode, setMaxToYearCode] = useState(yearToYearCode(1950))

  const [fromYearCode, setFromYearCode] = useState(yearToYearCode(1950))
  const [toYearCode, setToYearCode] = useState(yearToYearCode(new Date().getFullYear()))
  const [separate, setSeparate] = useState<boolean>(false)

  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { getTextIn } = useLanguage()
  const { semesters, years: semesterYears } = useSemesters()
  const {
    data: courseStatistics = {},
    isFetching: isLoading,
    isSuccess,
  } = useGetCourseStatsQuery(
    {
      codes: [coursecode],
      separate,
      combineSubstitutions,
      fromYearCode: fromYearCode.toString(),
      toYearCode: toYearCode.toString(),
    },
    { skip: loading }
  )
  const uniqueCourseCodes = [
    ...new Set(
      [coursecode].concat(
        courseStatistics?.[coursecode]?.[openOrRegular]?.alternatives.flatMap(group =>
          group.flatMap(({ code }) => code)
        ) ?? []
      )
    ),
  ]
  const { data: maxYears } = useGetMaxYearsToCreatePopulationFromQuery(
    { courseCodes: JSON.stringify(uniqueCourseCodes) },
    { skip: isLoading || !isSuccess }
  )

  const semestersReversed = Object.values(semesters ?? [])
    .map(({ semestercode, name, yearcode }) => ({
      key: semestercode,
      texts: Object.values(name) as string[],
      value: yearcode,
    }))
    .reverse()

  const semesterYearsReversed = Object.values(semesterYears ?? [])
    .map(({ yearcode, yearname }) => ({
      key: yearcode,
      text: yearname,
      value: yearcode,
    }))
    .reverse()

  const parseQueryFromUrl = () => {
    const { separate } = parseQueryParams(location.search)
    return {
      separate: JSON.parse((separate ?? 'false') as string),
    }
  }

  // NOTE: Can be undefined if query is still querying
  const stats: CourseStat | undefined = courseStatistics[coursecode]?.[openOrRegular]

  let maxYearsToCreatePopulationFrom = 0
  if (maxYears) {
    switch (openOrRegular) {
      case 'openStats':
        maxYearsToCreatePopulationFrom = maxYears.openCourses
        break
      case 'regularStats':
        maxYearsToCreatePopulationFrom = maxYears.uniCourses
        break
      default:
        maxYearsToCreatePopulationFrom = maxYears.unifyCourses
    }
  }

  useEffect(() => {
    if (location.search) {
      const { separate } = parseQueryFromUrl()
      setSeparate([true, false].includes(separate) ? separate : false)
    }
    dispatch(setSelectedCourse(coursecode))

    const yearCodes = stats?.statistics.map(stat => stat.yearCode)
    const initFromYear = min(yearCodes) ?? yearToYearCode(1950)
    const initToYear = max(yearCodes) ?? yearToYearCode(new Date().getFullYear())
    setFromYearCode(initFromYear)
    setToYearCode(initToYear)

    if (yearCodes) {
      setMaxToYearCode(max([maxToYearCode, ...yearCodes]))
      setMinFromYearCode(min([minFromYearCode, ...yearCodes]))
    }

    return () => {
      dispatch(clearSelectedCourse())
    }
  }, [isSuccess])

  useEffect(() => {
    if (location.search) {
      const { separate } = parseQueryFromUrl()
      setSeparate([true, false].includes(separate) ? separate : false)
    }
  }, [location.search])

  useEffect(() => {
    if (primary.every(course => !programmes.map(programme => programme.key).includes(course))) {
      setPrimary([ALL.value])
    }
  }, [programmes])

  const getProgrammeName = (programmeCode: string) => {
    if (programmeCode === ALL.value) {
      return 'All'
    }
    if (programmeCode === 'EXCLUDED') {
      return 'Excluded'
    }
    const { name } = stats.programmes[programmeCode]
    return getTextIn(name)!
  }

  const setExcludedToComparison = () => setComparison(primary.includes(ALL.value) ? [] : ['EXCLUDED'])

  const getExcluded = () => {
    if (primary.includes(ALL.value)) {
      return []
    }
    return difference(
      programmes.map(programme => programme.value).filter(value => value !== ALL.value),
      primary
    )
  }

  const belongsToAtLeastOneProgramme = (codes: string[]) => {
    if (codes.includes(ALL.value)) {
      return () => true
    }

    const { programmes } = stats
    const studentNumbers = new Set()
    codes.forEach(code => {
      if (programmes[code]) {
        const students = Object.values(programmes[code].students).flat()
        students.forEach(student => studentNumbers.add(student))
      }
    })

    return (studentNumber: string) => studentNumbers.has(studentNumber)
  }

  const isValidProgrammeCode = (code: string) => {
    return stats.programmes[code] || code === ALL.value || code === 'EXCLUDED'
  }

  const filteredYearsAndSemesters = () => {
    const from = minFromYearCode
    const to = maxToYearCode

    if (from == null || to == null) {
      return {
        filteredYears: semesterYearsReversed,
        filteredSemesters: semestersReversed,
      }
    }
    const timeFilter = ({ value }: { value: number }) => value >= from && value <= to
    return {
      filteredYears: semesterYearsReversed.filter(timeFilter),
      filteredSemesters: semestersReversed.filter(timeFilter),
    }
  }

  const isStatInYearRange = ({ name }: { name: Name | string }) => {
    const timeFilter = ({ value }: { value: number }) => value >= fromYearCode && value <= toYearCode
    const filteredSemesters = semestersReversed.filter(timeFilter)
    const filteredYears = semesterYearsReversed.filter(timeFilter)
    if (separate) {
      return filteredSemesters.find(year => year.texts.includes(getTextIn(name as Name)!))
    }
    return filteredYears.find(year => year.text === name)
  }

  const countAttemptStats = (
    attempts: Attempts,
    totalEnrollments: number | undefined,
    filter: (studentNumber: string) => boolean
  ) => {
    const grades = countFilteredStudents(attempts.grades, filter)
    const categories = countFilteredStudents(attempts.categories, filter) as { failed: number; passed: number }
    const { failed, passed } = categories
    const total = totalEnrollments ?? passed + failed
    const passRate = Math.min(100 * (passed / total), 100)

    return {
      grades,
      categories,
      passRate,
    }
  }

  const countStudentStats = (
    allStudents: Students,
    enrolledNoGrade = 0,
    filter: (studentNumber: string) => boolean
  ) => {
    const grades = countFilteredStudents(allStudents.grades, filter)
    const totalGrades = Object.values(grades).reduce((total, studentsWithGrade) => total + studentsWithGrade, 0)
    const totalPassed = Object.keys(grades).reduce((total, grade) => (grade !== '0' ? total + grades[grade] : total), 0)
    const totalFailed = grades['0'] ?? 0
    const total = totalGrades + enrolledNoGrade
    const passRate = totalPassed / total
    const failRate = 1 - passRate

    return {
      total,
      totalPassed,
      totalFailed,
      passRate,
      failRate,
      grades,
    }
  }

  /** Count students that have only enrollments, no passed or failed grade

  NOTE:
  1. Adds students to allStudents.enrolled
  2. Assumes this is called year by year in a descending order
  */
  const countStudentEnrollmentStats = (
    filteredEnrollments: Enrollment[],
    allStudents: { passed: Set<string>; failed: Set<string>; enrolled: Set<string> },
    displayEnrollments: boolean
  ) => {
    if (!displayEnrollments) {
      return { enrolledStudentsWithNoGrade: undefined, totalEnrollments: undefined }
    }

    const enrolled = new Set<string>()
    filteredEnrollments.forEach(({ studentNumber }) => {
      const hasEnrolled = allStudents.enrolled.has(studentNumber)
      const hasFailed = allStudents.failed.has(studentNumber)
      const hasPassed = allStudents.passed.has(studentNumber)

      if (!hasFailed && !hasPassed && !hasEnrolled) {
        allStudents.enrolled.add(studentNumber)
        enrolled.add(studentNumber)
      }
    })

    return {
      enrolledStudentsWithNoGrade: enrolled.size,
      totalEnrollments: filteredEnrollments.length,
    }
  }

  const statsForProgrammes = (programmeCodes: string[], name: string) => {
    if (programmeCodes.length === 0 || !stats) {
      return undefined
    }
    const { statistics } = stats
    const filter = belongsToAtLeastOneProgramme(programmeCodes)

    const allStudents = statistics.filter(isStatInYearRange).reduce(
      (acc, stats) => {
        stats.attempts.categories.passed.forEach(studentNumber => acc.passed.add(studentNumber))
        stats.attempts.categories.failed.forEach(studentNumber => acc.failed.add(studentNumber))
        return acc
      },
      { passed: new Set<string>(), failed: new Set<string>(), enrolled: new Set<string>() }
    )

    const formattedStats: FormattedStats[] = statistics
      .filter(isStatInYearRange)
      .sort((a, b) => b.yearCode - a.yearCode) // Needs to be sorted DESC so that studentEnrollments are calculated correctly
      .map(
        ({
          code,
          name,
          students,
          attempts,
          coursecode,
          obfuscated,
          enrollments = [],
          allEnrollments = [],
          yearCode,
        }) => {
          const displayEnrollments = yearCode >= enrollmentTimeDateThresholdYearCode // Display enrollments only for Sisu era
          const filteredEnrollments = enrollments.filter(({ studentNumber }) => filter(studentNumber))
          const filteredAllEnrollments = allEnrollments.filter(({ studentNumber }) => filter(studentNumber))
          const totalEnrollments = displayEnrollments ? filteredAllEnrollments.length : undefined

          const studentsEnrollments = countStudentEnrollmentStats(filteredEnrollments, allStudents, displayEnrollments)
          const attemptStats = countAttemptStats(attempts, totalEnrollments, filter)
          const studentStats = countStudentStats(students, studentsEnrollments.enrolledStudentsWithNoGrade, filter)
          const parsedName = separate ? getTextIn(name as Name)! : name

          return {
            name: parsedName,
            students: { ...studentStats, ...studentsEnrollments },
            attempts: { ...attemptStats, totalEnrollments },
            enrollments: filteredEnrollments,
            code,
            coursecode,
            rowObfuscated: obfuscated,
          }
        }
      )

    const totals = countTotalStats(formattedStats)
    const programmeStats: ProgrammeStats = {
      codes: programmeCodes,
      name,
      stats: formattedStats.concat(totals),
      totals,
      userHasAccessToAllStats,
    }
    return programmeStats
  }

  const handleSelect = (newProgrammes: string[], name?: string) => {
    let selected = [...newProgrammes].filter(value => value !== ALL.value)
    if (name === 'primary') {
      setComparison(comparison.filter(programmeCode => programmeCode !== 'EXCLUDED'))
    }
    if (
      (!primary.includes(ALL.value) && newProgrammes.includes(ALL.value)) ||
      (name === 'primary' && newProgrammes.length === 0)
    ) {
      selected = [ALL.value]
    }
    if (name === 'primary') {
      setPrimary(selected)
    }
    if (name === 'comparison') {
      setComparison(selected)
    }
  }

  const handleToYearChange = event => {
    const newYear = event.target.value as number
    if (newYear >= fromYearCode) {
      setToYearCode(newYear)
      setMaxToYearCode(max([maxToYearCode, newYear]))
    }
  }

  const handleFromYearChange = event => {
    const newYear = event.target.value as number
    if (newYear <= toYearCode) {
      setFromYearCode(newYear)
      setMinFromYearCode(min([minFromYearCode, newYear]))
    }
  }

  const filteredProgrammeStatistics = () => {
    const excludedProgrammes = getExcluded()
    const primaryProgrammes = primary
    const comparisonProgrammes = comparison.filter(code => isValidProgrammeCode(code))

    if (comparison.includes('EXCLUDED')) {
      comparisonProgrammes.push(...excludedProgrammes)
    }

    const primaryStats = statsForProgrammes(
      primaryProgrammes,
      primaryProgrammes.length === 1 ? getProgrammeName(primaryProgrammes[0]) : 'Primary'
    )
    const comparisonStats = statsForProgrammes(
      comparisonProgrammes,
      comparisonProgrammes.length === 1 ? getProgrammeName(comparisonProgrammes[0]) : 'Comparison'
    )

    return {
      primary: primaryStats,
      comparison: comparisonStats,
    }
  }

  const comparisonProgrammes = (programmes: DropdownOption[]) => {
    const result = programmes.filter(({ key }) => key !== 'EXCLUDED')
    const excludedProgrammes = getExcluded()

    if (!primary.includes(ALL.value)) {
      const excludedStudents = result
        .filter(({ key }) => excludedProgrammes.includes(key) && key !== 'ALL')
        .reduce((res, { students }) => [...res, ...flatten(Object.values(students))], [] as string[])
      const uniqueExcludedStudents = uniq(excludedStudents)
      result.push({
        key: 'EXCLUDED',
        size: uniqueExcludedStudents.length,
        students: uniqueExcludedStudents,
        description: 'All students that are not in primary group selection',
        text: 'Excluded',
        value: 'EXCLUDED',
      })
    }
    return result.filter(
      ({ key }) => !primary.includes(key) && (!comparison.includes('EXCLUDED') || !excludedProgrammes.includes(key))
    )
  }

  const showPopulation = () => {
    const queryObject = {
      from: fromYearCode,
      to: toYearCode,
      coursecodes: JSON.stringify([coursecode]),
      separate,
      unifyCourses: openOrRegular,
      includeSubstitutions: combineSubstitutions,
    }
    const searchString = queryParamsToString(queryObject)
    void navigate(`/coursepopulation?${searchString}`)
  }

  const renderShowPopulation = (disabled = false) => {
    if (!userHasAccessToAllStats) {
      return null
    }
    return (
      <Button disabled={disabled} onClick={showPopulation} variant="contained">
        Show population
      </Button>
    )
  }

  const statistics = filteredProgrammeStatistics()
  const { filteredYears } = filteredYearsAndSemesters()

  const timeFilter = (_, value: string) => Number(value) >= fromYearCode && Number(value) <= toYearCode
  const filteredProgrammes = programmes
    .map(programme => {
      const students = new Set(flatten(Object.values(pickBy(programme.students, timeFilter))))
      return { ...programme, students: [...students], size: students.size }
    })
    .filter(programme => programme.size > 0)

  if (stats?.statistics.length < 1) {
    return <Section>No data for selected course</Section>
  }

  const options: DropdownOption[] = filteredProgrammes.map(programme => ({
    description: programme.description,
    key: programme.key,
    size: programme.size,
    students: programme.students,
    text: getTextIn(programme.text)!,
    value: programme.value,
  }))

  const maxYearText = `The maximum time range to generate a population for this course is ${Math.max(
    0,
    maxYearsToCreatePopulationFrom
  )} ${maxYearsToCreatePopulationFrom === 1 ? 'year' : 'years'}`

  return (
    <Stack gap={2}>
      <Section title="Statistics by time range">
        <Stack direction="row" gap={2}>
          <YearFilter
            fromYear={fromYearCode}
            handleFromYearChange={handleFromYearChange}
            handleToYearChange={handleToYearChange}
            toYear={toYearCode}
            years={filteredYears}
          />
          {maxYearsToCreatePopulationFrom < toYearCode - fromYearCode + 1 ? (
            <Tooltip arrow placement="right" title={maxYearText}>
              <span>{renderShowPopulation(true)}</span>
            </Tooltip>
          ) : (
            renderShowPopulation()
          )}
        </Stack>
      </Section>
      {userHasAccessToAllStats ? (
        <Section title="Filter statistics by degree programme">
          <Stack direction="row" gap={2}>
            <Box width="50%">
              <ProgrammeDropdown
                label="Primary group"
                name="primary"
                onChange={handleSelect}
                options={options}
                placeholder="Select degree programmes"
                value={primary}
              />
            </Box>
            <Box width="50%">
              <Stack gap={1}>
                <ProgrammeDropdown
                  label="Comparison group"
                  name="comparison"
                  onChange={handleSelect}
                  options={comparisonProgrammes(options)}
                  placeholder="Optional"
                  value={comparison}
                />
                <Button
                  disabled={primary.length === 1 && primary[0] === ALL.value}
                  onClick={setExcludedToComparison}
                  startIcon={<DoNotDisturbIcon />}
                  variant="outlined"
                >
                  Select excluded degree programmes
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Section>
      ) : null}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <ResultTabs
          availableStats={availableStats}
          combineSubstitutions={combineSubstitutions}
          comparison={statistics.comparison}
          courseCodes={[coursecode]}
          loading={loading}
          openOrRegular={openOrRegular}
          primary={statistics.primary}
          separate={separate}
          toggleOpenAndRegularCourses={toggleOpenAndRegularCourses}
        />
      )}
    </Stack>
  )
}
