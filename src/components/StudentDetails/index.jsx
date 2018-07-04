import React, { Component } from 'react'
import { func, shape, string, boolean, arrayOf, integer } from 'prop-types'
import { connect } from 'react-redux'
import { Segment } from 'semantic-ui-react'
import { isEmpty } from 'lodash'
import { withRouter } from 'react-router-dom'

import { getStudent, removeStudentSelection, resetStudent } from '../../redux/students'
import StudentInfoCard from '../StudentInfoCard'
import CreditAccumulationGraph from '../CreditAccumulationGraph'
import SearchResultTable from '../SearchResultTable'
import { removeInvalidCreditsFromStudent, byDateDesc, reformatDate } from '../../common'

import sharedStyles from '../../styles/shared'

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

  renderCreditsGraph = () => {
    const { translate, student } = this.props

    const filteredStudent = removeInvalidCreditsFromStudent(student)
    return (
      <CreditAccumulationGraph
        students={[filteredStudent]}
        selectedStudents={[filteredStudent.studentNumber]}
        title={translate('studentStatistics.chartTitle')}
        translate={translate}
        maxCredits={0}
      />
    )
  }

  renderCourseParticipation = () => {
    const { translate, student } = this.props

    const courseHeaders = [
      translate('common.date'),
      translate('common.course'),
      translate('common.grade'),
      translate('common.credits')
    ]
    const courseRows = student.courses.map((c) => {
      const {
        date, grade, credits, course, isStudyModuleCredit
      } = c
      return {
        date, course: `${isStudyModuleCredit ? `${course.name.fi} [Study Module]` : course.name.fi} (${course.code})`, grade, credits
      }
    })
    return (
      <SearchResultTable
        headers={courseHeaders}
        rows={courseRows.sort(byDateDesc).map(c => ({
          ...c,
          date: reformatDate(c.date, 'DD.MM.YYYY')
        }))}
        noResultText={translate('common.noResults')}
      />
    )
  }

  renderStudyRights = () => {
    const { translate, student } = this.props
    const studyRightHeaders = ['Starting date', 'Degree', 'Graduated']
    const studyRightRows = student.studyrights.filter(studyright =>
      studyright.highlevelname.toLowerCase() !== 'undefined').map((studyright) => {
      const {
        startdate, highlevelname, graduated, enddate, canceldate
      } = studyright
      return {
        startdate, highlevelname, graduated, enddate, canceldate
      }
    })

    return (
      <SearchResultTable
        headers={studyRightHeaders}
        rows={studyRightRows.map(c => ({
          date: reformatDate(c.startdate, 'DD.MM.YYYY'),
          highlevelname: c.highlevelname,
          graduated: `${c.graduated ? 'Yes' : 'No'} (${c.canceldate ? reformatDate(c.canceldate, 'DD.MM.YYYY') : reformatDate(c.enddate, 'DD.MM.YYYY')})`
        }))}
        noResultText={translate('common.noResults')}
      />
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
      <Segment className={sharedStyles.contentSegment} >
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
  getStudent: func.isRequired,
  history: shape({}).isRequired,
  resetStudent: func.isRequired,
  removeStudentSelection: func.isRequired,
  studentNumber: string,
  translate: func.isRequired,
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

const mapStateToProps = ({ students }) => ({
  student: students.data.find(student =>
    student.studentNumber === students.selected)
})
const mapDispatchToProps = dispatch => ({
  removeStudentSelection: () => dispatch(removeStudentSelection()),
  resetStudent: () => dispatch(resetStudent()),
  getStudent: studentNumber =>
    dispatch(getStudent(studentNumber))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StudentDetails))
