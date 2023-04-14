import React, { useState, useEffect } from 'react'
import { withRouter, useLocation, useHistory } from 'react-router-dom'
import { Message, Icon } from 'semantic-ui-react'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { useTitle } from '../../common/hooks'
import CompletedCoursesSearch from './CompletedCoursesSearch'
import CompletedCoursesSearchResults from './CompletedCoursesSearchResults'
import TSA from '../../common/tsa'

const CompletedCourses = () => {
  useTitle('Search completed courses')
  const { language } = useLanguage()
  const [searchValues, setValues] = useState({})
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    if (searchValues && searchValues.courseList?.length > 0) {
      TSA.Influx.sendEvent({
        group: 'Completed Courses Tool Usage',
        name: 'completed courses tool',
        label: 'completedCoursesTool',
        value: 1,
      })
    }
  }, [searchValues])
  return (
    <div className="segmentContainer">
      <Message style={{ maxWidth: '800px', fontSize: '16px' }}>
        <Message.Header>Search completed courses</Message.Header>
        <p>
          Here you can search by a list of student and course numbers to see whether students have completed certain
          courses yet. This tool can be used for example to check if a group of students have completed certain courses.
          Clicking the blue button will open the tool.
        </p>
        <p>
          Note that if you do not have the required rights to view the data of some students, those rows will omitted
          from the results.
        </p>
        <p>
          <Icon fitted name="check" color="green" />: Student has completed the course with a passing grade. <br />
          <Icon fitted name="minus" color="yellow" />: Student has not completed the course, but has an active
          enrollment from less than 6 months ago. <br />
          <Icon fitted name="minus" color="grey" />: Student has not completed the course, but has an enrollment from
          more than 6 months ago. <br />
          <b>Empty cell</b>: Student has no completion or enrollment for the course.
        </p>
      </Message>
      <CompletedCoursesSearch setValues={setValues} history={history} location={location} />

      <div style={{ paddingTop: '25px' }}>
        {searchValues && searchValues.courseList?.length > 0 && searchValues.studentList?.length > 0 && (
          <CompletedCoursesSearchResults searchValues={searchValues} language={language} />
        )}
      </div>
    </div>
  )
}

export default withRouter(CompletedCourses)
