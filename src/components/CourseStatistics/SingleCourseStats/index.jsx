import React, { Component } from 'react'
import { Segment, Header, Label, Form, Divider } from 'semantic-ui-react'
import { shape, string, arrayOf, objectOf, oneOfType, number } from 'prop-types'
import _ from 'lodash'
import ResultTabs from '../ResultTabs'

const ALL = {
  key: 'all',
  value: 'all',
  text: 'All'
}

const label = count => ({ content: count, icon: 'user', basic: true })

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
    comparison: undefined,
    cumMode: true
  }

  getMax = stats => ({
    maxPassRateVal: _.max(stats.map(year =>
      year.attempts.classes.passed.concat(year.attempts.classes.failed).length)),
    maxGradeVal: _.max(_.max(stats.map(year =>
      Object.values(Object.entries(year.attempts.grades).reduce((acc, [key, value]) => {
        if (['Eisa', 'Hyl.', '0', 'Luop'].includes(key)) {
          return { ...acc, 0: acc['0'] + value.length }
        }
        return { ...acc, [key]: value.length }
      }, { 0: 0 })))))
  })

  getProgrammeName = (progcode) => {
    if (progcode === ALL.value) {
      return 'All'
    }
    const { name } = this.props.stats.programmes[progcode]
    return name.fi || name.en || name.sv
  }

  programmeOptions = () => {
    const { programmes } = this.props.stats
    const options = Object.entries(programmes)
      .map(([code, { name, students }]) => ({
        key: code,
        value: code,
        text: name.fi || name.en || name.sv,
        students: students.length,
        label: label(students.length)
      }))
      .sort((op1, op2) => op2.students - op1.students)
    const total = options.reduce((acc, opt) => acc + opt.students, 0)
    return [
      { ...ALL, label: label(total) },
      ...options
    ]
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
    })
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
  changeMode = () => {
    this.setState({ cumMode: !this.state.cumMode })
  }

  render() {
    const { stats } = this.props
    const { primary, comparison } = this.selectedProgrammes()
    const options = this.programmeOptions()
    const statistics = this.filteredProgrammeStatistics()
    const max = this.getMax(stats.statistics)
    return (
      <div>
        <Segment>
          <Header content={stats.name.default} />
          <Label.Group>
            {stats.alternatives.map(code => <Label key={code} content={code} />)}
          </Label.Group>
          <Divider />
          <Form>
            <Header content="Filter statistics by study programme" as="h4" />
            <Form.Group widths="equal" >
              <Form.Dropdown
                name="primary"
                options={options}
                label="Primary group"
                placeholder="Select a study programme"
                value={primary}
                onChange={this.handleChange}
                search
                selection
              />
              <Form.Dropdown
                name="comparison"
                options={options}
                label="Comparison group"
                placeholder="Optional"
                value={comparison}
                onChange={this.handleChange}
                selection
              />
            </Form.Group>
          </Form>
        </Segment>
        <ResultTabs
          max={max}
          primary={statistics.primary}
          comparison={statistics.comparison}
          changeMode={this.changeMode}
          cumMode={this.state.cumMode}
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
  }).isRequired
}

export default SingleCourseStats
