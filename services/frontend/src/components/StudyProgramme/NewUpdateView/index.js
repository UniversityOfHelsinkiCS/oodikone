import React, { useState } from 'react'
import { Button, Icon } from 'semantic-ui-react'
import { useUpdateBasicViewQuery, useUpdateStudytrackViewQuery } from '../../../redux/studyProgramme'

const getStatusIcon = stats => {
  if (stats.isSuccess) return <Icon name="check" color="green" />
  if (stats.isError) return <Icon name="close" color="red" />
  return ''
}

const NewUpdateView = ({ studyprogramme }) => {
  const [skipBasic, setSkipBasic] = useState(true)
  const [skipStudytrack, setSkipStudytrack] = useState(true)
  const basicstats = useUpdateBasicViewQuery({ id: studyprogramme }, { skip: skipBasic })
  const studytrackstats = useUpdateStudytrackViewQuery({ id: studyprogramme }, { skip: skipStudytrack })

  return (
    <div className="update-view">
      <div className="button-container">
        <h4>Update data on Basic Information -view</h4>
        <Button color="blue" onClick={() => setSkipBasic(false)}>
          Update
        </Button>
        {getStatusIcon(basicstats)}
      </div>
      <div className="button-container">
        <h4>Update data on Populations and Studytracks -view</h4>
        <Button color="blue" onClick={() => setSkipStudytrack()}>
          Update
        </Button>
        {getStatusIcon(studytrackstats)}
      </div>
    </div>
  )
}

export default NewUpdateView
