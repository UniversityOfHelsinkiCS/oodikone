import React, { Component } from 'react'
import { connect } from 'react-redux'
import { string, arrayOf, object, func, bool, shape } from 'prop-types'
import { Header, Segment, Table, Button } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'

import { toggleStudentListVisibility } from '../../redux/settings'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'


class PopulationStudents extends Component {
  renderStudentTable() {
    if (!this.props.showList) {
      return null
    }

    const students = this.props.samples[0].reduce((obj, s) => {
      obj[s.studentNumber] = s
      return obj
    }, {})

    const byName = (s1, s2) =>
      (students[s1].lastname < students[s2].lastname ? -1 : 1)

    const creditsSinceStart = studentNumber => students[studentNumber].courses
      .filter(c => c.passed)
      .reduce((s, c) => s + c.credits, 0)

    const pushToHistoryFn = studentNumber => this.props.history.push(`/students/${studentNumber}`)

    return (
      <div>
        <StudentNameVisibilityToggle />
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                student number
              </Table.HeaderCell>
              {this.props.showNames ? (
                <Table.HeaderCell>
                  last name
                </Table.HeaderCell>
              ) : null}
              {this.props.showNames ? (
                <Table.HeaderCell>
                  first names
                </Table.HeaderCell>
              ) : null}
              <Table.HeaderCell>
                credits since start
              </Table.HeaderCell>
              <Table.HeaderCell>
                all credits
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.props.selectedStudents.sort(byName).map(studentNumber => (
              <Table.Row key={studentNumber} onClick={() => pushToHistoryFn(studentNumber)}>
                <Table.Cell>
                  {studentNumber}
                </Table.Cell>
                { this.props.showNames ? (
                  <Table.Cell>
                    {students[studentNumber].lastname}
                  </Table.Cell>
                ) : null }
                {this.props.showNames ? (
                  <Table.Cell>
                    {students[studentNumber].firstnames}
                  </Table.Cell>
                ) : null}
                <Table.Cell>
                  {creditsSinceStart(studentNumber)}
                </Table.Cell>
                <Table.Cell>
                  {students[studentNumber].credits}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

    )
  }

  render() {
    if (this.props.samples.length === 0) {
      return null
    }

    const toggleLabel = this.props.showList ? 'hide' : 'show'

    return (
      <Segment>
        <Header>Students</Header>
        <Button onClick={() => this.props.toggleStudentListVisibility()}>
          {toggleLabel}
        </Button>
        {this.renderStudentTable()}
      </Segment>
    )
  }
}

PopulationStudents.propTypes = {
  samples: arrayOf(object).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  toggleStudentListVisibility: func.isRequired,
  showNames: bool.isRequired,
  showList: bool.isRequired,
  history: shape({}).isRequired
}

const mapStateToProps = state => ({
  showNames: state.settings.namesVisible,
  showList: state.settings.studentlistVisible
})

export default connect(
  mapStateToProps,
  { toggleStudentListVisibility }
)(withRouter(PopulationStudents))
