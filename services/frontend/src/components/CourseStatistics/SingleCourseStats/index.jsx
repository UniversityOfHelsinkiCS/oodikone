import { difference, flatten, max, min, pickBy, uniq } from 'lodash'
import qs from 'query-string'
import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useLocation } from 'react-router-dom'
import { Button, Form, Grid, Header, Popup, Segment } from 'semantic-ui-react'

import { ProgrammeDropdown } from '@/components/CourseStatistics/ProgrammeDropdown'
import { ResultTabs } from '@/components/CourseStatistics/ResultTabs'
import { YearFilter } from '@/components/CourseStatistics/SearchForm/YearFilter'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetMaxYearsToCreatePopulationFromQuery } from '@/redux/populations'
import { useGetSemestersQuery } from '@/redux/semesters'
import { setSelectedCourse, clearSelectedCourse } from '@/redux/singleCourseStats'
import { ALL, getAllStudyProgrammes } from '@/selectors/courseStats'
import { countTotalStats } from './countTotalStats'

const countFilteredStudents = (stat, filter) => {
  if (!stat) {
    return {}
  }
  return Object.entries(stat).reduce((acc, entry) => {
    const [category, students] = entry
    return {
      ...acc,
      [category]: students.filter(filter).length,
    }
  }, {})
}

export const SingleCourseStats = ({ stats, availableStats, userHasAccessToAllStats }) => {
  const history = useHistory()
  const location = useLocation()
  const dispatch = useDispatch()
  const { getTextIn } = useLanguage()
  const [primary, setPrimary] = useState([ALL.value])
  const [comparison, setComparison] = useState([])
  const [fromYear, setFromYear] = useState(0)
  const [toYear, setToYear] = useState(0)
  const [separate, setSeparate] = useState(null)
  const programmes = useSelector(state => getAllStudyProgrammes(state))
  const unifyCourses = useSelector(state => state.courseSearch.openOrRegular)
  const { coursecode } = stats

  const { data: semesterData } = useGetSemestersQuery()
  const { semesters, years } = useMemo(() => {
    const semesters = Object.values(semesterData?.semesters ?? [])
      .map(({ semestercode, name, yearcode }) => ({
        key: semestercode,
        texts: Object.values(name),
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
      separate: JSON.parse(separate),
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

    const yearCodes = stats.statistics.map(s => s.yearCode)
    const initFromYear = min(yearCodes)
    const initToYear = max(yearCodes)
    setFromYear(initFromYear)
    setToYear(initToYear)

    return () => dispatch(clearSelectedCourse())
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

  const getProgrammeName = programmeCode => {
    if (programmeCode === ALL.value) {
      return 'All'
    }
    if (programmeCode === 'EXCLUDED') {
      return 'Excluded'
    }
    const { name } = stats.programmes[programmeCode]
    return getTextIn(name)
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

  const belongsToAtLeastOneProgramme = codes => {
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

    return studentNumber => studentNumbers.has(studentNumber)
  }

  const validProgrammeCode = code => {
    const { programmes } = stats
    return programmes[code] || code === ALL.value || code === 'EXCLUDED'
  }

  const filteredYearsAndSemesters = () => {
    const yearCodes = stats.statistics.map(s => s.yearCode)
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

  const isStatInYearRange = ({ name }) => {
    const timeFilter = ({ value }) => value >= fromYear && value <= toYear
    const filteredSemesters = semesters.filter(timeFilter)
    const filteredYears = years.filter(timeFilter)
    if (separate) {
      return filteredSemesters.find(year => year.texts.includes(getTextIn(name)))
    }
    return filteredYears.find(year => year.text === name)
  }

  const countAttemptStats = (attempts, totalEnrollments, filter) => {
    const grades = countFilteredStudents(attempts.grades, filter)
    const categories = countFilteredStudents(attempts.categories, filter)
    const { failed, passed } = categories
    const total = totalEnrollments || passed + failed
    const passRate = 100 * (passed / total)

    return {
      grades,
      categories,
      passRate,
    }
  }

  const countStudentStats = (allStudents, enrolledNoGrade = 0, filter) => {
    const grades = countFilteredStudents(allStudents.grades, filter)
    const totalGrades = Object.values(grades).reduce((total, studentsWithGrade) => total + studentsWithGrade, 0)
    const totalPassed = Object.keys(grades).reduce((total, grade) => {
      return grade !== '0' ? total + grades[grade] : total
    }, 0)
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

  const countStudentEnrollmentStats = (allAttempts, filteredEnrollments, displayEnrollments) => {
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

  const statsForProgrammes = (programmeCodes, name) => {
    if (programmeCodes.length === 0) {
      return undefined
    }
    const { statistics } = stats
    const filter = belongsToAtLeastOneProgramme(programmeCodes)
    const formattedStats = statistics
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
          const parsedName = separate ? getTextIn(name) : name

          return {
            name: parsedName,
            students: { ...students, ...studentsEnrollments },
            attempts: { ...attempts, totalEnrollments },
            enrollments: filteredEnrollments,
            code,
            coursecode,
            rowObfuscated: obfuscated,
            userHasAccessToAllStats,
          }
        }
      )

    const totals = countTotalStats(formattedStats, userHasAccessToAllStats)

    return {
      codes: programmeCodes,
      name,
      stats: formattedStats.concat(totals),
      userHasAccessToAllStats,
      totals,
    }
  }

  const handleSelect = (_event, { name, value }) => {
    let selected = [...value].filter(value => value !== ALL.value)
    if (name === 'primary') {
      setComparison(comparison.filter(programmeCode => programmeCode !== 'EXCLUDED'))
    }
    if ((!primary.includes(ALL.value) && value.includes(ALL.value)) || (name === 'primary' && value.length === 0)) {
      selected = [ALL.value]
    }
    if (name === 'primary') {
      setPrimary(selected)
    }
    if (name === 'comparison') {
      setComparison(selected)
    }
  }

  const handleYearChange = (_event, { name, value }) => {
    if (name === 'fromYear' && value <= toYear) {
      setFromYear(value)
    } else if (name === 'toYear' && value >= fromYear) {
      setToYear(value)
    }
  }

  const filteredProgrammeStatistics = () => {
    const excludedProgrammes = getExcluded()
    const primaryProgrammes = primary
    const comparisonProgrammes = comparison.filter(code => validProgrammeCode(code))
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

  const clearComparison = () => setComparison([])

  const comparisonProgrammes = programmes => {
    const result = programmes.filter(({ key }) => key !== 'EXCLUDED')
    const excludedProgrammes = getExcluded()

    if (!primary.includes(ALL.value)) {
      const excludedStudents = result
        .filter(({ key }) => excludedProgrammes.includes(key) && key !== 'ALL')
        .reduce((res, { students }) => [...res, ...flatten(Object.values(students))], [])
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
    const years2 = `${years.find(s => s.value === from).text.split('-')[0]}-${
      years.find(s => s.value === to).text.split('-')[1]
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
    history.push(`/coursepopulation?${searchString}`)
  }

  const renderShowPopulation = (disabled = false) => {
    if (userHasAccessToAllStats) {
      return <Button content="Show population" disabled={disabled} onClick={showPopulation} />
    }
    return null
  }

  const statistics = filteredProgrammeStatistics()
  const { filteredYears } = filteredYearsAndSemesters()

  const timeFilter = (_, value) => value >= fromYear && value <= toYear
  const filteredProgrammes = programmes
    .map(programme => {
      const students = new Set(flatten(Object.values(pickBy(programme.students, timeFilter))))
      return { ...programme, students: [...students], size: students.size }
    })
    .filter(programme => programme.size > 0)

  if (stats.statistics.length < 1) {
    return <Segment>No data for selected course</Segment>
  }

  const options = filteredProgrammes
    .map(({ text, ...rest }) => ({ text: typeof text === 'string' ? text : getTextIn(text), ...rest }))
    .map(programme => ({ ...programme, name: programme.text }))

  return (
    <div>
      <Segment>
        <Header as="h4">Statistics by time range</Header>
        <YearFilter fromYear={fromYear} handleChange={handleYearChange} toYear={toYear} years={filteredYears} />
        <Form>
          {maxYearsToCreatePopulationFrom < toYear - fromYear + 1 ? (
            <Popup
              content={`The maximum time range to generate a population for this course is ${Math.max(
                0,
                maxYearsToCreatePopulationFrom
              )} years`}
              trigger={<span>{renderShowPopulation(true)}</span>}
            />
          ) : (
            renderShowPopulation()
          )}
        </Form>
      </Segment>
      {userHasAccessToAllStats && (
        <Segment>
          <Form>
            <Header as="h4">Filter statistics by study programmes</Header>
            <Grid>
              <Grid.Column width={8}>
                <ProgrammeDropdown
                  label="Primary group"
                  name="primary"
                  onChange={handleSelect}
                  options={options}
                  placeholder="Select study programmes"
                  value={primary}
                />
              </Grid.Column>
              <Grid.Column width={8}>
                <ProgrammeDropdown
                  label="Comparison group"
                  name="comparison"
                  onChange={handleSelect}
                  options={comparisonProgrammes(options)}
                  placeholder="Optional"
                  value={comparison}
                />
              </Grid.Column>
              <Grid.Column width={8} />
              <Grid.Column width={8}>
                <Form.Group>
                  <Form.Button
                    content="Select excluded study programmes"
                    disabled={primary.length === 1 && primary[0] === ALL.value}
                    onClick={setExcludedToComparison}
                  />
                  <Form.Button content="Clear" onClick={clearComparison} />
                </Form.Group>
              </Grid.Column>
            </Grid>
          </Form>
        </Segment>
      )}
      <ResultTabs
        availableStats={availableStats}
        comparison={statistics.comparison}
        primary={statistics.primary}
        separate={separate}
      />
    </div>
  )
}
