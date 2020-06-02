import React, { Component } from 'react'
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

const countFilteredStudents = (stat, filter) =>
  Object.entries(stat).reduce((acc, entry) => {
    const [category, students] = entry
    return {
      ...acc,
      [category]: students.filter(filter).length
    }
  }, {})

class SingleCourseStats extends Component {
  constructor(props) {
    super(props)

    const yearcodes = props.stats.statistics.map(s => s.yearcode)
    const fromYear = min(yearcodes)
    const toYear = max(yearcodes)

    this.state = {
      primary: [ALL.value],
      comparison: [],
      fromYear,
      toYear,
      separate: null
    }
  }

  componentWillMount = () => {
    const {
      setSelectedCourse,
      location,
      stats: { coursecode },
      getSemesters,
      years,
      semesters
    } = this.props
    if (years.length === 0 || semesters.length === 0) getSemesters()
    if (location.search) {
      const params = this.parseQueryFromUrl()
      this.setState(params)
    }
    setSelectedCourse(coursecode)
  }

  componentDidUpdate = prevProps => {
    const { primary } = this.state
    if (this.props.programmes.length !== prevProps.programmes.length) {
      if (primary.every(c => !this.props.programmes.map(p => p.key).includes(c))) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({
          primary: [ALL.value]
        })
      }
    }
  }

  componentWillUnmount = () => {
    const { clearSelectedCourse } = this.props
    clearSelectedCourse()
  }

  componentDidMount = () => {
    this.props.getMaxYearsToCreatePopulationFrom({
      courseCodes: JSON.stringify(this.props.stats.alternatives)
    })
  }

  getProgrammeName = progcode => {
    if (progcode === ALL.value) {
      return 'All'
    }
    if (progcode === 'EXCLUDED') {
      return 'Excluded'
    }
    const { activeLanguage } = this.props
    const { name } = this.props.stats.programmes[progcode]
    return getTextIn(name, activeLanguage)
  }

  setExcludedToComparison = () =>
    this.setState({
      // eslint-disable-next-line react/no-access-state-in-setstate
      comparison: this.state.primary.includes(ALL.value) ? [] : ['EXCLUDED']
    })

  getExcluded = () =>
    this.state.primary.includes(ALL.value)
      ? []
      : difference(this.props.programmes.map(p => p.value).filter(v => v !== ALL.value), this.state.primary)

  belongsToAtLeastOneProgramme = codes => {
    if (codes.includes(ALL.value)) return () => true

    const { programmes } = this.props.stats
    const studentNumbers = []
    codes.forEach(code => {
      if (programmes[code]) {
        studentNumbers.push(...flatten(Object.values(programmes[code].students)))
      }
    })

    const numberset = new Set(studentNumbers)
    return studentnumber => numberset.has(studentnumber)
  }

  validProgCode = code => {
    const { programmes } = this.props.stats
    return programmes[code] || (code === ALL.value || code === 'EXCLUDED')
  }

  filteredYearsAndSemesters = () => {
    const { years, semesters, stats } = this.props
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

  isStatInYearRange = ({ name }) => {
    const { separate, fromYear, toYear } = this.state
    const { years, semesters } = this.props
    const timeFilter = ({ value }) => value >= fromYear && value <= toYear
    const filteredSemesters = semesters.filter(timeFilter)
    const filteredYears = years.filter(timeFilter)
    return separate
      ? filteredSemesters.find(year => year.texts.includes(name))
      : filteredYears.find(year => year.text === name)
  }

  statsForProgrammes = (progCodes, name) => {
    const { statistics } = this.props.stats
    const filter = this.belongsToAtLeastOneProgramme(progCodes)
    const progStats = statistics
      .filter(this.isStatInYearRange)
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

  handleSelect = (e, { name, value }) => {
    let selected = [...value].filter(v => v !== ALL.value)

    if (name === 'primary') {
      this.setState({
        // eslint-disable-next-line react/no-access-state-in-setstate
        comparison: this.state.comparison.filter(p => p !== 'EXCLUDED')
      })
    }

    if (
      (!this.state[name].includes(ALL.value) && value.includes(ALL.value)) ||
      (name === 'primary' && value.length === 0)
    ) {
      selected = [ALL.value]
    }

    this.setState({ [name]: selected })
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value })
  }

  handleYearChange = (e, { name, value }) => {
    const { fromYear, toYear } = this.state
    if (name === 'fromYear' && value <= toYear) this.setState({ fromYear: value })
    else if (name === 'toYear' && value >= fromYear) this.setState({ toYear: value })
  }

  filteredProgrammeStatistics = () => {
    const { primary, comparison } = this.state
    const filter = p => this.validProgCode(p)

    const excludedProgrammes = this.getExcluded()

    const primaryProgrammes = primary
    const comparisonProgrammes = comparison.filter(filter)
    if (comparison.includes('EXCLUDED')) comparisonProgrammes.push(...excludedProgrammes)

    const pstats = primaryProgrammes.length
      ? this.statsForProgrammes(
          primaryProgrammes,
          primaryProgrammes.length === 1 ? this.getProgrammeName(primaryProgrammes[0]) : 'Primary'
        )
      : undefined
    const cstats = comparisonProgrammes.length
      ? this.statsForProgrammes(
          comparisonProgrammes,
          comparisonProgrammes.length === 1 ? this.getProgrammeName(comparisonProgrammes[0]) : 'Comparison'
        )
      : undefined
    return {
      primary: pstats || undefined,
      comparison: cstats || undefined
    }
  }

  parseQueryFromUrl = () => {
    const { location } = this.props
    const { separate } = qs.parse(location.search)
    return {
      separate: JSON.parse(separate)
    }
  }

  clearComparison = () => this.setState({ comparison: [] })

  comparisonProgrammes = programmes => {
    const { primary, comparison } = this.state
    const result = programmes.filter(({ key }) => key !== 'EXCLUDED')
    const excludedProgrammes = this.getExcluded()

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

  showPopulation = () => {
    const { fromYear: from, toYear: to } = this.state
    const {
      stats: { alternatives },
      history,
      years: yearCodes
    } = this.props
    const years = `${yearCodes.find(s => s.value === from).text.split('-')[0]}-${
      yearCodes.find(s => s.value === to).text.split('-')[1]
    }`
    const queryObject = { from, to, coursecodes: JSON.stringify(alternatives), years, separate: false }
    const searchString = qs.stringify(queryObject)
    history.push(`/coursepopulation?${searchString}`)
  }

  renderShowPopulation(disabled = false) {
    return <Button disabled={disabled} onClick={this.showPopulation} content="Show population" />
  }

  render() {
    const { programmes, maxYearsToCreatePopulationFrom, stats } = this.props
    const { primary, comparison, fromYear, toYear } = this.state
    const statistics = this.filteredProgrammeStatistics()
    const { filteredYears } = this.filteredYearsAndSemesters()

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
            <YearFilter
              years={filteredYears}
              fromYear={fromYear}
              toYear={toYear}
              handleChange={this.handleYearChange}
            />
            {maxYearsToCreatePopulationFrom < toYear - fromYear + 1 ? (
              <Popup
                content={`Max years to create a population from for this course is ${Math.max(
                  0,
                  maxYearsToCreatePopulationFrom
                )}`}
                trigger={<span>{this.renderShowPopulation(true)}</span>}
              />
            ) : (
              this.renderShowPopulation()
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
                  onChange={this.handleSelect}
                />
              </Grid.Column>
              <Grid.Column width={8}>
                <ProgrammeDropdown
                  name="comparison"
                  options={this.comparisonProgrammes(filteredProgrammes)}
                  label="Comparison group"
                  placeholder="Optional"
                  value={comparison}
                  onChange={this.handleSelect}
                />
              </Grid.Column>
              <Grid.Column width={8} />
              <Grid.Column width={8}>
                <Form.Group>
                  <Form.Button
                    content="Select excluded study programmes"
                    onClick={this.setExcludedToComparison}
                    disabled={primary.length === 1 && primary[0] === ALL.value}
                  />
                  <Form.Button content="Clear" onClick={this.clearComparison} />
                </Form.Group>
              </Grid.Column>
            </Grid>
          </Form>
        </Segment>
        <ResultTabs separate={this.state.separate} primary={statistics.primary} comparison={statistics.comparison} />
      </div>
    )
  }
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
