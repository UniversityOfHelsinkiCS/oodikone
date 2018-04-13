import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import PropTypes from 'prop-types'
import { Search, Dropdown, Header, List, Button } from 'semantic-ui-react'
import CourseStatistics from '../CourseStatistics'
import Timeout from '../Timeout'

import { reformatDate } from '../../common'
import { findCourses } from '../../redux/courses'
import { findCourseInstances, getCourseInstanceStatistics, removeInstance } from '../../redux/courseInstances'
import { makeSortCourseInstances, makeSortCourses } from '../../selectors/courses'

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
    selectedCourse: { name: 'No course selected', code: '' }
  }

  resetComponent = () => {
    this.setState({
      isLoading: false,
      searchStr: '',
      selectedCourse: { name: 'No course selected', code: '' }
    })
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ selectedCourse: result }, () => {
      this.fetchCourseInstances()
    })
  }

  handleSearchChange = (e, { value: searchStr }) => {
    this.props.clearTimeout('search')
    this.setState({ searchStr })
    this.props.setTimeout('search', () => {
      this.fetchCoursesList(searchStr)
    }, 250)
  }

  fetchCoursesList = (searchStr) => {
    this.setState({ isLoading: true })
    this.props.findCourses(searchStr)
      .then(() => this.setState({ isLoading: false }))
  }

  fetchCourseInstances = () => {
    const courseCode = this.state.selectedCourse.code
    this.props.findCourseInstances(courseCode)
  }

  fetchInstanceStatistics = (e, { value: courseInstanceId }) => {
    const { selectedCourse } = this.state
    const courseInstance = this.props.courseInstances
      .find(instance => instance.id === courseInstanceId)
    const query = {
      id: courseInstance.id,
      date: courseInstance.date,
      code: selectedCourse.code,
      months: 12,
      course: selectedCourse
    }
    this.props.getCourseInstanceStatistics(query)
  }

  removeInstance = instance => () => {
    this.props.removeInstance(instance.id)
  }

  render() {
    const { isLoading, searchStr, selectedCourse } = this.state
    const { courseInstances, selectedInstances, courseList } = this.props

    const listInstance = selectedInstances.map(instance => (
      <List.Item key={instance.id}>
        <List.Header>
          {instance.course.name} ({instance.course.code})
          <List.Content floated="right">
            <Button size="mini" value={instance} onClick={this.removeInstance(instance)}>remove</Button>
          </List.Content>
        </List.Header>
        {reformatDate(instance.date, 'DD.MM.YYYY')}
      </List.Item>))

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
          {selectedCourse.name} {selectedCourse.code ? `(${selectedCourse.code})` : ''}
        </Header>

        <Dropdown
          className={styles.courseSearch}
          onChange={this.fetchInstanceStatistics}
          placeholder="Select course instance"
          fluid
          selection
          options={courseInstances}
        />

        <List divided relaxed>
          {listInstance}
        </List>

        {selectedInstances.map(i => (
          <CourseStatistics
            key={i.id}
            courseName={i.course.name}
            instanceDate={reformatDate(i.date, 'DD.MM.YYYY')}
            stats={i.statistics}
          />
        ))}

      </div>
    )
  }
}

Courses.propTypes = {
  findCourses: func.isRequired,
  findCourseInstances: func.isRequired,
  getCourseInstanceStatistics: func.isRequired,
  removeInstance: func.isRequired,
  courseList: arrayOf(object).isRequired,
  selectedInstances: arrayOf(object).isRequired,
  courseInstances: arrayOf(object).isRequired,
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired
  // translate: func.isRequired
}

const sortInstances = makeSortCourseInstances()
const sortCourses = makeSortCourses()

const mapStateToProps = ({ locale, courses, courseInstances }) => ({
  courseList: sortCourses(courses),
  courseInstances: sortInstances(courseInstances),
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
    dispatch(getCourseInstanceStatistics(query)),

  removeInstance: instance =>
    dispatch(removeInstance(instance))
})

export default connect(mapStateToProps, mapDispatchToProps)(Timeout(Courses))
