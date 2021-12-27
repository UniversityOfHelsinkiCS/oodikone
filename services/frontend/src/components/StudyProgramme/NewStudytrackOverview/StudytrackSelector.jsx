import React from 'react'
import { Dropdown } from 'semantic-ui-react'

import '../studyprogramme.css'

const StudytrackSelector = ({ track, setTrack, studytracks }) => {
  if (!studytracks) return null
  const formattedStudytracks = ['All students of the studyprogramme', ...studytracks]

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
        options={formattedStudytracks.map(o => ({ key: o, value: o, text: o }))}
      />
    </div>
  )
}

export default StudytrackSelector
