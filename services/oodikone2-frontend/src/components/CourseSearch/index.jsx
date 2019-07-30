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

  const handleSearchChange = (e, { value: searchStr }) => {
    props.clearTimeout('search')
    setSearchStr(searchStr)
    props.setTimeout('search', () => {
      fetchCoursesList(searchStr)
    }, 250)
  }

  const fetchCoursesList = (searchStr) => {
    const { activeLanguage } = props
    if (searchStr.length >= 3) {
      setIsLoading(true)
      props.findFunction(searchStr, activeLanguage)
        .then(() => setIsLoading(false))
    } else {
      props.findFunction('')
    }
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
