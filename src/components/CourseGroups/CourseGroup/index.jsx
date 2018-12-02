import React, { Component, Fragment } from 'react'
import { Segment, Header, Button, Statistic } from 'semantic-ui-react'
import { string, func, shape } from 'prop-types'
import { withRouter } from 'react-router'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'
import { callApi } from '../../../apiConnection'
import Teachers from './teachers'
import Courses from './courses'

import styles from './courseGroup.css'

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
      isLoading: false
    })
  }

  onTeacherFilterClick = (teacherId) => {
    const { teachers } = this.state
    const newTeachers = [...teachers]
    const index = newTeachers.findIndex(t => t.id === teacherId)
    newTeachers[index].isActive = !newTeachers[index].isActive
    this.setState({ teachers: newTeachers })
  }

  renderStatistics = () => {
    const { totalCredits, totalStudents, totalCourses, teachers, isLoading } = this.state
    if (isLoading) {
      return null
    }

    const totalTeachers = teachers.length

    const getStatistic = (label, value) => (
      <Statistic className={styles.groupStatistic}>
        <Statistic.Label>{label}</Statistic.Label>
        <Statistic.Value>{value}</Statistic.Value>
      </Statistic>
    )

    return (
      <Statistic.Group className={styles.groupStatistics}>
        {getStatistic('Total teachers', totalTeachers)}
        {getStatistic('Total students', totalStudents)}
        {getStatistic('Total courses', totalCourses)}
        {getStatistic('Total credits', totalCredits)}
      </Statistic.Group>
    )
  }

  renderTeachersAndCourses = () => {
    const { teachers, isLoading } = this.state
    if (isLoading) {
      return null
    }

    const getTeacherIds = teacers => teacers.map(t => t.id)

    const activeTeachers = teachers.filter(t => t.isActive)
    const hasActiveTeachers = activeTeachers.length > 0
    const teacherIds = hasActiveTeachers
      ? getTeacherIds(activeTeachers)
      : getTeacherIds(teachers)

    return (
      <Segment>
        <Teachers teachers={teachers} onFilterClickFn={this.onTeacherFilterClick} />
        <Courses teacherIds={teacherIds} />
      </Segment>
    )
  }

  render() {
    const { history } = this.props
    const { isLoading, name } = this.state

    const navigateTo = route => history.push(getCompiledPath(route, {}))

    return (
      <Fragment>
        <Segment loading={isLoading}>
          <Header size="medium" className={styles.headerWithControl}>
            {name}
            <Button
              icon="reply"
              onClick={() => navigateTo(routes.courseGroups.route)}
              className={styles.iconButton}
            />
          </Header>
          {this.renderStatistics()}
        </Segment>
        {this.renderTeachersAndCourses()}
      </Fragment>
    )
  }
}

export default withRouter(CourseGroup)
