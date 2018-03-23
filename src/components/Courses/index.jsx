import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import PropTypes from 'prop-types'
import { Search, Dropdown, Header, List, Button } from 'semantic-ui-react'
import CourseStatistics from '../CourseStatistics'

import { findCourses } from '../../redux/courses'
import { findCourseInstances, getCourseInstanceStatistics } from '../../redux/courseInstances'

import styles from './courses.css'

const { func, string, arrayOf, object } = PropTypes

const CourseListRenderer = ({ name, code }) => <span>{`${name} ( ${code} )`}</span>

CourseListRenderer.propTypes = {
  name: string.isRequired,
  code: string.isRequired
}

class Courses extends Component {
  state = {
    isLoading: false,
    searchStr: '',
    selectedCourse: { name: 'No course', code: 'No code' },
    selectedInstances: []
  }

  resetComponent = () => {
    this.setState({
      isLoading: false,
      searchStr: '',
      selectedCourse: { name: 'No course', code: 'No code' },
      selectedInstances: []
    })
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ selectedCourse: result }, () => {
      this.fetchCourseInstances()
    })
  }


  handleSearchChange = (e, { value }) => {
    this.setState({ searchStr: value })
    this.fetchCoursesList()
  }

  fetchCoursesList = () => {
    const { searchStr } = this.state
    this.setState({ isLoading: true })
    this.props.findCourses(searchStr)
      .then(() => this.setState({ isLoading: false }))
  }

  fetchCourseInstances = () => {
    const courseCode = this.state.selectedCourse.code
    this.props.findCourseInstances(courseCode)
  }

  fetchInstanceStatistics = (courseInstance) => {
    const query = { ...courseInstance, months: 12, course: this.state.selectedCourse }
    this.props.getCourseInstanceStatistics(query)
  }

  removeInstance = (courseInstance) => {
    const { selectedInstances } = this.state
    this.setState({ selectedInstances: selectedInstances.filter(i => i !== courseInstance) })
  }

  render() {
    const { isLoading, searchStr, selectedCourse } = this.state
    const { courseList, courseInstances, selectedInstances } = this.props
    const instanceList = []
    if (courseInstances !== undefined) {
      courseInstances.forEach(i => instanceList.push({
        key: i.id,
        text: `${i.date} (${i.students} students)`,
        value: {
          id: i.id, date: i.date, code: selectedCourse.code
        }
      }))
    }

    const listInstance = selectedInstances.map(instance => (
      <List.Item>
        <List.Header>
          {instance.course.name} ({instance.code})
          <List.Content floated="right">
            <Button size="mini" value={instance} onClick={() => this.removeInstance(instance)}>remove</Button>
          </List.Content>
        </List.Header>
        {instance.date}
      </List.Item>))

    // const t = this.props.translate;

    return (
      <div className={styles.container}>
        <Search
          className={styles.courseSearch}
          input={{ fluid: true }}
          loading={isLoading}
          onResultSelect={this.handleResultSelect}
          onSearchChange={this.handleSearchChange}
          results={courseList}
          resultRenderer={CourseListRenderer}
          value={searchStr}
        />

        <Header as="h2">
          {selectedCourse.name}
        </Header>

        <Dropdown
          className={styles.courseSearch}
          onChange={(e, data) => this.fetchInstanceStatistics(data.value)}
          placeholder="Select course instance"
          fluid
          selection
          options={instanceList}
        />

        <List divided relaxed>
          {listInstance}
        </List>

        {selectedInstances.map(i => (<CourseStatistics
          courseName={i.course.name}
          instanceDate={i.date}
          stats={i.statistics}
        />))}

      </div>
    )
  }
}

Courses.propTypes = {
  findCourses: func.isRequired,
  findCourseInstances: func.isRequired,
  getCourseInstanceStatistics: func.isRequired,
  courseList: arrayOf(object).isRequired,
  selectedInstances: arrayOf(object).isRequired,
  courseInstances: arrayOf(object).isRequired
  // translate: func.isRequired
}

const mapStateToProps = ({ locale, courses, courseInstances }) => ({
  courseList: courses.data,
  courseInstances: courseInstances.data,
  selectedInstances: courseInstances.data.filter(instance =>
    courseInstances.selected.includes(instance.id)),
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
})

const mapDispatchToProps = dispatch => ({
  findCourses: query =>
    dispatch(findCourses(query)),

  findCourseInstances: code =>
    dispatch(findCourseInstances(code)),

  getCourseInstanceStatistics: query =>
    dispatch(getCourseInstanceStatistics(query))
})

export default connect(mapStateToProps, mapDispatchToProps)(Courses)
