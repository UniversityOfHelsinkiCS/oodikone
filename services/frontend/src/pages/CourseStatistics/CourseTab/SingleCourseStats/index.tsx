import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'

import { difference, flatten, max, min, pickBy, uniq } from 'lodash-es'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

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
import { useGetMaxYearsToCreatePopulationFromQuery } from '@/redux/populations'
import { DoNotDisturbIcon } from '@/theme'
import { AvailableStats, FormattedStats, ProgrammeStats } from '@/types/courseStat'
import { DropdownOption } from '@/types/dropdownOption'
import { useParseQueryParams, queryParamsToString } from '@/util/queryparams'
import { Name } from '@oodikone/shared/types'
import { enrollmentTimeDateThresholdYearCode, yearToYearCode } from '@oodikone/shared/util'
import { Attempts, CourseStat, Enrollment, Students } from '@oodikone/shared/types/courseYearlyStats'

const countFilteredStudents = (
  stat: Record<string, string[]>,
  filter: (studentNumber: string) => boolean
): Record<string, number> => {
  if (!stat) return {}

  const result = {}
  for (const [category, students] of Object.entries(stat)) {
    result[category] = students.filter(filter).length
  }
  return result
}

export const SingleCourseStats = ({
  courseGroupId,
  availableStats,
  userHasAccessToAllStats,

  stats,
  loading,
  toggleOpenAndRegularCourses,
  openOrRegular,
  programmes,
  substitutions,
  toYearCode,
  fromYearCode,
  setToYearCode,
  setFromYearCode,
}: {
  courseGroupId: string
  availableStats: AvailableStats
  userHasAccessToAllStats: boolean

  stats: Record<string, CourseStat>
  loading: boolean
  toggleOpenAndRegularCourses: (state: CourseSearchState) => void
  openOrRegular: CourseSearchState
  programmes: CourseStudyProgramme[]
  substitutions: boolean
  toYearCode: number
  fromYearCode: number
  setToYearCode: any
  setFromYearCode: any
}) => {
  'use memo'
  const [primary, setPrimary] = useState<string[]>([ALL.value])
  const [comparison, setComparison] = useState<string[]>([])

  const navigate = useNavigate()
  const { getTextIn } = useLanguage()
  const { semesters, years: semesterYears } = useSemesters()

  const params = useParseQueryParams()
  const separate = params.separate?.[0] === 'true'

  const courseStats = stats[courseGroupId]

  const minYearCode = min(courseStats.statistics.map(r => r.yearCode))!
  const maxYearCode = max(courseStats.statistics.map(r => r.yearCode))!

  const [minFromYearCode, setMinFromYearCode] = useState(minYearCode)
  const [maxToYearCode, setMaxToYearCode] = useState(maxYearCode)

  // Initialize filters with proper yearcodes
  useEffect(() => {
    setFromYearCode(minYearCode)
    setToYearCode(maxYearCode)
  }, [])

  const uniqueCourseCodes = [
    ...new Set(
      [courseGroupId].concat(
        courseStats?.substitutionGroups.flatMap(group => group.flatMap(({ groupId }) => groupId)) ?? []
      )
    ),
  ]

  const { data: maxYears } = useGetMaxYearsToCreatePopulationFromQuery({
    courseCodes: JSON.stringify(uniqueCourseCodes),
  })

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
    const name = courseStats?.programmes[programmeCode]['name']
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

    const programmes = courseStats?.programmes
    const studentNumbers = new Set()
    codes.forEach(code => {
      if (programmes?.[code]) {
        const students = Object.values(programmes[code].students).flat()
        students.forEach(student => studentNumbers.add(student))
      }
    })

    return (studentNumber: string) => studentNumbers.has(studentNumber)
  }

  const isValidProgrammeCode = (code: string) => {
    return courseStats?.programmes[code] || code === ALL.value || code === 'EXCLUDED'
  }

  const getFilteredYears = () => {
    const from = minFromYearCode
    const to = maxToYearCode

    if (!from || !to) {
      return semesterYearsReversed
    }
    const timeFilter = ({ value }: { value: number }) => value >= from && value <= to
    return semesterYearsReversed.filter(timeFilter)
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
    if (programmeCodes.length === 0 || !courseStats) {
      return undefined
    }
    const { statistics } = courseStats
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
            name: getTextIn(parsedName) ?? '',
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
      courses: courseGroupId,
      separate,
      unifyCourses: openOrRegular,
      substitutions: substitutions,
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
  const filteredYears = getFilteredYears()

  const timeFilter = (_, value: string) => Number(value) >= fromYearCode && Number(value) <= toYearCode
  const filteredProgrammes = programmes
    .map(programme => {
      const students = new Set(flatten(Object.values(pickBy(programme.students, timeFilter))))
      return { ...programme, students: [...students], size: students.size }
    })
    .filter(programme => programme.size > 0)

  if (!courseStats?.statistics.length) {
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
    <Stack spacing={2}>
      <Section title="Statistics by time range">
        <Stack direction="row" spacing={2}>
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
          <Stack direction="row" spacing={2}>
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
              <Stack spacing={1}>
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
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <ResultTabs
          availableStats={availableStats}
          combineSubstitutions={substitutions}
          comparison={statistics.comparison}
          courseCodes={[courseGroupId]}
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
