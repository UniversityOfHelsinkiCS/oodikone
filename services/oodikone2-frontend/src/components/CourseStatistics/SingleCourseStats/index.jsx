import React, { useState, useEffect } from 'react'
import { Segment, Header, Form, Grid, Button, Popup } from 'semantic-ui-react'
import { shape, string, arrayOf, objectOf, oneOfType, number, func } from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getActiveLanguage } from 'react-localize-redux'
import { difference, min, max, flatten, pickBy, uniq } from 'lodash'
import qs from 'query-string'
import ResultTabs from '../ResultTabs'
import {
  setSelectedCourse,
  clearSelectedCourse,
  getMaxYearsToCreatePopulationFrom
} from '../../../redux/singleCourseStats'
import ProgrammeDropdown from '../ProgrammeDropdown'
import selectors, { ALL } from '../../../selectors/courseStats'
import YearFilter from '../SearchForm/YearFilter'
import { getTextIn } from '../../../common'
import { getSemesters } from '../../../redux/semesters'
import TSA from '../../../common/tsa'

const ANALYTICS_CATEGORY = 'Course Statistics'
const sendAnalytics = (action, name, value) => TSA.Matomo.sendEvent(ANALYTICS_CATEGORY, action, name, value)

const countFilteredStudents = (stat, filter) =>
  Object.entries(stat).reduce((acc, entry) => {
    const [category, students] = entry
    return {
      ...acc,
      [category]: students.filter(filter).length
    }
  }, {})

const SingleCourseStats = ({
  stats,
  setSelectedCourse,
  clearSelectedCourse,
  activeLanguage,
  history,
  location,
  stats: { coursecode },
  getSemesters,
  years,
  semesters,
  programmes,
  maxYearsToCreatePopulationFrom,
  getMaxYearsToCreatePopulationFrom
}) => {
  const [primary, setPrimary] = useState([ALL.value])
  const [comparison, setComparison] = useState([])
  const [fromYear, setFromYear] = useState(0)
  const [toYear, setToYear] = useState(0)
  const [separate, setSeparate] = useState(null)

  const parseQueryFromUrl = () => {
    const { separate } = qs.parse(location.search)
    return {
      separate: JSON.parse(separate)
    }
  }

  useEffect(() => {
    if (years.length === 0 || semesters.length === 0) getSemesters()
    if (location.search) {
      const { separate } = parseQueryFromUrl()
      setSeparate(separate)
    }
    getMaxYearsToCreatePopulationFrom({
      courseCodes: JSON.stringify(stats.alternatives)
    })
    setSelectedCourse(coursecode)

    const yearcodes = stats.statistics.map(s => s.yearcode)
    const initFromYear = min(yearcodes)
    const initToYear = max(yearcodes)
    setFromYear(initFromYear)
    setToYear(initToYear)

    return () => clearSelectedCourse()
  }, [])

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
    return getTextIn(name, activeLanguage)
  }

  const setExcludedToComparison = () => setComparison(primary.includes(ALL.value) ? [] : ['EXCLUDED'])

  const getExcluded = () =>
    primary.includes(ALL.value) ? [] : difference(programmes.map(p => p.value).filter(v => v !== ALL.value), primary)

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
    return programmes[code] || (code === ALL.value || code === 'EXCLUDED')
  }

  const filteredYearsAndSemesters = () => {
    const yearcodes = stats.statistics.map(s => s.yearcode)
    const from = min(yearcodes)
    const to = max(yearcodes)
    if (from == null || to == null) {
      return {
        filteredYears: years,
        filteredSemesters: semesters
      }
    }
    const timeFilter = ({ value }) => value >= from && value <= to
    return {
      filteredYears: years.filter(timeFilter),
      filteredSemesters: semesters.filter(timeFilter)
    }
  }

  const isStatInYearRange = ({ name }) => {
    const timeFilter = ({ value }) => value >= fromYear && value <= toYear
    const filteredSemesters = semesters.filter(timeFilter)
    const filteredYears = years.filter(timeFilter)
    return separate
      ? filteredSemesters.find(year => year.texts.includes(name))
      : filteredYears.find(year => year.text === name)
  }

  const statsForProgrammes = (progCodes, name) => {
    const { statistics } = stats
    const filter = belongsToAtLeastOneProgramme(progCodes)
    const progStats = statistics
      .filter(isStatInYearRange)
      .map(({ code, name, students: allstudents, attempts, coursecode }) => {
        const cumulative = {
          grades: countFilteredStudents(attempts.grades, filter),
          categories: countFilteredStudents(attempts.classes, filter)
        }
        const students = {
          grades: countFilteredStudents(allstudents.grades, filter),
          categories: countFilteredStudents(allstudents.classes, filter)
        }
        return { code, name, cumulative, students, coursecode }
      })
    const totals = progStats.reduce(
      (acc, curr) => {
        const passed = acc.cumulative.categories.passed + curr.cumulative.categories.passed
        const failed = acc.cumulative.categories.failed + curr.cumulative.categories.failed
        const cgrades = acc.cumulative.grades

        Object.keys(curr.cumulative.grades).forEach(grade => {
          if (!cgrades[grade]) cgrades[grade] = 0
          cgrades[grade] += curr.cumulative.grades[grade]
        })
        const { passedFirst, failedFirst } = curr.students.categories

        const newPassedFirst = passedFirst
          ? acc.students.categories.passedFirst + passedFirst
          : acc.students.categories.passedFirst
        const newFailedFirst = failedFirst
          ? acc.students.categories.failedFirst + failedFirst
          : acc.students.categories.failedFirst

        const sgrades = acc.students.grades

        Object.keys(curr.students.grades).forEach(grade => {
          if (!sgrades[grade]) sgrades[grade] = 0
          sgrades[grade] += curr.students.grades[grade]
        })

        return {
          ...acc,
          coursecode: curr.coursecode,
          cumulative: { categories: { passed, failed }, grades: cgrades },
          students: { categories: { passedFirst: newPassedFirst, failedFirst: newFailedFirst }, grades: sgrades }
        }
      },
      {
        code: 9999,
        name: 'Total',
        coursecode: '000',
        cumulative: {
          categories: {
            passed: 0,
            failed: 0
          },
          grades: {}
        },
        students: {
          categories: {
            passedFirst: 0,
            failedFirst: 0
          },
          grades: {}
        }
      }
    )
    return {
      codes: progCodes.concat,
      name,
      stats: progStats.concat(totals),
      totals
    }
  }

  const handleSelect = (e, { name, value }) => {
    let selected = [...value].filter(v => v !== ALL.value)
    if (name === 'primary') {
      setComparison(comparison.filter(p => p !== 'EXCLUDED'))
    }

    if ((!primary.includes(ALL.value) && value.includes(ALL.value)) || (name === 'primary' && value.length === 0)) {
      selected = [ALL.value]
    }
    if (name === 'primary') {
      if (primary.length > selected.length) sendAnalytics('Primary group removed', 'Course stats')
      else sendAnalytics('Primary group set', 'Course stats')
      setPrimary(selected)
    }

    if (name === 'comparison') {
      if (comparison.length > selected.length) sendAnalytics('Comparison group removed', 'Course stats')
      else sendAnalytics('Comparison group set', 'Course stats')
      setComparison(selected)
    }
  }

  const handleYearChange = (e, { name, value }) => {
    if (name === 'fromYear' && value <= toYear) setFromYear(value)
    else if (name === 'toYear' && value >= fromYear) setToYear(value)
    sendAnalytics('Changed time frame', 'Course stats')
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
      comparison: cstats || undefined
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
        value: 'EXCLUDED'
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
    const queryObject = { from, to, coursecodes: JSON.stringify(alternatives), years2, separate: false }
    const searchString = qs.stringify(queryObject)
    history.push(`/coursepopulation?${searchString}`)
  }

  const renderShowPopulation = (disabled = false) => {
    return <Button disabled={disabled} onClick={showPopulation} content="Show population" />
  }

  const statistics = filteredProgrammeStatistics()
  const { filteredYears } = filteredYearsAndSemesters()

  const timeFilter = (_, value) => value >= fromYear && value <= toYear
  const filteredProgrammes = programmes
    .map(e => {
      const students = new Set(flatten(Object.values(pickBy(e.students, timeFilter))))
      return { ...e, students: [...students], size: students.size }
    })
    .filter(e => e.size > 0)
  if (stats.statistics.length < 1) return <Segment>No data for selected course</Segment>

  return (
    <div>
      <Segment>
        <Form>
          <Header content="Statistics by time range" as="h4" />
          <YearFilter years={filteredYears} fromYear={fromYear} toYear={toYear} handleChange={handleYearChange} />
          {maxYearsToCreatePopulationFrom < toYear - fromYear + 1 ? (
            <Popup
              content={`Max years to create a population from for this course is ${Math.max(
                0,
                maxYearsToCreatePopulationFrom
              )}`}
              trigger={<span>{renderShowPopulation(true)}</span>}
            />
          ) : (
            renderShowPopulation()
          )}
        </Form>
      </Segment>
      <Segment>
        <Form>
          <Header content="Filter statistics by study programmes" as="h4" />
          <Grid>
            <Grid.Column width={8}>
              <ProgrammeDropdown
                name="primary"
                options={filteredProgrammes}
                label="Primary group"
                placeholder="Select study programmes"
                value={primary}
                onChange={handleSelect}
              />
            </Grid.Column>
            <Grid.Column width={8}>
              <ProgrammeDropdown
                name="comparison"
                options={comparisonProgrammes(filteredProgrammes)}
                label="Comparison group"
                placeholder="Optional"
                value={comparison}
                onChange={handleSelect}
              />
            </Grid.Column>
            <Grid.Column width={8} />
            <Grid.Column width={8}>
              <Form.Group>
                <Form.Button
                  content="Select excluded study programmes"
                  onClick={setExcludedToComparison}
                  disabled={primary.length === 1 && primary[0] === ALL.value}
                />
                <Form.Button content="Clear" onClick={clearComparison} />
              </Form.Group>
            </Grid.Column>
          </Grid>
        </Form>
      </Segment>
      <ResultTabs separate={separate} primary={statistics.primary} comparison={statistics.comparison} />
    </div>
  )
}

SingleCourseStats.propTypes = {
  stats: shape({
    alternatives: arrayOf(string),
    programmes: objectOf(
      shape({
        name: shape({}),
        students: shape({})
      })
    ),
    statistics: arrayOf(
      shape({
        code: oneOfType([number, string]),
        name: string,
        attempts: objectOf(
          shape({
            failed: arrayOf(string),
            passed: arrayOf(string)
          })
        )
      })
    ),
    name: string,
    coursecode: string
  }).isRequired,
  programmes: arrayOf(shape({})).isRequired,
  years: arrayOf(shape({})).isRequired,
  semesters: arrayOf(shape({})).isRequired,
  location: shape({}).isRequired,
  activeLanguage: string.isRequired,
  setSelectedCourse: func.isRequired,
  clearSelectedCourse: func.isRequired,
  getSemesters: func.isRequired,
  history: shape({
    push: func
  }).isRequired,
  getMaxYearsToCreatePopulationFrom: func.isRequired,
  maxYearsToCreatePopulationFrom: number.isRequired
}

const mapStateToProps = state => {
  const { semesters = [], years = [] } = state.semesters.data
  return {
    programmes: selectors.getAllStudyProgrammes(state),
    years: Object.values(years)
      .map(({ yearcode, yearname }) => ({
        key: yearcode,
        text: yearname,
        value: yearcode
      }))
      .reverse(),
    semesters: Object.values(semesters)
      .map(({ semestercode, name, yearcode }) => ({
        key: semestercode,
        texts: Object.values(name),
        value: yearcode
      }))
      .reverse(),
    activeLanguage: getActiveLanguage(state.localize).code,
    maxYearsToCreatePopulationFrom: state.singleCourseStats.maxYearsToCreatePopulationFrom
  }
}

const mapDispatchToProps = {
  setSelectedCourse,
  clearSelectedCourse,
  getSemesters,
  getMaxYearsToCreatePopulationFrom
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(SingleCourseStats)
)
