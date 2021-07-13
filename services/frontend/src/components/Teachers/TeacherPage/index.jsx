import React, { useEffect } from 'react'
import { Redirect } from 'react-router-dom'
import { shape, string, func, bool } from 'prop-types'
import { connect } from 'react-redux'
import { Segment } from 'semantic-ui-react'
import { getTeacher } from '../../../redux/teachers'
import TeacherDetails from '../TeacherDetails'

const TeacherPage = ({ teacher, teacherid, isLoading, getTeacher }) => {
  useEffect(() => {
    if (!teacher) getTeacher(teacherid)
  }, [])

  if (isLoading || !teacher) {
    return <Segment basic loading={isLoading} />
  }
  if (!teacher && !isLoading) {
    return <Redirect to="/teachers" />
  }
  return <TeacherDetails teacher={teacher} />
}

TeacherPage.propTypes = {
  teacher: shape({}),
  teacherid: string.isRequired,
  getTeacher: func.isRequired,
  isLoading: bool.isRequired
}

TeacherPage.defaultProps = {
  teacher: undefined
}

const mapStateToProps = (state, props) => {
  const { teacherid } = props
  const { items, pending } = state.teachers
  return {
    teacher: items[teacherid],
    isLoading: pending
  }
}

export default connect(mapStateToProps, { getTeacher })(TeacherPage)
