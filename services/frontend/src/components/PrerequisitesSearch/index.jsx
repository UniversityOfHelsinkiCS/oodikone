import React, { useState, useEffect } from 'react'
import { withRouter, useLocation, useHistory } from 'react-router-dom'
import { Message, Icon } from 'semantic-ui-react'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { useTitle } from '../../common/hooks'
import CompletedPrerequisitesSearch from './CompletedPrerequisitesSearch'
import CompletedPrerequisitesResults from './CompletedPrerequisitesResults'
import TSA from '../../common/tsa'

const CompletedPrerequisites = () => {
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
          courses yet. Clicking the blue button will open the tool.
        </p>
        <p>
          <Icon fitted name="check" color="green" />: Student has completed the course with a passing grade. <br />
          <Icon fitted name="times" color="red" />: Student has not passed the course and has no enrollment for it.{' '}
          <br />
          <Icon fitted name="minus" color="grey" />: Student has enrolled, but has not received any grade from the
          course. <br />
        </p>
      </Message>

      <CompletedPrerequisitesSearch setValues={setValues} history={history} location={location} />

      <div style={{ paddingTop: '25px' }}>
        {searchValues && searchValues.courseList?.length > 0 && searchValues.studentList?.length > 0 && (
          <CompletedPrerequisitesResults searchValues={searchValues} language={language} />
        )}
      </div>
    </div>
  )
}

export default withRouter(CompletedPrerequisites)
