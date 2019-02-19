import React, { Component } from 'react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import PropTypes from 'prop-types'
import { Dropdown, Header, List, Button } from 'semantic-ui-react'
import CourseInstanceStatistics from '../CourseInstanceStatistics'
import CourseSearch from '../CourseSearch'
import LanguageChooser from '../LanguageChooser'
import Timeout from '../Timeout'

import { reformatDate } from '../../common'
import { findCourseInstances, getCourseInstanceStatistics, removeInstance } from '../../redux/courseInstances'
import { makeSortCourseInstances } from '../../selectors/courses'

import styles from './courses.css'
import sharedStyles from '../../styles/shared'

const { func, arrayOf, object } = PropTypes

class CourseInstances extends Component {
  state = {
    isLoading: false,
    selectedCourse: { name: 'No course selected', code: '' }
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ selectedCourse: result }, () => {
      this.fetchCourseInstances()
    })
  }

  fetchCourseInstances = () => {
    const courseCode = this.state.selectedCourse.code
    this.setState({ isLoading: true })
    this.props.findCourseInstances(courseCode)
      .then(() => {
        this.setState({ isLoading: false })
      })
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
    const { selectedCourse, isLoading } = this.state
    const { courseInstances, selectedInstances } = this.props
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
        <Header className={sharedStyles.segmentTitle} size="large">
          Course Statistics
        </Header>
        <LanguageChooser />
        <CourseSearch handleResultSelect={this.handleResultSelect} />

        <Header as="h3">
          {selectedCourse.name} {selectedCourse.code ? `(${selectedCourse.code})` : ''}
        </Header>

        <Dropdown
          loading={isLoading}
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
          <CourseInstanceStatistics
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

CourseInstances.propTypes = {
  findCourseInstances: func.isRequired,
  getCourseInstanceStatistics: func.isRequired,
  removeInstance: func.isRequired,
  selectedInstances: arrayOf(object).isRequired,
  courseInstances: arrayOf(object).isRequired
}

const sortInstances = makeSortCourseInstances()

const mapStateToProps = ({ locale, courseInstances }) => ({
  courseInstances: sortInstances(courseInstances),
  selectedInstances: courseInstances.data.filter(instance =>
    courseInstances.selected.includes(instance.id)),
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
})

const mapDispatchToProps = dispatch => ({

  findCourseInstances: code =>
    dispatch(findCourseInstances(code)),

  getCourseInstanceStatistics: query =>
    dispatch(getCourseInstanceStatistics(query)),

  removeInstance: instance =>
    dispatch(removeInstance(instance))
})

export default connect(mapStateToProps, mapDispatchToProps)(Timeout(CourseInstances))
