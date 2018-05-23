import React, { Component } from 'react'
import { connect } from 'react-redux'
import { string, arrayOf, object } from 'prop-types'
import { Header, Segment, Table, Button, Radio } from 'semantic-ui-react'
import { makePopulationsToData } from '../../selectors/populationDetails'
import { toggleStudentNameVisibility } from '../../redux/settings'

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

    const radioLabel = this.props.showNames ? 'Student names visible' : 'Student names hidden'

    return (
      <div>
        <div style={{ marginTop: 15, marginBottom: 10 }}>
          <Radio
            toggle
            label={radioLabel}
            onClick={() => this.props.toggleStudentNameVisibility()}
          />
        </div>
        <Table>
          <Table.Body>
            {this.props.selectedStudents.sort(byName).map(studentNumber => (
              <Table.Row key={studentNumber}>
                <Table.Cell>
                  <a href={`/students/${studentNumber}`} target="_blank">{studentNumber}</a>
                </Table.Cell>
                <Table.Cell>
                  {this.props.showNames ? students[studentNumber].lastname : ''}
                </Table.Cell>
                <Table.Cell>
                  {this.props.showNames ? students[studentNumber].firstnames : ''}
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
      all,
    showNames: state.settings.namesVisible
  }
}

export default connect(mapStateToProps, { toggleStudentNameVisibility })(PopulationStudents)
