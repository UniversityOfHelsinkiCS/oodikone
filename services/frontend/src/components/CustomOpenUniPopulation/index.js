import React, { useState } from 'react'
import { withRouter } from 'react-router-dom'
import { Message, Icon } from 'semantic-ui-react'
import OpenUniPopulationResults from './OpenUniPopulationResults'
import { useTitle } from '../../common/hooks'
// import useLanguage from '../LanguagePicker/useLanguage'
import CustomOpenUniSearch from './CustomOpenUniSearch'
// import TSA from '../../common/tsa'

const CustomOpenUniPopulation = () => {
  useTitle('Custom open uni population')
  const [courses, setCourses] = useState([])
  // const language = useLanguage()

  return (
    <div className="segmentContainer">
      <Message style={{ maxWidth: '800px' }}>
        <Message.Header>Open uni student population</Message.Header>
        <p>
          Here you can create custom population using a list of courses. Clicking the blue custom population button will
          open a modal where you can enter a list of courses.
          <br />
          <Icon fitted name="check" color="green" />: Student passed the course.
          <br />
          <Icon fitted name="times" color="red" />: Student has enrolled to the course but did not pass is.
          <br />
          Empty cell: Student has not any enrollment for the course.
          <br />
        </p>
      </Message>
      <CustomOpenUniSearch setCourses={setCourses} />
      {courses.length > 0 && <OpenUniPopulationResults courses={courses} />}
    </div>
  )
}

export default withRouter(CustomOpenUniPopulation)
