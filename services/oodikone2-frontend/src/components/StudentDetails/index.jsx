import React, { Component } from 'react'
import { func, shape, string, boolean, arrayOf, integer } from 'prop-types'
import { connect } from 'react-redux'
import { Segment, Table, Icon } from 'semantic-ui-react'
import { isEmpty, sortBy } from 'lodash'
import moment from 'moment'
import qs from 'query-string'
import { withRouter } from 'react-router-dom'
import { getStudent, removeStudentSelection, resetStudent } from '../../redux/students'
import StudentInfoCard from '../StudentInfoCard'
import CreditAccumulationGraph from '../CreditAccumulationGraph'
import SearchResultTable from '../SearchResultTable'
import { byDateDesc, reformatDate, getTextIn } from '../../common'
import { clearCourseStats } from '../../redux/coursestats'


class StudentDetails extends Component {
  componentDidMount() {
    this.props.history.listen((location, action) => {
      if (action === 'POP' || location.pathname !== '/students') {
        this.props.resetStudent()
        this.props.removeStudentSelection()
      }
    })
  }

  componentDidUpdate() {
    if (isEmpty(this.props.student) && this.props.studentNumber) {
      this.props.getStudent(this.props.studentNumber)
    }
  }

  pushQueryToUrl = (query) => {
    const { history } = this.props
    const { courseCodes, ...rest } = query
    const queryObject = { ...rest, courseCodes: JSON.stringify(courseCodes) }
    const searchString = qs.stringify(queryObject)
    this.props.clearCourseStats()
    history.push('/coursestatistics/')
    history.push({ search: searchString })
  }

  renderCreditsGraph = () => {
    const { translate, student } = this.props
    return (
      <CreditAccumulationGraph
        students={[student]}
        selectedStudents={[student.studentNumber]}
        title={translate('studentStatistics.chartTitle')}
        translate={translate}
        maxCredits={0}
      />
    )
  }

  renderCourseParticipation = () => {
    const { translate, student, language } = this.props

    const courseHeaders = [
      translate('common.date'),
      translate('common.course'),
      translate('common.grade'),
      translate('common.credits'),
      ''
    ]
    const courseRows = student.courses.sort(byDateDesc).map((c) => {
      const {
        date, grade, credits, course, isStudyModuleCredit, passed
      } = c
      let icon = null
      if (isStudyModuleCredit) {
        icon = <Icon name="certificate" color="purple" />
      } else if (passed) {
        icon = <Icon name="check circle outline" color="green" />
      } else {
        icon = <Icon name="circle outline" color="red" />
      }
      const year = -(moment(new Date('1.1.1950')).diff(new Date(date), 'years') - 1) // :D
      return [
        reformatDate(date, 'DD.MM.YYYY'),
        `${isStudyModuleCredit ? `${getTextIn(course.name, language)} [Study Module]` : getTextIn(course.name, language)} (${course.code})`,
        <div>{icon}{grade}</div>,
        credits,
        <Icon style={{ cursor: 'pointer' }} name="arrow up" onClick={() => this.pushQueryToUrl({ courseCodes: [course.code], separate: false, fromYear: year, toYear: year })} />
      ]
    })
    return (
      <SearchResultTable
        headers={courseHeaders}
        rows={courseRows}
        noResultText={translate('common.noResults')}
      />
    )
  }

  renderStudyRights = () => {
    const { student, language } = this.props
    const studyRightHeaders = ['Degree', 'Programme', 'Study Track', 'Graduated']
    const studyRightRows = student.studyrights.map((studyright) => {
      const degrees = sortBy(studyright.studyrightElements, 'enddate').filter(e => e.element_detail.type === 10)
        .map(degree => ({
          startdate: degree.startdate,
          enddate: degree.enddate,
          name: getTextIn(degree.element_detail.name, language),
          graduateionDate: degree.graduationDate,
          canceldate: degree.canceldate
        }))
      const programmes = sortBy(studyright.studyrightElements, 'enddate').filter(e => e.element_detail.type === 20)
        .map(programme => ({
          startdate: programme.startdate,
          enddate: programme.enddate,
          name: getTextIn(programme.element_detail.name, language)
        }))
      const studytracks = sortBy(studyright.studyrightElements, 'enddate').filter(e => e.element_detail.type === 30)
        .map(studytrack => ({
          startdate: studytrack.startdate,
          enddate: studytrack.enddate,
          name: getTextIn(studytrack.element_detail.name, language)
        }))
      return {
        studyrightid: studyright.studyrightid,
        graduated: studyright.graduated,
        canceldate: studyright.canceldate,
        enddate: studyright.enddate,
        elements: { degrees, programmes, studytracks }
      }
    })

    const filterDuplicates = (elem1, index, array) => {
      for (let i = 0; i < array.length; i++) {
        const elem2 = array[i]
        if (elem1.name === elem2.name &&
          ((elem1.startdate > elem2.startdate && elem1.enddate <= elem2.enddate) ||
            (elem1.enddate < elem2.enddate && elem1.startdate >= elem2.startdate))) {
          return false
        }
      }
      return true
    }

    return (
      <Table>
        <Table.Header>
          <Table.Row>
            {studyRightHeaders.map((header, index) => (
              <Table.HeaderCell key={index}/* eslint-disable-line */>
                {header}
              </Table.HeaderCell>
            ))
            }
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {studyRightRows.map((c) => {
            if (c.elements.programmes.length > 0 || c.elements.degrees.length > 0) {
              return (
                <Table.Row key={c.studyrightid}>
                  <Table.Cell verticalAlign="middle">
                    {c.elements.degrees.filter(filterDuplicates).map(degree => (
                      <p key={degree.name}>{`${degree.name} (${reformatDate(degree.startdate, 'DD.MM.YYYY')} - ${reformatDate(degree.enddate, 'DD.MM.YYYY')})`} <br /> </p>
                    ))}
                  </Table.Cell>
                  <Table.Cell>
                    {c.elements.programmes.filter(filterDuplicates).map(programme => (
                      <p key={programme.name}>{`${programme.name} (${reformatDate(programme.startdate, 'DD.MM.YYYY')} - ${reformatDate(programme.enddate, 'DD.MM.YYYY')})`}<br /> </p>
                    ))}
                  </Table.Cell>
                  <Table.Cell>
                    {c.elements.studytracks.filter(filterDuplicates).map(studytrack => (
                      <p key={studytrack.name}>{`${studytrack.name} (${reformatDate(studytrack.startdate, 'DD.MM.YYYY')} - ${reformatDate(studytrack.enddate, 'DD.MM.YYYY')})`}<br /> </p>
                    ))}
                  </Table.Cell>
                  <Table.Cell>
                    {c.canceldate ? // eslint-disable-line
                      <div><p style={{ color: 'red', fontWeight: 'bold' }}>CANCELED</p></div>
                      :
                      c.graduated ?
                        <div><Icon name="check circle outline" color="green" /><p>{reformatDate(c.enddate, 'DD.MM.YYYY')}</p></div>
                        :
                        <div><Icon name="circle outline" color="red" /><p>{reformatDate(c.enddate, 'DD.MM.YYYY')}</p></div>
                    }

                  </Table.Cell>
                </Table.Row>
              )
            }
            return null
          })}
        </Table.Body>
      </Table>
    )
  }

  render() {
    const { translate, student, studentNumber } = this.props
    if (!studentNumber) {
      return null
    }
    if (isEmpty(student)) {
      return null
    }
    return (
      <Segment className="contentSegment" >
        <StudentInfoCard
          student={student}
          translate={translate}
        />
        {this.renderCreditsGraph()}
        {this.renderStudyRights()}
        {this.renderCourseParticipation()}
      </Segment>
    )
  }
}

StudentDetails.propTypes = {
  language: string.isRequired,
  getStudent: func.isRequired,
  history: shape({}).isRequired,
  resetStudent: func.isRequired,
  removeStudentSelection: func.isRequired,
  studentNumber: string,
  translate: func.isRequired,
  clearCourseStats: func.isRequired,
  student: shape({
    courses: arrayOf(shape({
      course: shape({
        code: string,
        name: Object
      }),
      credits: integer,
      date: string,
      grade: string,
      passed: boolean
    })),
    credits: integer,
    fetched: boolean,
    started: string,
    studentNumber: string,
    tags: arrayOf(string)
  })
}

StudentDetails.defaultProps = {
  student: {},
  studentNumber: ''
}

const mapStateToProps = ({ students, settings }) => ({
  language: settings.language,
  student: students.data.find(student =>
    student.studentNumber === students.selected)
})
const mapDispatchToProps = dispatch => ({
  removeStudentSelection: () => dispatch(removeStudentSelection()),
  clearCourseStats: () => dispatch(clearCourseStats()),
  resetStudent: () => dispatch(resetStudent()),
  getStudent: studentNumber =>
    dispatch(getStudent(studentNumber))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StudentDetails))
