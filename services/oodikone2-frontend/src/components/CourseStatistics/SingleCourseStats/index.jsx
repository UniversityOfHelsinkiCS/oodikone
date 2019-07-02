import React, { Component } from 'react'
import { Segment, Header, Form } from 'semantic-ui-react'
import { shape, string, arrayOf, objectOf, oneOfType, number } from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import ResultTabs from '../ResultTabs'
import ProgrammeDropdown from '../ProgrammeDropdown'
import selectors, { ALL } from '../../../selectors/courseStats'
import YearFilter from '../SearchForm/YearFilter'
import qs from 'query-string'

const countFilteredStudents = (stat, filter) => Object.entries(stat).reduce((acc, entry) => {
  const [category, students] = entry
  return {
    ...acc,
    [category]: students.filter(filter).length
  }
}, {})

class SingleCourseStats extends Component {
  state = {
    primary: ALL.value,
    comparison: null,
    separate: null
  }

  componentDidMount = () => {
    const { location } = this.props
    if (location.search) {
      this.setState({ ...this.parseQueryFromUrl() })
    }
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

  getProgrammeName = (progcode) => {
    if (progcode === ALL.value) {
      return 'All'
    }
    const { name } = this.props.stats.programmes[progcode]
    return name.fi || name.en || name.sv
  }

  belongsToProgramme = (code) => {
    if (code === ALL.value) {
      return () => true
    }
    const { programmes } = this.props.stats
    const programme = programmes[code]
    if (!programme) {
      return () => false
    }
    const numberset = new Set(programme.students)
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

  statsForProgramme = (progcode) => {
    const { statistics } = this.props.stats
    const filter = this.belongsToProgramme(progcode)
    const progstats = statistics.map(({ code, name, students: allstudents, attempts }) => {
      const cumulative = {
        grades: countFilteredStudents(attempts.grades, filter),
        categories: countFilteredStudents(attempts.classes, filter)
      }
      const students = {
        grades: countFilteredStudents(allstudents.grades, filter),
        categories: countFilteredStudents(allstudents.classes, filter)
      }
      return { code, name, cumulative, students }
    }).filter(this.isStatInYearRange)
    return {
      code: progcode,
      name: this.getProgrammeName(progcode),
      stats: progstats
    }
  }

  handleChange = (e, { name, value }) => {
    this.setState({ [name]: value })
  }

  filteredProgrammeStatistics = () => {
    const { primary, comparison } = this.state
    const pstats = !this.validProgCode(primary) ? undefined : this.statsForProgramme(primary)
    const cstats = !this.validProgCode(comparison)
      ? undefined
      : this.statsForProgramme(comparison)
    return {
      primary: pstats,
      comparison: cstats
    }
  }

  selectedProgrammes = () => {
    const { primary: p, comparison: c } = this.state
    const { programmes } = this.props.stats
    const primary = !programmes[p] ? ALL.value : p
    const comparison = !programmes[c] ? undefined : c
    return { primary, comparison }
  }

  render() {
    const { programmes } = this.props
    const { fromYear, toYear } = this.state
    const { primary, comparison } = this.selectedProgrammes()
    const statistics = this.filteredProgrammeStatistics()
    const { filteredYears } = this.filteredYearsAndSemesters(true)
    return (
      <div>
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
                onChange={this.handleChange}
              />
              <ProgrammeDropdown
                name="comparison"
                options={programmes}
                label="Comparison group"
                placeholder="Optional"
                value={comparison}
                onChange={this.handleChange}
                onClear={() => this.setState({ comparison: undefined })}
              />
            </Form.Group>
          </Form>
        </Segment>
        <Segment>
          <Form>
            <Header content="Filter statistics by time range" as="h4" />
            <YearFilter
              years={filteredYears}
              fromYear={fromYear}
              toYear={toYear}
              handleChange={this.handleChange}
              showCheckbox={false}
            />
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
  programmes: arrayOf(shape({})).isRequired
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
    })).reverse()
  }
}

export default withRouter(connect(mapStateToProps)(SingleCourseStats))
