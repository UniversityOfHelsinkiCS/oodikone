import React, { useState } from 'react'
import { Divider } from 'semantic-ui-react'
import { useGetStudytrackStatsQuery } from 'redux/studyProgramme'
import InfoBox from '../../Info/InfoBox'
import StudytrackSelector from './StudytrackSelector'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const StudytrackOverview = ({ studyprogramme }) => {
  const [track, setTrack] = useState('All students of the studyprogramme')
  const toolTips = InfotoolTips.Studyprogramme
  const stats = useGetStudytrackStatsQuery({ id: studyprogramme })

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider horizontal>{title}</Divider>
      </div>
      <InfoBox content={toolTips[toolTipText]} />
    </>
  )

  return (
    <div className="studytrack-overview">
      <StudytrackSelector track={track} setTrack={setTrack} studytracks={['All students of the studyprogramme']} />
      {getDivider(
        `Students of ${
          track === 'All students of the studyprogramme'
            ? 'the programme by starting year'
            : `the studytrack ${track} by starting year`
        }`,
        toolTips.PopulationOverview
      )}
      {stats?.id}
    </div>
  )
}

export default StudytrackOverview
