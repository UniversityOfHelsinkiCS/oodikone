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
  const [fieldValues, setValues] = useState({})
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
          <Icon fitted name="times" color="red" />: Student has enrolled but has not passed the course.
          <br />
          <b>Empty cell</b>: Student has no enrollments for the course.
          <br />
          View under progress.
        </p>
      </Message>
      <CustomOpenUniSearch setValues={setValues} />
      <div style={{ paddingTop: 10, paddingBottom: 10 }}>
        {fieldValues && fieldValues.courseList?.length > 0 && <OpenUniPopulationResults fieldValues={fieldValues} />}
      </div>
    </div>
  )
}

export default withRouter(CustomOpenUniPopulation)
