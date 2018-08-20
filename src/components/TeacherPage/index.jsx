import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { shape, string, func } from 'prop-types'
import { connect } from 'react-redux'
import { getTeacher } from '../../redux/teachers'
import TeacherDetails from '../TeacherDetails'

class TeacherPage extends Component {
  state={
    initialized: false
  }

  async componentDidMount() {
    const { teacher, teacherid } = this.props
    if (!teacher) {
      await this.props.getTeacher(teacherid)
    }
    this.setState({ initialized: true })
  }

  render() {
    const { teacher } = this.props
    if (!this.state.initialized) {
      return null
    } else if (!teacher) {
      return <Redirect to="/teachers" />
    }
    return (
      <TeacherDetails teacher={teacher} />
    )
  }
}

TeacherPage.propTypes = {
  teacher: shape({}),
  teacherid: string.isRequired,
  getTeacher: func.isRequired
}

TeacherPage.defaultProps = {
  teacher: undefined
}

const mapStateToProps = (state, props) => {
  const { teacherid } = props
  const { items } = state.teachers
  return {
    teacher: items[teacherid]
  }
}

export default connect(mapStateToProps, { getTeacher })(TeacherPage)
