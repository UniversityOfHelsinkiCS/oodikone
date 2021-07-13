import React from 'react'
import { connect } from 'react-redux'
import { shape, string, arrayOf } from 'prop-types'
import { Segment, Header, Message } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { findStudents, getStudent, selectStudent } from '../../redux/students'
import StudentSearch from './StudentSearch'
import StudentDetails from './StudentDetails'
import StudentNameVisibilityToggle from '../StudentNameVisibilityToggle'
import { useTitle } from '../../common/hooks'
import { getUserRoles, checkUserAccess } from '../../common'
import { toggleStudentNameVisibility } from '../../redux/settings'
import sisDestructionStyle from '../../common/sisDestructionStyle'

const StudentStatistics = props => {
  const { match, userRoles, rights } = props
  const { studentNumber } = match.params

  useTitle('Student statistics')
  checkUserAccess(['student', 'admin'], userRoles)

  if (!checkUserAccess(['student', 'admin'], userRoles) && rights.length < 1)
    return (
      <div className="segmentContainer">
        <Message
          error
          color="red"
          header="You have no rights to access any data. If you should have access please contact grp-toska@helsinki.fi"
        />
      </div>
    )

  return (
    <div className="segmentContainer" style={sisDestructionStyle}>
      <Header className="segmentTitle" size="large">
        Student statistics
      </Header>
      <StudentNameVisibilityToggle />
      <Segment className="contentSegment" style={sisDestructionStyle}>
        <StudentSearch studentNumber={studentNumber} />
        <StudentDetails studentNumber={studentNumber} />
      </Segment>
    </div>
  )
}

StudentStatistics.propTypes = {
  match: shape({
    params: shape({
      studentNumber: string,
    }),
  }),
  userRoles: arrayOf(string).isRequired,
  rights: arrayOf(string).isRequired,
}

StudentStatistics.defaultProps = {
  match: {
    params: { studentNumber: undefined },
  },
}

const mapStateToProps = ({
  students,
  auth: {
    token: { roles, rights },
  },
}) => ({
  userRoles: getUserRoles(roles),
  rights,
  student: students.data.find(student => student.studentNumber === students.selected),
})
const mapDispatchToProps = dispatch => ({
  toggleStudentNameVisibility,
  findStudents: searchStr => dispatch(findStudents(searchStr)),
  getStudent: studentNumber => dispatch(getStudent(studentNumber)),
  selectStudent: studentNumber => dispatch(selectStudent(studentNumber)),
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StudentStatistics))
