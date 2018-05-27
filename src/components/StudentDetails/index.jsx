import React, { Component } from 'react'
import { func, shape, string, boolean, arrayOf, integer } from 'prop-types'
import { connect } from 'react-redux'
import { Segment } from 'semantic-ui-react'
import { isEmpty } from 'lodash'

import StudentInfoCard from '../StudentInfoCard'
import CreditAccumulationGraph from '../CreditAccumulationGraph'
import SearchResultTable from '../SearchResultTable'
import { removeInvalidCreditsFromStudent, byDateDesc, reformatDate } from '../../common'

import sharedStyles from '../../styles/shared'

class StudentDetails extends Component {
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
        date, grade, credits, course
      } = c
      return {
        date, course: `${course.name} (${course.code})`, grade, credits
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

  render() {
    const { translate, student } = this.props
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
        {this.renderCourseParticipation()}
      </Segment>
    )
  }
}

StudentDetails.propTypes = {
  translate: func.isRequired,
  student: shape({
    courses: arrayOf(shape({
      course: shape({
        code: string,
        name: string
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
  student: {}
}

const mapStateToProps = ({ students }) => ({
  student: students.data.find(student =>
    student.studentNumber === students.selected)
})

export default connect(mapStateToProps)(StudentDetails)
