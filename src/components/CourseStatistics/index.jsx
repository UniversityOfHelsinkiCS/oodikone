import React, { Component } from 'react'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { Header } from 'semantic-ui-react'
import Timeout from '../Timeout'
import CourseSearch from '../CourseSearch'
import CoursePassRateChart from '../CoursePassRateChart'
import { getCourseStatistics } from '../../redux/courseStatistics'

import styles from './courseStatistics.css'
import sharedStyles from '../../styles/shared'

const { shape, func, array } = PropTypes

const INITIAL_YEARS = {
  start: '2017',
  end: '2018'
}

class CourseStatistics extends Component {
  state = {
    selectedCourse: { name: 'No course selected', code: '' },
    ...INITIAL_YEARS
  }

  handleResultSelect = (e, { result }) => {
    this.setState({ selectedCourse: result }, () => {
      this.fetchCourseStatistics()
    })
  }

  fetchCourseStatistics = () => {
    const { code } = this.state.selectedCourse
    const { start, end } = this.state
    this.props.getCourseStatistics({ code, start, end, separate: true })
  }

  render() {
    const { data } = this.props.courseStatistics
    return (
      <div className={styles.container}>
        <Header className={sharedStyles.segmentTitle} size="large">
          Course Statistics
        </Header>
        <CourseSearch handleResultSelect={this.handleResultSelect} />

        {data.map(course => <CoursePassRateChart key={course.name} stats={course} />)}
      </div>
    )
  }
}

CourseStatistics.propTypes = {
  getCourseStatistics: func.isRequired,
  courseStatistics: shape({
    data: array.isRequired,
    selected: array.isRequired
  }).isRequired
}

const mapStateToProps = ({ courses, courseStatistics }) => ({
  courses,
  courseStatistics
})

const mapDispatchToProps = dispatch => ({
  getCourseStatistics: query =>
    dispatch(getCourseStatistics(query))
})


export default connect(mapStateToProps, mapDispatchToProps)(Timeout(CourseStatistics))
