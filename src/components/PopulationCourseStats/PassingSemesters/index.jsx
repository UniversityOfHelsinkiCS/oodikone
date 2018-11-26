import React, { Component } from 'react'
import { Table, Checkbox } from 'semantic-ui-react'
import CourseRow from './CourseRow'

export default class PassingSemesters extends Component {
  constructor(props) {
    super(props)

    this.state = {
      cumulativeStats: true
    }
  }

  handleChange = () => {
    this.setState({ cumulativeStats: !this.state.cumulativeStats })
  }

  render() {
    const { courses } = this.props
    const { coursestatistics } = courses

    return (
      <div>
        <Checkbox
          toggle
          checked={this.state.cumulativeStats}
          onChange={this.handleChange}
          label="Show cumulative stats"
        />
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Course code</Table.HeaderCell>
              <Table.HeaderCell>Course name</Table.HeaderCell>
              <Table.HeaderCell>Students</Table.HeaderCell>
              <Table.HeaderCell>Passed</Table.HeaderCell>

              <Table.HeaderCell>Before 1st year</Table.HeaderCell>
              <Table.HeaderCell>1st fall</Table.HeaderCell>
              <Table.HeaderCell>1st spring</Table.HeaderCell>
              <Table.HeaderCell>2nd fall</Table.HeaderCell>
              <Table.HeaderCell>2nd spring</Table.HeaderCell>
              <Table.HeaderCell>3rd fall</Table.HeaderCell>
              <Table.HeaderCell>3rd spring</Table.HeaderCell>
              <Table.HeaderCell>4th fall</Table.HeaderCell>
              <Table.HeaderCell>4th spring</Table.HeaderCell>
              <Table.HeaderCell>5th year</Table.HeaderCell>
              <Table.HeaderCell>6th year</Table.HeaderCell>
              <Table.HeaderCell>Later</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {coursestatistics.map(stats => (
              <CourseRow
                key={stats.course.code}
                statistics={stats}
                cumulative={this.state.cumulativeStats}
              />
            ))}
          </Table.Body>
        </Table>
      </div>
    )
  }
}
