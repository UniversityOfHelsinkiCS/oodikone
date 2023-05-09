import React, { useState } from 'react'
import { Button, Icon, Loader } from 'semantic-ui-react'
import { useUpdateBasicViewQuery, useUpdateStudytrackViewQuery } from '../../../redux/studyProgramme'

const getStatusIcon = stats => {
  if (stats.isLoading) return <Loader active />
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
        <Button
          disabled={basicstats.isLoading}
          color="blue"
          data-cy="updatebasicinfo"
          onClick={() => setSkipBasic(false)}
        >
          Update Basic Information
        </Button>
        {getStatusIcon(basicstats)}
      </div>
      <div className="button-container">
        <h4>Update data on Populations and Studytracks -view</h4>
        <Button
          disabled={studytrackstats.isLoading}
          color="blue"
          data-cy="updatepopulations"
          onClick={() => setSkipStudytrack()}
        >
          Update Populations and Studytracks
        </Button>
        {getStatusIcon(studytrackstats)}
      </div>
    </div>
  )
}

export default NewUpdateView
