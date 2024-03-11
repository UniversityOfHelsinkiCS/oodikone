import React, { useState } from 'react'
import { Button, Icon, Loader } from 'semantic-ui-react'

import { useUpdateBasicViewQuery, useUpdateStudytrackViewQuery } from '@/redux/studyProgramme'

const getStatusIcon = stats => {
  if (stats.isLoading) return <Loader active />
  if (stats.isSuccess) return <Icon color="green" name="check" />
  if (stats.isError) return <Icon color="red" name="close" />
  return ''
}

export const UpdateView = ({ studyprogramme, combinedProgramme }) => {
  const [skipBasic, setSkipBasic] = useState(true)
  const [skipStudytrack, setSkipStudytrack] = useState(true)
  const basicstats = useUpdateBasicViewQuery({ id: studyprogramme, combinedProgramme }, { skip: skipBasic })
  const studytrackstats = useUpdateStudytrackViewQuery(
    { id: studyprogramme, combinedProgramme },
    { skip: skipStudytrack }
  )

  return (
    <div className="update-view">
      <div className="button-container">
        <h4>Update data on Basic Information -view</h4>
        <Button
          color="blue"
          data-cy="updatebasicinfo"
          disabled={basicstats.isLoading}
          onClick={() => setSkipBasic(false)}
        >
          Update Basic Information
        </Button>
        {getStatusIcon(basicstats)}
      </div>
      <div className="button-container">
        <h4>Update data on Populations and Studytracks -view</h4>
        <Button
          color="blue"
          data-cy="updatepopulations"
          disabled={studytrackstats.isLoading}
          onClick={() => setSkipStudytrack()}
        >
          Update Populations and Studytracks
        </Button>
        {getStatusIcon(studytrackstats)}
      </div>
    </div>
  )
}
