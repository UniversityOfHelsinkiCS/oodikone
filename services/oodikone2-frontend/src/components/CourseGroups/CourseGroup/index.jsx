import React, { Component, Fragment } from 'react'
import { Segment, Header, Button, Placeholder } from 'semantic-ui-react'
import { string, func, shape } from 'prop-types'
import { withRouter } from 'react-router'

import { getCompiledPath } from '../../../common'
import { routes } from '../../../constants'
import { callApi } from '../../../apiConnection'
import Teachers from './Teachers'
import Courses from './Courses'
import Statistics from './Statistics'

import styles from './courseGroup.css'

import AcademicYearFilter from './academicYearFilter'
import { CG_API_BASE_PATH } from './util'

class CourseGroup extends Component {
  static propTypes = {
    groupId: string.isRequired,
    history: shape({
      push: func.isRequired
    }).isRequired,
    studyProgrammeId: string.isRequired
  }

  state = {
    isLoading: true,
    teachers: [],
    activeTeacherIds: []
  }

  async componentDidMount() {
    const { groupId } = this.props
    const [courseGroup, academicYears] = await Promise.all([
      callApi(`${CG_API_BASE_PATH}/${groupId}`),
      callApi(`${CG_API_BASE_PATH}/academic-years`)
    ])

    const { name, totalCredits, totalStudents, totalCourses, teachers, semester } = courseGroup.data

    this.setState({
      academicYears: academicYears.data,
      semesterCode: semester,
      name,
      totalCredits,
      totalStudents,
      totalCourses,
      teachers,
      isLoading: false,
      showOnlyActiveTeachers: false
    })
  }

  handleSemesterCodeChange = (e, { value }) => {
    const { groupId } = this.props

    this.setState(
      { semesterCode: value, isLoading: true },
      () => callApi(`${CG_API_BASE_PATH}/${groupId}/?semester=${value}`)
        .then(({ data }) => {
          const { totalCredits, totalStudents, totalCourses, teachers } = data

          this.setState({
            isLoading: false,
            totalCredits,
            totalStudents,
            totalCourses,
            teachers
          })
        })
    )
  }

  handleTeacherActiveToggleChange = () => {
    const { showOnlyActiveTeachers } = this.state
    this.setState({ showOnlyActiveTeachers: !showOnlyActiveTeachers })
  }

  handleTeacherFilterClick = (teacherId) => {
    const { showOnlyActiveTeachers, activeTeacherIds } = this.state
    this.setState({ isLoading: true }, () => {
      const isActiveTeacher = activeTeacherIds.includes(teacherId)

      const newActiveTeachers = isActiveTeacher
        ? activeTeacherIds.filter(id => id !== teacherId)
        : [...activeTeacherIds, teacherId]

      const resetActiveTeachers = showOnlyActiveTeachers && newActiveTeachers.length === 0

      this.setState({
        activeTeacherIds: newActiveTeachers,
        isLoading: false,
        showOnlyActiveTeachers: resetActiveTeachers ? false : showOnlyActiveTeachers
      })
    })
  }

  renderTeachersAndCourses = () => {
    const { teachers, isLoading, showOnlyActiveTeachers, semesterCode, activeTeacherIds } = this.state
    if (isLoading) {
      const lineKeys = [1, 2, 3, 4]
      return (
        <Placeholder>
          {lineKeys.map(k => <Placeholder.Line key={k} length="full" />)}
        </Placeholder>)
    }

    const getTeacherIds = teach => teach.map(t => t.id)

    const hasActiveTeachers = activeTeacherIds.length > 0
    const teacherIds = hasActiveTeachers
      ? activeTeacherIds
      : getTeacherIds(teachers)

    return (
      <Fragment>
        <Teachers
          activeTeacherIds={activeTeacherIds}
          teachers={teachers}
          handleFilterClick={this.handleTeacherFilterClick}
          handleActiveToggleChange={this.handleTeacherActiveToggleChange}
          showOnlyActiveTeachers={showOnlyActiveTeachers}

        />
        <Courses teacherIds={teacherIds} semesterCode={semesterCode} />
      </Fragment>
    )
  }

  render() {
    const { history, studyProgrammeId } = this.props
    const {
      totalStudents,
      totalCourses,
      totalCredits,
      teachers,
      activeTeacherIds,
      isLoading,
      name,
      semesterCode,
      academicYears
    } = this.state

    const navigateTo = route => history.push(getCompiledPath(route, { studyProgrammeId }))
    const statisticsTeachers = teachers.filter(t => activeTeacherIds.includes(t.id))

    return (
      <Segment loading={isLoading}>
        <Header size="medium" className={styles.headerWithControl}>
          <div className={styles.headerFilterContainer}>
            {name}
            <AcademicYearFilter
              semesterCode={semesterCode}
              academicYears={academicYears}
              handleSemesterCodeChangeFn={this.handleSemesterCodeChange}
            />
          </div>
          <Button
            icon="reply"
            onClick={() => navigateTo(routes.studyProgramme.route)}
            className={styles.headerIconButton}
          />
        </Header>
        <Statistics
          isLoading={isLoading}
          totalCourses={totalCourses}
          totalTeachers={teachers.length}
          activeTeachers={statisticsTeachers}
          totalStudents={totalStudents}
          totalCredits={totalCredits}
        />
        {this.renderTeachersAndCourses()}
      </Segment>
    )
  }
}

export default withRouter(CourseGroup)
