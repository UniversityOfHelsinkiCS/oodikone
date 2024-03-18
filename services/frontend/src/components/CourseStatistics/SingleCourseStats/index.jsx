import { difference, min, max, flatten, pickBy, uniq } from 'lodash'
import { arrayOf, bool, func, number, objectOf, oneOfType, shape, string } from 'prop-types'
import qs from 'query-string'
import React, { useEffect, useMemo, useState } from 'react'
import { connect } from 'react-redux'
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

const countFilteredStudents = (stat, filter) =>
  stat
    ? Object.entries(stat).reduce((acc, entry) => {
        const [category, students] = entry
        return {
          ...acc,
          [category]: students.filter(filter).length,
        }
      }, {})
    : {}

const SingleCourseStats = ({
  stats,
  availableStats,
  setSelectedCourse,
  clearSelectedCourse,
  programmes,
  userHasAccessToAllStats,
  unifyCourses,
}) => {
  const history = useHistory()
  const location = useLocation()
  const { getTextIn } = useLanguage()
  const [primary, setPrimary] = useState([ALL.value])
  const [comparison, setComparison] = useState([])
  const [fromYear, setFromYear] = useState(0)
  const [toYear, setToYear] = useState(0)
  const [separate, setSeparate] = useState(null)
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
    courseCodes: JSON.stringify(stats.alternatives),
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
    setSelectedCourse(coursecode)

    const yearcodes = stats.statistics.map(s => s.yearcode)
    const initFromYear = min(yearcodes)
    const initToYear = max(yearcodes)
    setFromYear(initFromYear)
    setToYear(initToYear)

    return () => clearSelectedCourse()
  }, [])

  useEffect(() => {
    if (location.search) {
      const { separate } = parseQueryFromUrl()
      setSeparate(separate)
    }
  }, [location.search])

  useEffect(() => {
    if (primary.every(c => !programmes.map(p => p.key).includes(c))) {
      setPrimary([ALL.value])
    }
  }, [programmes])

  const getProgrammeName = progcode => {
    if (progcode === ALL.value) {
      return 'All'
    }
    if (progcode === 'EXCLUDED') {
      return 'Excluded'
    }
    const { name } = stats.programmes[progcode]
    return getTextIn(name)
  }

  const setExcludedToComparison = () => setComparison(primary.includes(ALL.value) ? [] : ['EXCLUDED'])

  const getExcluded = () =>
    primary.includes(ALL.value)
      ? []
      : difference(
          programmes.map(p => p.value).filter(v => v !== ALL.value),
          primary
        )

  const belongsToAtLeastOneProgramme = codes => {
    if (codes.includes(ALL.value)) return () => true

    const { programmes } = stats
    const studentNumbers = []
    codes.forEach(code => {
      if (programmes[code]) {
        studentNumbers.push(...flatten(Object.values(programmes[code].students)))
      }
    })

    const numberset = new Set(studentNumbers)
    return studentnumber => numberset.has(studentnumber)
  }

  const validProgCode = code => {
    const { programmes } = stats
    return programmes[code] || code === ALL.value || code === 'EXCLUDED'
  }

  const filteredYearsAndSemesters = () => {
    const yearcodes = stats.statistics.map(s => s.yearcode)
    const from = min(yearcodes)
    const to = max(yearcodes)
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
    return separate
      ? filteredSemesters.find(year => year.texts.includes(getTextIn(name)))
      : filteredYears.find(year => year.text === name)
  }

  const countAttemptStats = (attempts, filter) => {
    // Count the stats for the Attempts- and Grades-tab
    // Also used in Pass rate chart and Grade distribution chart
    const grades = countFilteredStudents(attempts.grades, filter)
    const categories = countFilteredStudents(attempts.categories, filter)

    const { failed, passed } = categories
    const passRate = (100 * passed) / (passed + failed)

    return {
      grades,
      categories,
      passRate,
    }
  }

  const countStudentStats = (allstudents, enrolledNoGrade = 0, filter) => {
    const categories = countFilteredStudents(allstudents.categories, filter)
    const grades = countFilteredStudents(allstudents.grades, filter)
    const { passedFirst = 0, passedEventually = 0, neverPassed = 0 } = categories
    const total = passedFirst + passedEventually + neverPassed
    const passRate = (passedFirst + passedEventually) / total
    const failRate = neverPassed / total
    const withEnrollments = {
      total: total + enrolledNoGrade,
      passRate: (passedFirst + passedEventually) / (total + enrolledNoGrade),
      failRate: (neverPassed + enrolledNoGrade) / (total + enrolledNoGrade),
    }

    return {
      totalPassed: passedFirst + passedEventually,
      totalFailed: neverPassed,
      categories,
      passRate,
      failRate,
      total,
      withEnrollments,
      grades,
    }
  }

  const countEnrollmentStates = filteredEnrollments => {
    const combined = { CONFIRMED: 'ENROLLED', ABORTED_BY_TEACHER: 'ABORTED', ABORTED_BY_STUDENT: 'ABORTED' }
    return filteredEnrollments.reduce(
      (acc, enrollment) => {
        const state = combined[enrollment.state] || enrollment.state
        if (acc[state] === undefined) acc[state] = 0
        acc[state] += 1
        return acc
      },
      {
        ENROLLED: 0,
        REJECTED: 0,
        ABORTED: 0,
      }
    )
  }

  const countAttemptEnrollmentStats = (filteredEnrollments, displayEnrollments) => {
    const enrollmentsByState = countEnrollmentStates(filteredEnrollments)
    const totalEnrollments = displayEnrollments ? filteredEnrollments.length : undefined
    if (!displayEnrollments)
      Object.keys(enrollmentsByState).forEach(k => {
        enrollmentsByState[k] = undefined
      })
    return { enrollmentsByState, totalEnrollments }
  }

  const countStudentEnrollmentStats = (allAttempts, filteredEnrollments, displayEnrollments) => {
    const enrolledStudentsWithNoGrade = filteredEnrollments.filter(({ studentnumber, state }) => {
      if (state !== 'ENROLLED') return false
      const hasFailed = allAttempts.categories.failed ? allAttempts.categories.failed.includes(studentnumber) : false
      const hasPassed = allAttempts.categories.passed ? allAttempts.categories.passed.includes(studentnumber) : false
      return !hasFailed && !hasPassed
    })
    const enrollmentsByState = countEnrollmentStates(filteredEnrollments)
    if (!displayEnrollments) {
      Object.keys(enrollmentsByState).forEach(k => {
        enrollmentsByState[k] = undefined
      })
      return { enrolledStudentsWithNoGrade: undefined, enrollmentsByState, totalEnrollments: undefined }
    }
    return {
      enrolledStudentsWithNoGrade: enrolledStudentsWithNoGrade.length,
      enrollmentsByState,
      totalEnrollments: filteredEnrollments.length,
    }
  }

  const statsForProgrammes = (progCodes, name) => {
    const { statistics } = stats
    const filter = belongsToAtLeastOneProgramme(progCodes)
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
          yearcode,
        }) => {
          const displayEnrollments = yearcode >= 72 // Display enrollments only for Sisu era
          const filteredEnrollments = enrollments.filter(({ studentnumber }) => filter(studentnumber))
          const filteredAllEnrollments = allEnrollments.filter(({ studentnumber }) => filter(studentnumber))

          const attempts = countAttemptStats(allAttempts, filter)
          const attemptsEnrollments = countAttemptEnrollmentStats(filteredAllEnrollments, displayEnrollments)
          const studentsEnrollments = countStudentEnrollmentStats(allAttempts, filteredEnrollments, displayEnrollments)
          const students = countStudentStats(allStudents, studentsEnrollments.enrolledStudentsWithNoGrade, filter)
          const parsedName = separate ? getTextIn(name) : name

          return {
            name: parsedName,
            students: { ...students, ...studentsEnrollments },
            attempts: { ...attempts, ...attemptsEnrollments },
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
      codes: progCodes.concat,
      name,
      stats: formattedStats.concat(totals),
      userHasAccessToAllStats,
      totals,
    }
  }

  const handleSelect = (_event, { name, value }) => {
    let selected = [...value].filter(v => v !== ALL.value)
    if (name === 'primary') {
      setComparison(comparison.filter(p => p !== 'EXCLUDED'))
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
    if (name === 'fromYear' && value <= toYear) setFromYear(value)
    else if (name === 'toYear' && value >= fromYear) setToYear(value)
  }

  const filteredProgrammeStatistics = () => {
    const filter = p => validProgCode(p)
    const excludedProgrammes = getExcluded()

    const primaryProgrammes = primary
    const comparisonProgrammes = comparison.filter(filter)
    if (comparison.includes('EXCLUDED')) comparisonProgrammes.push(...excludedProgrammes)

    const pstats = primaryProgrammes.length
      ? statsForProgrammes(
          primaryProgrammes,
          primaryProgrammes.length === 1 ? getProgrammeName(primaryProgrammes[0]) : 'Primary'
        )
      : undefined
    const cstats = comparisonProgrammes.length
      ? statsForProgrammes(
          comparisonProgrammes,
          comparisonProgrammes.length === 1 ? getProgrammeName(comparisonProgrammes[0]) : 'Comparison'
        )
      : undefined

    return {
      primary: pstats || undefined,
      comparison: cstats || undefined,
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
    return result.filter(({ key }) => !comparison.includes('EXCLUDED') || !excludedProgrammes.includes(key))
  }

  const showPopulation = () => {
    const from = fromYear
    const to = toYear
    const years2 = `${years.find(s => s.value === from).text.split('-')[0]}-${
      years.find(s => s.value === to).text.split('-')[1]
    }`
    const { alternatives } = stats
    const queryObject = { from, to, coursecodes: JSON.stringify(alternatives), years2, separate: false, unifyCourses }
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

  if (stats.statistics.length < 1) return <Segment>No data for selected course</Segment>

  const options = filteredProgrammes
    .map(({ text, ...rest }) => ({ text: typeof text === 'string' ? text : getTextIn(text), ...rest }))
    .map(prog => ({ ...prog, name: prog.text }))

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

SingleCourseStats.propTypes = {
  stats: shape({
    alternatives: arrayOf(string),
    programmes: objectOf(
      shape({
        name: shape({}),
        students: shape({}),
      })
    ),
    statistics: arrayOf(
      shape({
        code: oneOfType([number, string]),
        name: string,
        attempts: objectOf(
          shape({
            failed: arrayOf(string),
            passed: arrayOf(string),
          })
        ),
      })
    ),
    name: shape({ fi: string, en: string, sv: string }),
    coursecode: string,
  }).isRequired,
  programmes: arrayOf(shape({})).isRequired,
  setSelectedCourse: func.isRequired,
  clearSelectedCourse: func.isRequired,
  userHasAccessToAllStats: bool.isRequired,
}

const mapStateToProps = state => {
  return {
    programmes: getAllStudyProgrammes(state),
    unifyCourses: state.courseSearch.openOrRegular,
  }
}

const mapDispatchToProps = {
  setSelectedCourse,
  clearSelectedCourse,
}

export const ConnectedSingleCourseStats = connect(mapStateToProps, mapDispatchToProps)(SingleCourseStats)
