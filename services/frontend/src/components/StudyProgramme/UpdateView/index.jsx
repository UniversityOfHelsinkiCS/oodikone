import { useState } from 'react'
import { Button, Icon, Loader } from 'semantic-ui-react'

import { useUpdateBasicViewQuery, useUpdateStudyTrackViewQuery } from '@/redux/studyProgramme'

const getStatusIcon = stats => {
  if (stats.isLoading) return <Loader active />
  if (stats.isSuccess) return <Icon color="green" name="check" />
  if (stats.isError) return <Icon color="red" name="close" />
  return ''
}

export const UpdateView = ({ combinedProgramme, studyProgramme }) => {
  const [skipBasic, setSkipBasic] = useState(true)
  const [skipStudyTrack, setSkipStudyTrack] = useState(true)
  const basicStats = useUpdateBasicViewQuery({ id: studyProgramme, combinedProgramme }, { skip: skipBasic })
  const studyTrackStats = useUpdateStudyTrackViewQuery(
    { id: studyProgramme, combinedProgramme },
    { skip: skipStudyTrack }
  )

  return (
    <div className="update-view">
      <div className="button-container">
        <h4>Update data on Basic information view</h4>
        <Button
          color="blue"
          data-cy="updatebasicinfo"
          disabled={basicStats.isLoading}
          onClick={() => setSkipBasic(false)}
        >
          Update Basic information
        </Button>
        {getStatusIcon(basicStats)}
      </div>
      <div className="button-container">
        <h4>Update data on Study tracks and class statistics view</h4>
        <Button
          color="blue"
          data-cy="updatepopulations"
          disabled={studyTrackStats.isLoading}
          onClick={() => setSkipStudyTrack()}
        >
          Update Study tracks and class statistics
        </Button>
        {getStatusIcon(studyTrackStats)}
      </div>
    </div>
  )
}
