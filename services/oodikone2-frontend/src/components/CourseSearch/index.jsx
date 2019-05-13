import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Search } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import Timeout from '../Timeout'

import { makeSortCourses } from '../../selectors/courses'

import './courseSearch.css'

const { func, string, arrayOf, object } = PropTypes

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
      this.props.findFunction(searchStr, language)
        .then(() => this.setState({ isLoading: false }))
    } else {
      this.props.findFunction('')
    }
  }

  selectCourse = (a, b) => {
    this.setState({ searchStr: b.result.title })
    this.props.handleResultSelect(a, b)
  }

  render() {
    const { isLoading, searchStr } = this.state
    const { courseList } = this.props

    const coursesToRender = courseList.slice(0, 20)

    return (
      <Search
        className="courseSearch"
        input={{ fluid: true }}
        loading={isLoading}
        placeholder="Search by entering a course code or name"
        onResultSelect={this.selectCourse}
        onSearchChange={this.handleSearchChange}
        results={coursesToRender}
        value={searchStr}
      />
    )
  }
}

CourseSearch.propTypes = {
  language: string.isRequired,
  findFunction: func.isRequired,
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

export default connect(mapStateToProps)(Timeout(CourseSearch))
