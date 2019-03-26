import React from 'react'
import { Button, Message } from 'semantic-ui-react'
import { string, func } from 'prop-types'
import { connect } from 'react-redux'
import CourseSearchForm from '../../CourseSearchForm'
import ThesisCourseList from './ThesisCourseList'
import SearchResult from './SearchResult'
import Expandable from '../../Expandable'
import { createNewThesisCourse, getThesisCourses } from '../../../redux/thesisCourses'

const ThesisCourses = ({ studyprogramme, createThesis, getTheses }) => {
  const handleClick = (course, thesis) => async () => {
    createThesis(studyprogramme, course, thesis)
    getTheses(studyprogramme)
  }
  return (
    <React.Fragment>
      <Message content="The set of courses used for calculating theses productivity statistics" />
      <Expandable fluid title="Add thesis course">
        <CourseSearchForm />
        <SearchResult
          getCourseActions={({ code }) => (
            <Button.Group basic fluid width="3">
              <Button content="Bachelors" onClick={handleClick(code, 'BACHELOR')} />
              <Button.Or />
              <Button content="Masters" onClick={handleClick(code, 'MASTER')} />
            </Button.Group>
          )}
        />
      </Expandable>
      <ThesisCourseList studyprogramme={studyprogramme} />
    </React.Fragment>
  )
}

ThesisCourses.propTypes = {
  studyprogramme: string.isRequired,
  createThesis: func.isRequired,
  getTheses: func.isRequired
}

export default connect(null, {
  createThesis: createNewThesisCourse,
  getTheses: getThesisCourses
})(ThesisCourses)
