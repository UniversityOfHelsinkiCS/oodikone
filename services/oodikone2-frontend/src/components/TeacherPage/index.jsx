import React, { Component } from 'react'
import { Redirect } from 'react-router-dom'
import { shape, string, func, bool } from 'prop-types'
import { connect } from 'react-redux'
import { Segment } from 'semantic-ui-react'
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
    const { teacher, isLoading } = this.props
    if (!this.state.initialized || isLoading) {
      return <Segment basic loading={isLoading} />
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
