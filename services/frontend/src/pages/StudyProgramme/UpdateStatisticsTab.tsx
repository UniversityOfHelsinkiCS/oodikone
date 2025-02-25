import { useState } from 'react'
import { Button } from 'semantic-ui-react'

import { UpdateStatusIcon } from '@/components/common/UpdateStatusIcon'
import { useUpdateBasicViewQuery, useUpdateStudyTrackViewQuery } from '@/redux/studyProgramme'

export const UpdateStatisticsTab = ({ combinedProgramme, studyProgramme }) => {
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
          Update
        </Button>
        <UpdateStatusIcon stats={basicStats} />
      </div>
      <div className="button-container">
        <h4>Update data on Study tracks and class statistics view</h4>
        <Button
          color="blue"
          data-cy="updatepopulations"
          disabled={studyTrackStats.isLoading}
          onClick={() => setSkipStudyTrack()}
        >
          Update
        </Button>
        <UpdateStatusIcon stats={studyTrackStats} />
      </div>
    </div>
  )
}
