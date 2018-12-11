import React, { Component } from 'react'
import { connect } from 'react-redux'
import { string, arrayOf, object, func, bool, shape } from 'prop-types'
import { Header, Segment, Table, Button, Icon, Popup } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { getStudentTotalCredits, copyToClipboard } from '../../common'

import { toggleStudentListVisibility } from '../../redux/settings'

import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import styles from '../PopulationCourseStats/populationCourseStats.css'

const popupTimeoutLength = 1000


class PopulationStudents extends Component {
  state = {}

  handlePopupOpen = (id) => {
    this.setState({ [id]: true })

    this.timeout = setTimeout(() => {
      this.setState({ [id]: false })
    }, popupTimeoutLength)
  }

  handlePopupClose = (id) => {
    this.setState({ [id]: false })
    clearTimeout(this.timeout)
  }

  renderStudentTable() {
    if (!this.props.showList) {
      return null
    }

    const students = this.props.samples.reduce((obj, s) => {
      obj[s.studentNumber] = s
      return obj
    }, {})

    const byName = (s1, s2) =>
      (students[s1].lastname < students[s2].lastname ? -1 : 1)

    const creditsSinceStart = studentNumber => getStudentTotalCredits(students[studentNumber])

    const pushToHistoryFn = studentNumber => this.props.history.push(`/students/${studentNumber}`)

    const copyToClipboardAll = () => {
      const studentsInfo = this.props.selectedStudents.map(number => students[number])
      const emails = studentsInfo.filter(s => s.email).map(s => s.email)
      const clipboardString = emails.join('; ')
      copyToClipboard(clipboardString)
    }

    const transferFrom = s => (s.previousRights[0].element_detail.name[this.props.language])

    return (
      <div>
        <StudentNameVisibilityToggle />
        <Table celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell colSpan={2}>
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
              <Table.HeaderCell>
                transferred from
              </Table.HeaderCell>
              {this.props.showNames ? (
                <Table.HeaderCell>
                  email
                  <Popup
                    trigger={
                      <Icon
                        link
                        name="copy"
                        onClick={copyToClipboardAll}
                        style={{ float: 'right' }}
                      />}
                    content="Copied email list!"
                    on="click"
                    open={this.state['0']}
                    onClose={() => this.handlePopupClose('0')}
                    onOpen={() => this.handlePopupOpen('0')}
                    position="top right"
                  />
                </Table.HeaderCell>
              ) : null}

            </Table.Row>
          </Table.Header>
          <Table.Body>
            {this.props.selectedStudents.sort(byName).map(studentNumber => (
              <Table.Row key={studentNumber} >
                <Table.Cell>
                  {studentNumber}
                </Table.Cell>
                <Table.Cell
                  icon="level up alternate"
                  onClick={() => pushToHistoryFn(studentNumber)}
                  className={styles.iconCell}
                  collapsing
                />
                {this.props.showNames ? (
                  <Table.Cell>
                    {students[studentNumber].lastname}
                  </Table.Cell>
                ) : null}
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
                <Table.Cell>
                  {students[studentNumber].transferredStudyright ? transferFrom(students[studentNumber]) : ''}
                </Table.Cell>
                {this.props.showNames ? (
                  <Table.Cell>
                    {students[studentNumber].email}
                    {students[studentNumber].email
                      ? <Popup
                        trigger={
                          <Icon
                            link
                            name="copy outline"
                            onClick={() => copyToClipboard(students[studentNumber].email)}
                            style={{ float: 'right' }}
                          />}
                        content="Email copied!"
                        on="click"
                        open={this.state[studentNumber]}
                        onClose={() => this.handlePopupClose(studentNumber)}
                        onOpen={() => this.handlePopupOpen(studentNumber)}
                        position="top right"
                      />
                      : null}
                  </Table.Cell>
                ) : null}
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
        <Header>Students ({this.props.selectedStudents.length})</Header>
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
  language: string.isRequired,
  history: shape({}).isRequired
}

const mapStateToProps = ({ settings }) => ({
  showNames: settings.namesVisible,
  showList: settings.studentlistVisible,
  language: settings.language
})

export default connect(
  mapStateToProps,
  { toggleStudentListVisibility }
)(withRouter(PopulationStudents))
