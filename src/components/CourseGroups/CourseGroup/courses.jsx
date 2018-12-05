import React, { Fragment, Component } from 'react'
import { Header, List, Loader, Placeholder, Icon } from 'semantic-ui-react'
import sortBy from 'lodash/sortBy'
import { callApi } from '../../../apiConnection'
import styles from './courseGroup.css'
import { CG_API_BASE_PATH } from './util'

const courseColumnTypes = {
  TEACHER: 'teachername',
  CODE: 'coursecode',
  NAME: 'coursenames',
  CREDITS: 'credits',
  STUDENTS: 'students'
}

const CourseItem = ({ course }) => { // eslint-disable-line react/prop-types
  const { coursecode, teachername, credits, students, coursenames } = course
  const coursename = coursenames.fi
  return (
    <List.Item>
      <List.Content className={styles.courseInfoContent}>
        <div className={styles.courseInfoName}>{coursename}</div>
        <div className={styles.courseInfoCode}>{coursecode}</div>
        <div className={styles.courseInfoTeacher}>{teachername}</div>
        <div className={styles.courseInfoItem}>{credits}</div>
        <div className={styles.courseInfoItem}>{students}</div>
      </List.Content>
    </List.Item>
  )
}

class Courses extends Component {
  state = {
    isLoading: true,
    courses: [],
    sortColumn: courseColumnTypes.TEACHER,
    sortReverse: false
  }

  async componentDidMount() {
    await this.fetchCourses()
  }

  async componentDidUpdate(prevProps) {
    const { teacherIds, semesterCode } = this.props
    const isNewTeachers = prevProps.teacherIds.length !== teacherIds.length
    const isNewSemester = prevProps.semesterCode !== semesterCode
    if (isNewTeachers || isNewSemester) {
      await this.fetchCourses()
    }
  }

  onCourseHeaderClick = (columnName) => {
    const { sortColumn, sortReverse } = this.state
    const isSortColumn = columnName === sortColumn

    this.setState({
      sortColumn: columnName,
      sortReverse: isSortColumn ? !sortReverse : sortReverse
    })
  }

  fetchCourses = async () => {
    const { teacherIds, semesterCode } = this.props

    let path = `${CG_API_BASE_PATH}/teachers/?teacherIds=${JSON.stringify(teacherIds)}`
    if (semesterCode) {
      path = `${path}&semester=${semesterCode}`
    }

    this.setState(
      { isLoading: true, courses: [] },
      () => callApi(path)
        .then(({ data: courses }) => this.setState({ isLoading: false, courses }))
    )
  }

  renderPlaceholder = () => {
    const placeholderKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    return (
      <Placeholder fluid>
        {placeholderKeys.map(k => <Placeholder.Line key={k} length="full" />)}
      </Placeholder>
    )
  }

  renderListHeader = () => {
    const { sortColumn, sortReverse } = this.state

    const getHeader = (className, label, columnName) => {
      const isActive = columnName === sortColumn
      return (
        <div
          className={className}
          onClick={() => this.onCourseHeaderClick(columnName)}
        >
          {label}
          {isActive
            ? <Icon name={`caret ${sortReverse ? 'down' : 'up'}`} />
            : null}
        </div>
      )
    }

    return (
      <List.Header>
        <List.Content className={styles.courseHeaderContent}>
          {getHeader(styles.courseHeaderName, 'Name', courseColumnTypes.NAME)}
          {getHeader(styles.courseHeaderCode, 'Code', courseColumnTypes.CODE)}
          {getHeader(styles.courseHeaderTeacher, 'Teacher', courseColumnTypes.TEACHER)}
          {getHeader(styles.courseHeaderItem, 'Credits', courseColumnTypes.CREDITS)}
          {getHeader(styles.courseHeaderItem, 'Students', courseColumnTypes.STUDENTS)}
        </List.Content>
      </List.Header>
    )
  }

  render() {
    const { isLoading, courses, sortColumn, sortReverse } = this.state
    const sortedCourses = sortBy(courses, sortColumn)

    if (sortReverse) {
      sortedCourses.reverse()
    }

    return (
      <Fragment>
        <Header size="medium" content="Courses" />
        <Loader active={isLoading} inline="centered" />
        {isLoading
         ? this.renderPlaceholder()
         :
         <List celled>
           {this.renderListHeader()}
           {sortedCourses.map(c =>
             <CourseItem key={`${c.coursecode}-${c.teachercode}`} course={c} />)}
         </List>
        }
      </Fragment>
    )
  }
}

export default Courses
