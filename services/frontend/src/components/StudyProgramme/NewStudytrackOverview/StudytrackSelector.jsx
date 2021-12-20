import React from 'react'
import { Dropdown } from 'semantic-ui-react'

import '../studyprogramme.css'

const StudytrackSelector = ({ track, setTrack, studytracks }) => {
  const handleStudytrackChange = (event, { value }) => {
    event.preventDefault()
    setTrack(value)
  }

  return (
    <div className="studytrack-selector">
      <h4>Choose studytrack</h4>
      <Dropdown
        fluid
        selection
        value={track}
        onChange={handleStudytrackChange}
        options={studytracks?.map(o => ({ key: o, value: o, text: o }))}
      />
    </div>
  )
}

export default StudytrackSelector
