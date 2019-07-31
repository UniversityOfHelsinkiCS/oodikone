import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Search } from 'semantic-ui-react'
import { connect } from 'react-redux'
import { getActiveLanguage, getTranslate } from 'react-localize-redux'
import Timeout from '../Timeout'

import { makeSortCourses } from '../../selectors/courses'

import './courseSearch.css'

const { func, string, arrayOf, object } = PropTypes

const CourseSearch = (props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [searchStr, setSearchStr] = useState('')

  const fetchCoursesList = (str) => {
    const { activeLanguage } = props
    if (str.length >= 3) {
      setIsLoading(true)
      props.findFunction(str, activeLanguage)
        .then(() => setIsLoading(false))
    } else {
      props.findFunction('')
    }
  }

  const handleSearchChange = (e, { value }) => {
    props.clearTimeout('search')
    setSearchStr(value)
    props.setTimeout('search', () => {
      fetchCoursesList(value)
    }, 250)
  }

  const selectCourse = (a, b) => {
    setSearchStr(b.result.title)
    props.handleResultSelect(a, b)
  }

  const { courseList } = props

  const coursesToRender = courseList.slice(0, 20)

  return (
    <Search
      className="courseSearch"
      input={{ fluid: true }}
      loading={isLoading}
      placeholder="Search by entering a course code or name"
      onResultSelect={selectCourse}
      onSearchChange={handleSearchChange}
      results={coursesToRender}
      value={searchStr}
    />
  )
}

CourseSearch.propTypes = {
  findFunction: func.isRequired,
  courseList: arrayOf(object).isRequired,
  setTimeout: func.isRequired,
  clearTimeout: func.isRequired,
  handleResultSelect: func.isRequired,
  activeLanguage: string.isRequired
}

const sortCourses = makeSortCourses()

const mapStateToProps = ({ localize, courses }) => ({
  courseList: sortCourses(courses),
  translate: getTranslate(localize),
  activeLanguage: getActiveLanguage(localize).code
})

export default connect(mapStateToProps)(Timeout(CourseSearch))
