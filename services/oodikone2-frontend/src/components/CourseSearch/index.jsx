import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Search } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import Timeout from '../Timeout'

import { findCourses } from '../../redux/courses'
import { makeSortCourses } from '../../selectors/courses'

import styles from './courseSearch.css'

const { func, string, arrayOf, object } = PropTypes

const CourseListRenderer = ({ name, code }) => <Search.Result title={`${name} ( ${code} )`} />

CourseListRenderer.propTypes = {
  name: string.isRequired,
  code: string.isRequired
}

class CourseSearch extends Component {
  state = {
    isLoading: false,
    searchStr: ''
  }

  resetComponent = () => {
    this.setState({
      isLoading: false,
      searchStr: ''
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
    const { language } = this.props
    if (searchStr.length >= 3) {
      this.setState({ isLoading: true })
      this.props.findCourses(searchStr, language)
        .then(() => this.setState({ isLoading: false }))
    } else {
      this.props.findCourses('')
    }
  }

  selectCourse = (a, b) => {
    this.setState({ searchStr: `${b.result.name} ( ${b.result.code} )` })
    this.props.handleResultSelect(a, b)
  }

  render() {
    const { isLoading, searchStr } = this.state
    const { courseList } = this.props

    const coursesToRender = courseList.slice(0, 20)

    return (
      <Search
        className={styles.courseSearch}
        input={{ fluid: true }}
        loading={isLoading}
        placeholder="Search by entering a course code or name"
        onResultSelect={this.selectCourse}
        onSearchChange={this.handleSearchChange}
        results={coursesToRender}
        resultRenderer={CourseListRenderer}
        value={searchStr}
      />
    )
  }
}

CourseSearch.propTypes = {
  language: string.isRequired,
  findCourses: func.isRequired,
  courseList: arrayOf(object).isRequired,
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired,
  handleResultSelect: func.isRequired
}

const sortCourses = makeSortCourses()

const mapStateToProps = ({ locale, courses, settings }) => ({
  language: settings.language,
  courseList: sortCourses(courses),
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
})
const mapDispatchToProps = dispatch => ({
  findCourses: (query, language) =>
    dispatch(findCourses(query, language))
})

export default connect(mapStateToProps, mapDispatchToProps)(Timeout(CourseSearch))
