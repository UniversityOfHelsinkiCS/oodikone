import React, { Fragment, Component } from 'react'
import { Header, List, Loader, Placeholder, Icon } from 'semantic-ui-react'
import { callApi } from '../../../apiConnection'
import styles from './courseGroup.css'

const courseColumnTypes = {
  TEACHER: 'teachername',
  CODE: 'coursecode',
  NAME: 'coursenames',
  CREDITS: 'credits',
  STUDENTS: 'students'
}

const CourseItem = ({ course }) => {
  const { coursecode, teachername, credits, students, coursenames } = course
  const coursename = coursenames.fi
  return (
    <List.Item>
      <List.Content className={styles.courseInfoContent}>
        <div className={styles.courseInfoTeacher}>{teachername}</div>
        <div className={styles.courseInfoCode}>{coursecode}</div>
        <div className={styles.courseInfoName}>{coursename}</div>
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
    const { teacherIds } = this.props
    if (prevProps.teacherIds.length !== teacherIds.length) {
      await this.fetchCourses()
    }
  }

  onCourseHeaderClick = (columnName) => {
    const { sortColumn, sortReverse } = this.state
    const isSortColumn = columnName === sortColumn
    this.setState(
      {
        sortColumn: columnName,
        sortReverse: isSortColumn ? !sortReverse : sortReverse
      },
      () => this.fetchCourses()
    )
  }

  fetchCourses = async () => {
    const { teacherIds } = this.props

    this.setState(
      { isLoading: true, courses: [] },
      () => callApi(`courseGroups/teachers/?teacherIds=${JSON.stringify(teacherIds)}`)
        .then(({ data: courses }) => this.setState({ isLoading: false, courses }))
        .catch(e => console.log('handle error'))
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
            ? <Icon name={`caret ${sortReverse ? 'up' : 'down'}`} />
            : null}
        </div>
      )
    }

    return (
      <List.Header>
        <List.Content className={styles.courseHeaderContent}>
          {getHeader(styles.courseHeaderTeacher, 'Teacher', courseColumnTypes.TEACHER)}
          {getHeader(styles.courseHeaderCode, 'Code', courseColumnTypes.CODE)}
          {getHeader(styles.courseHeaderName, 'Name', courseColumnTypes.NAME)}
          {getHeader(styles.courseHeaderItem, 'Credits', courseColumnTypes.CREDITS)}
          {getHeader(styles.courseHeaderItem, 'Students', courseColumnTypes.STUDENTS)}
        </List.Content>
      </List.Header>
    )
  }

  render() {
    const { isLoading, courses } = this.state

    return (
      <Fragment>
        <Header size="medium" content="Courses" />
        <Loader active={isLoading} inline="centered" />
        {isLoading
         ? this.renderPlaceholder()
         :
         <List celled>
           {this.renderListHeader()}
           {courses.map(c =>
             <CourseItem key={`${c.coursecode}-${c.teachercode}`} course={c} />)}
         </List>
        }
      </Fragment>
    )
  }
}

export default Courses
