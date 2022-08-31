import React from 'react'
import { Dropdown } from 'semantic-ui-react'

import '../../StudyProgramme/studyprogramme.css'

const ProgrammeSelector = ({ programme, setProgramme, programmes }) => {
  if (!programmes) return null

  const handleStudytrackChange = (event, { value }) => {
    event.preventDefault()
    setProgramme(value)
  }

  return (
    <div className="programme-selector">
      <h4>Choose programme</h4>
      <Dropdown
        fluid
        selection
        name="programme"
        placeholder="All programmes of the faculty"
        value={programme}
        onChange={handleStudytrackChange}
        options={programmes.map(({ code, name }) => ({
          key: code,
          value: code,
          text: code === 'faculty' ? name?.fi : `${name?.fi}, ${code}`,
        }))}
      />
    </div>
  )
}

export default ProgrammeSelector
