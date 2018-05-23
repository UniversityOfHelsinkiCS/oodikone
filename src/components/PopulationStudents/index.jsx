import React, { Component } from 'react'
import { connect } from 'react-redux'
import { string, arrayOf, object } from 'prop-types'
import { Header, Segment, Table, Button } from 'semantic-ui-react'
import { makePopulationsToData } from '../../selectors/populationDetails'

class PopulationStudents extends Component {
  state = {
    visible: false
  }

  renderStudentTable() {
    if (!this.state.visible) {
      return null
    }

    const students = this.props.samples[0].reduce((obj, s) => {
      obj[s.studentNumber] = s
      return obj
    }, {})

    const byName = (s1, s2) =>
      (students[s1].lastname < students[s2].lastname ? -1 : 1)

    return (
      <Table>
        <Table.Body>
          {this.props.selectedStudents.sort(byName).map(studentNumber => (
            <Table.Row key={studentNumber}>
              <Table.Cell>
                {studentNumber}
              </Table.Cell>
              <Table.Cell>
                {students[studentNumber].lastname}
              </Table.Cell>
              <Table.Cell>
                {students[studentNumber].firstnames}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    )
  }

  render() {
    if (this.props.samples.length === 0) {
      return null
    }

    const toggleLabel = this.state.visible ? 'hide' : 'show'

    return (
      <Segment>
        <Header>Students</Header>
        <Button onClick={() => this.setState({ visible: !this.state.visible })}>
          {toggleLabel}
        </Button>
        {this.renderStudentTable()}
      </Segment>
    )
  }
}

PopulationStudents.propTypes = {
  samples: arrayOf(arrayOf(object)).isRequired,
  selectedStudents: arrayOf(string).isRequired
}

const populationsToData = makePopulationsToData()

const mapStateToProps = (state) => {
  const allSamples = populationsToData(state)

  const all = allSamples.length > 0 ? allSamples[0].map(s => s.studentNumber) : []

  return {
    samples: allSamples,
    selectedStudents: state.populationLimit ?
      state.populationLimit.course.students[state.populationLimit.field] :
      all
  }
}

export default connect(mapStateToProps)(PopulationStudents)
