import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Table, Form, Input } from 'semantic-ui-react'
import { func, arrayOf, object } from 'prop-types'
import { getTranslate } from 'react-localize-redux'

class PopulationCourseStats extends Component {
  state = {
    sortBy: 'students',
    reversed: false,
    limit: ''
  }

  sortBy(criteria) {
    return () => {
      let { reversed } = this.state
      if (this.state.sortBy === 'percentage' && criteria === 'percentage') {
        reversed = !reversed
      }
      this.setState({ sortBy: criteria, reversed })
    }
  }

  criteria = () => (c1, c2) => {
    if (this.state.reversed) {
      return c1.stats[this.state.sortBy] - c2.stats[this.state.sortBy]
    }
    return c2.stats[this.state.sortBy] - c1.stats[this.state.sortBy]
  }

  limit = () => (course) => {
    if (this.state.limit === 0) {
      return true
    }
    return course.stats.students >= this.state.limit
  }

  render() {
    const { courses, translate } = this.props
    const { sortBy, reversed } = this.state
    const direction = reversed ? 'descending' : 'ascending'

    if (courses.length === 0) return null

    return (
      <div>
        <Form>
          <Form.Field inline>
            <label>{translate('populationCourses.limit')}</label>
            <Input
              value={this.state.limit}
              onChange={e => this.setState({ limit: e.target.value })}
            />
          </Form.Field>
        </Form>
        <Table celled sortable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell colSpan="2">{translate('populationCourses.course')}</Table.HeaderCell>
              <Table.HeaderCell
                rowSpan="2"
                sorted={sortBy === 'students' ? 'descending' : null}
                onClick={this.sortBy('students')}
              >
                {translate('populationCourses.students')}
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="3"
              >
                {translate('populationCourses.passed')}
              </Table.HeaderCell>
              <Table.HeaderCell
                colSpan="2"
              >
                {translate('populationCourses.failed')}
              </Table.HeaderCell>
              <Table.HeaderCell colSpan="2">{translate('populationCourses.attempts')}</Table.HeaderCell>
              <Table.HeaderCell colSpan="2">{translate('populationCourses.percentageOfPopulation')}</Table.HeaderCell>
            </Table.Row>
            <Table.Row>
              <Table.HeaderCell>{translate('populationCourses.name')}</Table.HeaderCell>
              <Table.HeaderCell>{translate('populationCourses.code')}</Table.HeaderCell>
              <Table.HeaderCell
                sorted={sortBy === 'passed' ? 'descending' : null}
                onClick={this.sortBy('passed')}
              >
                {translate('populationCourses.number')}
              </Table.HeaderCell>
              <Table.HeaderCell
                sorted={sortBy === 'retryPassed' ? 'descending' : null}
                onClick={this.sortBy('retryPassed')}
              >
                {translate('populationCourses.passedAfterRetry')}
              </Table.HeaderCell>
              <Table.HeaderCell
                sorted={sortBy === 'percentage' ? direction : null}
                onClick={this.sortBy('percentage')}
              >
                {translate('populationCourses.percentage')}
              </Table.HeaderCell>

              <Table.HeaderCell
                sorted={sortBy === 'failed' ? 'descending' : null}
                onClick={this.sortBy('failed')}
              >
                {translate('populationCourses.number')}
              </Table.HeaderCell>
              <Table.HeaderCell
                rowSpan="2"
                sorted={sortBy === 'failedMany' ? 'descending' : null}
                onClick={this.sortBy('failedMany')}
              >
                {translate('populationCourses.failedManyTimes')}
              </Table.HeaderCell>
              <Table.HeaderCell>{translate('populationCourses.number')}</Table.HeaderCell>
              <Table.HeaderCell>
                {translate('populationCourses.perStudent')}
              </Table.HeaderCell>
              <Table.HeaderCell>{translate('populationCourses.passed')}</Table.HeaderCell>
              <Table.HeaderCell>{translate('populationCourses.attempted')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {courses.sort(this.criteria()).filter(this.limit()).map(course => (
              <Table.Row key={course.course.code}>
                <Table.Cell>{course.course.name} </Table.Cell>
                <Table.Cell>{course.course.code}</Table.Cell>
                <Table.Cell>{course.stats.passed + course.stats.failed}</Table.Cell>
                <Table.Cell>{course.stats.passed}</Table.Cell>
                <Table.Cell>{course.stats.retryPassed}</Table.Cell>
                <Table.Cell>{course.stats.percentage} %</Table.Cell>
                <Table.Cell>{course.stats.failed}</Table.Cell>
                <Table.Cell>{course.stats.failedMany}</Table.Cell>
                <Table.Cell>{course.stats.attempts}</Table.Cell>
                <Table.Cell>
                  {(course.stats.attempts / (course.stats.passed + course.stats.failed)).toFixed(2)}
                </Table.Cell>
                <Table.Cell>{course.stats.passedOfPopulation} %</Table.Cell>
                <Table.Cell>{course.stats.triedOfPopulation} %</Table.Cell>
              </Table.Row>))}

          </Table.Body>
        </Table>
      </div>
    )
  }
}

PopulationCourseStats.propTypes = {
  courses: arrayOf(object).isRequired,
  translate: func.isRequired
}

const mapStateToProps = state => ({
  translate: getTranslate(state.locale)
})

const mapDispatchToProps = () => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PopulationCourseStats)
