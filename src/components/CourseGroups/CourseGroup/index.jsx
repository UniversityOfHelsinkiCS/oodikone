import React, { Component, Fragment } from 'react'
import { Segment, Header, Button } from 'semantic-ui-react'
import { string, func, shape } from 'prop-types'
import { withRouter } from 'react-router'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'
import { callApi } from '../../../apiConnection'
import Teachers from './teachers'
import Courses from './courses'

import styles from './courseGroup.css'
import Statistics from './statistics'

class CourseGroup extends Component {
  static propTypes = {
    groupId: string.isRequired,
    history: shape({
      push: func.isRequired
    }).isRequired
  }

  state = {
    isLoading: true
  }

  async componentDidMount() {
    const { groupId } = this.props

    const response = await callApi(`courseGroups/${groupId}`)

    const { name, totalCredits, totalStudents, totalCourses, teachers } = response.data
    this.setState({
      name,
      totalCredits,
      totalStudents,
      totalCourses,
      teachers,
      isLoading: false,
      showOnlyActiveTeachers: false
    })
  }

  onTeacherActiveToggleChange = () => {
    const { showOnlyActiveTeachers } = this.state
    this.setState({ showOnlyActiveTeachers: !showOnlyActiveTeachers })
  }

  onTeacherFilterClick = (teacherId) => {
    const { teachers, showOnlyActiveTeachers } = this.state
    this.setState({ isLoading: true }, () => {
      const newTeachers = [...teachers]
      const index = newTeachers.findIndex(t => t.id === teacherId)
      newTeachers[index].isActive = !newTeachers[index].isActive
      const activeTeachers = newTeachers.filter(t => t.isActive).length
      const resetActiveTeachers = showOnlyActiveTeachers && activeTeachers === 0

      this.setState({
        teachers: newTeachers,
        isLoading: false,
        showOnlyActiveTeachers: resetActiveTeachers ? false : showOnlyActiveTeachers
      })
    })
  }

  renderTeachersAndCourses = () => {
    const { teachers, isLoading, showOnlyActiveTeachers } = this.state
    if (isLoading) {
      return null
    }

    const getTeacherIds = teach => teach.map(t => t.id)

    const activeTeachers = teachers.filter(t => t.isActive)
    const hasActiveTeachers = activeTeachers.length > 0
    const teacherIds = hasActiveTeachers
      ? getTeacherIds(activeTeachers)
      : getTeacherIds(teachers)

    return (
      <Fragment>
        <Teachers
          teachers={teachers}
          onFilterClickFn={this.onTeacherFilterClick}
          onActiveToggleChangeFn={this.onTeacherActiveToggleChange}
          showOnlyActiveTeachers={showOnlyActiveTeachers}

        />
        <Courses teacherIds={teacherIds} />
      </Fragment>
    )
  }

  render() {
    const { history } = this.props
    const { totalStudents, totalCourses, totalCredits, teachers, isLoading, name } = this.state

    const navigateTo = route => history.push(getCompiledPath(route, {}))

    return (
      <Segment loading={isLoading}>
        <Header size="medium" className={styles.headerWithControl}>
          {name}
          <Button
            icon="reply"
            onClick={() => navigateTo(routes.courseGroups.route)}
            className={styles.iconButton}
          />
        </Header>
        <Statistics
          isLoading={isLoading}
          totalCourses={totalCourses}
          teachers={teachers}
          totalStudents={totalStudents}
          totalCredits={totalCredits}
        />
        {this.renderTeachersAndCourses()}
      </Segment>
    )
  }
}

export default withRouter(CourseGroup)
