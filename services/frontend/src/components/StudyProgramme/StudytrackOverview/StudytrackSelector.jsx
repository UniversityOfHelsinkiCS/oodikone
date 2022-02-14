import React from 'react'
import { Dropdown } from 'semantic-ui-react'

import '../studyprogramme.css'

const StudytrackSelector = ({ track, setTrack, studytracks }) => {
  if (!studytracks) return null

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
        name="studytrack"
        placeholder="All students of the studyprogramme"
        value={track}
        onChange={handleStudytrackChange}
        options={Object.entries(studytracks).map(([code, track]) => ({
          key: code,
          value: code,
          text: code === 'studyprogramme' ? track : `${track}, ${code}`,
        }))}
      />
    </div>
  )
}

export default StudytrackSelector
