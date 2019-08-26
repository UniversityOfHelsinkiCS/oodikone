import React, { Fragment, Component } from 'react'
import { Header, List, Loader, Placeholder, Icon } from 'semantic-ui-react'
import { arrayOf, string, number, shape } from 'prop-types'
import sortBy from 'lodash/sortBy'
import { callApi } from '../../../../apiConnection/index'
import '../courseGroup.css'
import { CG_API_BASE_PATH } from '../util'

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
      <List.Content className="courseInfoContent">
        <div className="courseInfoName">{coursename}</div>
        <div className="courseInfoCode">{coursecode}</div>
        <div className="courseInfoTeacher">{teachername}</div>
        <div className="courseInfoItem">{credits}</div>
        <div className="courseInfoItem">{students}</div>
      </List.Content>
    </List.Item>
  )
}
CourseItem.propTypes = {
  course: shape({
    coursecode: string,
    teachername: string,
    credits: number,
    students: number,
    coursenames: shape({})
  }).isRequired
}

class Index extends Component {
  state = {
    isLoading: true,
    courses: [],
    sortColumn: courseColumnTypes.TEACHER,
    sortReverse: false
  }

  componentDidMount() {
    this.fetchCourses()
  }

  componentDidUpdate(prevProps) {
    const { teacherIds, semesterCode } = this.props
    const isNewTeachers = prevProps.teacherIds.length !== teacherIds.length
    const isNewSemester = prevProps.semesterCode !== semesterCode
    if (isNewTeachers || isNewSemester) {
      this.fetchCourses()
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

  fetchCourses = () => {
    const { teacherIds, semesterCode } = this.props

    let path = `${CG_API_BASE_PATH}/courses/?teacherIds=${JSON.stringify(teacherIds)}`
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
        <List.Content className="courseHeaderContent">
          {getHeader('courseHeaderName', 'Name', courseColumnTypes.NAME)}
          {getHeader('courseHeaderCode', 'Code', courseColumnTypes.CODE)}
          {getHeader('courseHeaderTeacher', 'Teacher', courseColumnTypes.TEACHER)}
          {getHeader('courseHeaderItem', 'Credits', courseColumnTypes.CREDITS)}
          {getHeader('courseHeaderItem', 'Students', courseColumnTypes.STUDENTS)}
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

Index.propTypes = {
  teacherIds: arrayOf(string).isRequired,
  semesterCode: number.isRequired
}

export default Index
