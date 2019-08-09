import React, { Component } from 'react'
import { Segment, Header, Form } from 'semantic-ui-react'
import { shape, string, arrayOf, objectOf, oneOfType, number } from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { getActiveLanguage } from 'react-localize-redux'
import qs from 'query-string'
import ResultTabs from '../ResultTabs'
import ProgrammeDropdown from '../ProgrammeDropdown'
import selectors, { ALL } from '../../../selectors/courseStats'
import YearFilter from '../SearchForm/YearFilter'
import { getTextIn } from '../../../common'

const countFilteredStudents = (stat, filter) => Object.entries(stat).reduce((acc, entry) => {
  const [category, students] = entry
  return {
    ...acc,
    [category]: students.filter(filter).length
  }
}, {})

class SingleCourseStats extends Component {
  state = {
    primary: [ALL.value],
    comparison: [],
    separate: null
  }

  componentDidMount = () => {
    const { location } = this.props
    if (location.search) {
      this.setState({ ...this.parseQueryFromUrl() })
    }
  }

  getProgrammeName = (progcode) => {
    if (progcode === ALL.value) {
      return 'All'
    }
    const { activeLanguage } = this.props
    const { name } = this.props.stats.programmes[progcode]
    return getTextIn(name, activeLanguage)
  }

  parseQueryFromUrl = () => {
    const { location } = this.props
    const { separate, fromYear, toYear } = qs.parse(location.search)
    return {
      separate: JSON.parse(separate),
      fromYear: JSON.parse(fromYear),
      fromYearInitial: JSON.parse(fromYear),
      toYear: JSON.parse(toYear),
      toYearInitial: JSON.parse(toYear)
    }
  }

  belongsToAtLeastOneProgramme = (codes) => {
    if (codes.includes(ALL.value)) return () => true

    const { programmes } = this.props.stats
    const studentNumbers = []
    codes.forEach((code) => {
      if (programmes[code]) {
        studentNumbers.push(...programmes[code].students)
      }
    })

    const numberset = new Set(studentNumbers)
    if (!numberset.size) return () => false
    return studentnumber => numberset.has(studentnumber)
  }

  validProgCode = (code) => {
    const { programmes } = this.props.stats
    return programmes[code] || (code === ALL.value)
  }

  filteredYearsAndSemesters = (useInitialValues = false) => {
    const { years, semesters } = this.props
    const { fromYearInitial, fromYear, toYearInitial, toYear } = this.state
    if (!fromYearInitial || !toYearInitial) {
      return {
        filteredYears: years,
        filteredSemesters: semesters
      }
    }
    const timeFilter = ({ value }) => (
      value >= (useInitialValues ? fromYearInitial : fromYear) &&
      value <= (useInitialValues ? toYearInitial : toYear)
    )
    return {
      filteredYears: years.filter(timeFilter),
      filteredSemesters: semesters.filter(timeFilter)
    }
  }

  isStatInYearRange = ({ name }) => {
    const { separate } = this.state
    const { filteredYears, filteredSemesters } = this.filteredYearsAndSemesters()
    return separate ?
      filteredSemesters.find(year => year.texts.includes(name)) :
      filteredYears.find(year => year.text === name)
  }

  statsForProgrammes = (progCodes, name) => {
    const { statistics } = this.props.stats
    const filter = this.belongsToAtLeastOneProgramme(progCodes)
    const progStats = statistics.map(({ code, name, students: allstudents, attempts, coursecode }) => {
      const cumulative = {
        grades: countFilteredStudents(attempts.grades, filter),
        categories: countFilteredStudents(attempts.classes, filter)
      }
      const students = {
        grades: countFilteredStudents(allstudents.grades, filter),
        categories: countFilteredStudents(allstudents.classes, filter)
      }
      return { code, name, cumulative, students, coursecode }
    }).filter(this.isStatInYearRange)
    return {
      codes: progCodes,
      name,
      stats: progStats
    }
  }

  handleSelect = (e, { name, value }) => {
    let selected = [...value].filter(v => v !== ALL.value)

    if ((!this.state[name].includes(ALL.value) && value.includes(ALL.value)) || (name === 'primary' && value.length === 0)) {
      selected = [ALL.value]
    }

    this.setState({ [name]: selected })
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value })
  }

  filteredProgrammeStatistics = () => {
    const { primary, comparison } = this.state
    const filter = p => this.validProgCode(p)

    const primaryProgrammes = primary.filter(filter)
    const comparisonProgrammes = comparison.filter(filter)
    const pstats = primaryProgrammes.length ? this.statsForProgrammes(
      primaryProgrammes,
      primaryProgrammes.length === 1 ? this.getProgrammeName(primaryProgrammes[0]) : 'Primary'
    ) : undefined
    const cstats = comparisonProgrammes.length ? this.statsForProgrammes(
      comparisonProgrammes,
      comparisonProgrammes.length === 1 ? this.getProgrammeName(comparisonProgrammes[0]) : 'Comparison'
    ) : undefined

    return {
      primary: pstats || undefined,
      comparison: cstats || undefined
    }
  }

  render() {
    const { programmes } = this.props
    const { fromYear, toYear, primary, comparison } = this.state
    const statistics = this.filteredProgrammeStatistics()
    const { filteredYears } = this.filteredYearsAndSemesters(true)

    return (
      <div>
        <Segment>
          <Form>
            <Header content="Filter statistics by time range" as="h4" />
            <YearFilter
              years={filteredYears}
              fromYear={fromYear}
              toYear={toYear}
              handleChange={this.handleChange}
              showCheckbox={false}
              separate={false}
            />
          </Form>
        </Segment>
        <Segment>
          <Form>
            <Header content="Filter statistics by study programme" as="h4" />
            <Form.Group widths="equal" >
              <ProgrammeDropdown
                name="primary"
                options={programmes}
                label="Primary group"
                placeholder="Select a study programme"
                value={primary}
                onChange={this.handleSelect}
              />
              <ProgrammeDropdown
                name="comparison"
                options={programmes}
                label="Comparison group"
                placeholder="Optional"
                value={comparison}
                onChange={this.handleSelect}
              />
            </Form.Group>
          </Form>
        </Segment>
        <ResultTabs
          primary={statistics.primary}
          comparison={statistics.comparison}
        />
      </div>
    )
  }
}

SingleCourseStats.propTypes = {
  stats: shape({
    alternatives: arrayOf(string),
    programmes: objectOf(shape({
      name: shape({}),
      students: arrayOf(string)
    })),
    statistics: arrayOf(shape({
      code: oneOfType([number, string]),
      name: string,
      attempts: objectOf(shape({
        failed: arrayOf(string),
        passed: arrayOf(string)
      }))
    })),
    name: string,
    coursecode: string
  }).isRequired,
  programmes: arrayOf(shape({})).isRequired,
  years: arrayOf(shape({})).isRequired,
  semesters: arrayOf(shape({})).isRequired,
  location: shape({}).isRequired,
  activeLanguage: string.isRequired
}

const mapStateToProps = (state) => {
  const { semesters = [], years = [] } = state.semesters.data
  return {
    programmes: selectors.getAllStudyProgrammes(state),
    years: Object.values(years).map(({ yearcode, yearname }) => ({
      key: yearcode,
      text: yearname,
      value: yearcode
    })).reverse(),
    semesters: Object.values(semesters).map(({ semestercode, name, yearcode }) => ({
      key: semestercode,
      texts: Object.values(name),
      value: yearcode
    })).reverse(),
    activeLanguage: getActiveLanguage(state.localize).code
  }
}

export default withRouter(connect(mapStateToProps)(SingleCourseStats))
