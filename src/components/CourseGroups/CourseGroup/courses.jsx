import React, { Fragment, Component } from 'react'
import { Header, List, Loader } from 'semantic-ui-react'
import { callApi } from '../../../apiConnection'
import styles from './courseGroup.css'

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
    courses: []
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

  fetchCourses = async () => {
    const { teacherIds } = this.props

    this.setState(
      { isLoading: true, courses: [] },
      () => callApi(`courseGroups/teachers/?teacherIds=${JSON.stringify(teacherIds)}`)
        .then(({ data: courses }) => this.setState({ isLoading: false, courses }))
        .catch(e => console.log('handle error'))
    )
  }

  render() {
    const { isLoading, courses } = this.state

    return (
      <Fragment>
        <Header size="medium" content="Courses" />
        <Loader active={isLoading} inline="centered" />
        <List celled className={styles.teacherList}>
          {courses.map(c =>
            <CourseItem key={`${c.coursecode}-${c.teachercode}`} course={c} />)}
        </List>
      </Fragment>
    )
  }
}

export default Courses
