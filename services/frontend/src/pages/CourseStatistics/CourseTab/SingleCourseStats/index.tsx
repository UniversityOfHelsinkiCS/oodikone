import { DoNotDisturb as DoNotDisturbIcon } from '@mui/icons-material'
import { Box, Button, Stack, Tooltip } from '@mui/material'
import { difference, flatten, max, min, pickBy, uniq } from 'lodash'
import qs from 'query-string'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ProgrammeDropdown } from '@/components/material/ProgrammeDropdown'
import { Section } from '@/components/material/Section'
import { RootState } from '@/redux'
import { useGetMaxYearsToCreatePopulationFromQuery } from '@/redux/populations'
import { setSelectedCourse, clearSelectedCourse } from '@/redux/selectedCourse'
import { useGetSemestersQuery } from '@/redux/semesters'
import { ALL, getAllStudyProgrammes } from '@/selectors/courseStats'
import { Name } from '@/shared/types'
import { Attempts, CourseStat, Enrollment, FormattedStats, ProgrammeStats, Students } from '@/types/courseStat'
import { DropdownOption } from '@/types/dropdownOption'
import { countTotalStats } from './countTotalStats'
import { ResultTabs } from './ResultTabs'
import { YearFilter } from './YearFilter'

const countFilteredStudents = (stat: Record<string, string[]>, filter: (studentNumber: string) => boolean) => {
  if (!stat) {
    return {} as { passed: number; failed: number }
  }
  return Object.entries(stat).reduce(
    (acc, entry) => {
      const [category, students] = entry
      return {
        ...acc,
        [category]: students.filter(filter).length,
      }
    },
    {} as { passed: number; failed: number }
  )
}

export const SingleCourseStats = ({
  availableStats,
  stats,
  userHasAccessToAllStats,
}: {
  availableStats: { unify: boolean; open: boolean; university: boolean }
  stats: CourseStat
  userHasAccessToAllStats: boolean
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const { getTextIn } = useLanguage()
  const [primary, setPrimary] = useState<string[]>([ALL.value])
  const [comparison, setComparison] = useState<string[]>([])
  const [fromYear, setFromYear] = useState(0)
  const [toYear, setToYear] = useState(0)
  const [separate, setSeparate] = useState<boolean | null>(null)
  const programmes = useSelector((state: RootState) => getAllStudyProgrammes(state))
  const unifyCourses = useSelector((state: RootState) => state.courseSearch.openOrRegular)
  const { coursecode } = stats

  const { data: semesterData } = useGetSemestersQuery()
  const { semesters, years } = useMemo(() => {
    const semesters = Object.values(semesterData?.semesters ?? [])
      .map(({ semestercode, name, yearcode }) => ({
        key: semestercode,
        texts: Object.values(name) as string[],
        value: yearcode,
      }))
      .reverse()

    const years = Object.values(semesterData?.years ?? [])
      .map(({ yearcode, yearname }) => ({
        key: yearcode,
        text: yearname,
        value: yearcode,
      }))
      .reverse()

    return { semesters, years }
  }, [semesterData])

  const parseQueryFromUrl = () => {
    const { separate } = qs.parse(location.search)
    return {
      separate: JSON.parse(separate as string),
    }
  }

  const { data: maxYears } = useGetMaxYearsToCreatePopulationFromQuery({
    courseCodes: JSON.stringify(stats.alternatives.map(course => course.code)),
  })

  let maxYearsToCreatePopulationFrom = 0
  if (maxYears) {
    switch (unifyCourses) {
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
      setSeparate(separate)
    }
    dispatch(setSelectedCourse(coursecode))

    const yearCodes = stats.statistics.map(stat => stat.yearCode)
    const initFromYear = min(yearCodes) ?? 0
    const initToYear = max(yearCodes) ?? 0
    setFromYear(initFromYear)
    setToYear(initToYear)

    return () => {
      dispatch(clearSelectedCourse())
    }
  }, [])

  useEffect(() => {
    if (location.search) {
      const { separate } = parseQueryFromUrl()
      setSeparate(separate)
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
    const { programmes } = stats
    return programmes[code] || code === ALL.value || code === 'EXCLUDED'
  }

  const filteredYearsAndSemesters = () => {
    const yearCodes = stats.statistics.map(stat => stat.yearCode)
    const from = min(yearCodes)
    const to = max(yearCodes)
    if (from == null || to == null) {
      return {
        filteredYears: years,
        filteredSemesters: semesters,
      }
    }
    const timeFilter = ({ value }) => value >= from && value <= to
    return {
      filteredYears: years.filter(timeFilter),
      filteredSemesters: semesters.filter(timeFilter),
    }
  }

  const isStatInYearRange = ({ name }: { name: Name | string }) => {
    const timeFilter = ({ value }: { value: number }) => value >= fromYear && value <= toYear
    const filteredSemesters = semesters.filter(timeFilter)
    const filteredYears = years.filter(timeFilter)
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
    const categories = countFilteredStudents(attempts.categories, filter)
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
    const totalFailed = grades['0'] + enrolledNoGrade
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

  const countStudentEnrollmentStats = (
    allAttempts: Attempts,
    filteredEnrollments: Enrollment[],
    displayEnrollments: boolean
  ) => {
    const enrolledStudentsWithNoGrade = filteredEnrollments.filter(({ studentNumber }) => {
      const hasFailed = allAttempts.categories.failed ? allAttempts.categories.failed.includes(studentNumber) : false
      const hasPassed = allAttempts.categories.passed ? allAttempts.categories.passed.includes(studentNumber) : false
      return !hasFailed && !hasPassed
    })
    if (!displayEnrollments) {
      return { enrolledStudentsWithNoGrade: undefined, totalEnrollments: undefined }
    }
    return {
      enrolledStudentsWithNoGrade: enrolledStudentsWithNoGrade.length,
      totalEnrollments: filteredEnrollments.length,
    }
  }

  const statsForProgrammes = (programmeCodes: string[], name: string) => {
    if (programmeCodes.length === 0) {
      return undefined
    }
    const { statistics } = stats
    const filter = belongsToAtLeastOneProgramme(programmeCodes)
    const formattedStats: FormattedStats[] = statistics
      .filter(isStatInYearRange)
      .map(
        ({
          code,
          name,
          students: allStudents,
          attempts: allAttempts,
          coursecode,
          obfuscated,
          enrollments = [],
          allEnrollments = [],
          yearCode,
        }) => {
          const displayEnrollments = yearCode >= 72 // Display enrollments only for Sisu era
          const filteredEnrollments = enrollments.filter(({ studentNumber }) => filter(studentNumber))
          const filteredAllEnrollments = allEnrollments.filter(({ studentNumber }) => filter(studentNumber))
          const totalEnrollments = displayEnrollments ? filteredAllEnrollments.length : undefined

          const studentsEnrollments = countStudentEnrollmentStats(allAttempts, filteredEnrollments, displayEnrollments)
          const attempts = countAttemptStats(allAttempts, totalEnrollments, filter)
          const students = countStudentStats(allStudents, studentsEnrollments.enrolledStudentsWithNoGrade, filter)
          const parsedName = separate ? getTextIn(name as Name)! : name

          return {
            name: parsedName,
            students: { ...students, ...studentsEnrollments },
            attempts: { ...attempts, totalEnrollments },
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
    if (newYear >= fromYear) {
      setToYear(newYear)
    }
  }

  const handleFromYearChange = event => {
    const newYear = event.target.value as number
    if (newYear <= toYear) {
      setFromYear(newYear)
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
    const from = fromYear
    const to = toYear
    const years2 = `${years.find(year => year.value === from)?.text.split('-')[0]}-${
      years.find(year => year.value === to)?.text.split('-')[1]
    }`
    const queryObject = {
      from,
      to,
      coursecodes: JSON.stringify(stats.alternatives.map(course => course.code)),
      years2,
      separate: false,
      unifyCourses,
    }
    const searchString = qs.stringify(queryObject)
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

  const timeFilter = (_, value: string) => Number(value) >= fromYear && Number(value) <= toYear
  const filteredProgrammes = programmes
    .map(programme => {
      const students = new Set(flatten(Object.values(pickBy(programme.students, timeFilter))))
      return { ...programme, students: [...students], size: students.size }
    })
    .filter(programme => programme.size > 0)

  if (stats.statistics.length < 1) {
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
            fromYear={fromYear}
            handleFromYearChange={handleFromYearChange}
            handleToYearChange={handleToYearChange}
            toYear={toYear}
            years={filteredYears}
          />
          {maxYearsToCreatePopulationFrom < toYear - fromYear + 1 ? (
            <Tooltip arrow placement="right" title={maxYearText}>
              <span>{renderShowPopulation(true)}</span>
            </Tooltip>
          ) : (
            renderShowPopulation()
          )}
        </Stack>
      </Section>
      {userHasAccessToAllStats && (
        <Section title="Filter statistics by study programme">
          <Stack direction="row" gap={2}>
            <Box width="50%">
              <ProgrammeDropdown
                label="Primary group"
                name="primary"
                onChange={handleSelect}
                options={options}
                placeholder="Select study programmes"
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
                  Select excluded study programmes
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Section>
      )}
      <ResultTabs
        availableStats={availableStats}
        comparison={statistics.comparison}
        primary={statistics.primary}
        separate={separate}
      />
    </Stack>
  )
}
