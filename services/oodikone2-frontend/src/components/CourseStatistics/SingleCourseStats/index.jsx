import React, { Component } from 'react'
import { Segment, Header, Form } from 'semantic-ui-react'
import { shape, string, arrayOf, objectOf, oneOfType, number } from 'prop-types'
import { connect } from 'react-redux'
import ResultTabs from '../ResultTabs'
import ProgrammeDropdown from '../ProgrammeDropdown'
import selectors, { ALL } from '../../../selectors/courseStats'

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
    comparison: null
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

  render() {
    const { programmes } = this.props
    const { primary, comparison } = this.selectedProgrammes()
    const statistics = this.filteredProgrammeStatistics()
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

const mapStateToProps = state => ({
  programmes: selectors.getAllStudyProgrammes(state)
})

export default connect(mapStateToProps)(SingleCourseStats)
