import React from 'react'
import { connect } from 'react-redux'
import { Segment, Header } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { findStudents, getStudent, selectStudent } from '../../redux/students'
import StudentSearch from './StudentSearch'
import StudentDetails from './StudentDetails'
import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import { useTitle } from '../../common/hooks'
import { toggleStudentNameVisibility } from '../../redux/settings'

const StudentStatistics = props => {
  const { match } = props
  const { studentNumber } = match.params
  useTitle('Student statistics')

  return (
    <div className="segmentContainer">
      <Header className="segmentTitle" size="large">
        Student statistics
      </Header>
      <StudentNameVisibilityToggle />
      <Segment className="contentSegment">
        <StudentSearch studentNumber={studentNumber} />
        <StudentDetails studentNumber={studentNumber} />
      </Segment>
    </div>
  )
}

const mapDispatchToProps = dispatch => ({
  toggleStudentNameVisibility,
  findStudents: searchStr => dispatch(findStudents(searchStr)),
  getStudent: studentNumber => dispatch(getStudent(studentNumber)),
  selectStudent: studentNumber => dispatch(selectStudent(studentNumber)),
})

export default withRouter(connect(null, mapDispatchToProps)(StudentStatistics))
