import React, { useState } from 'react'
import { Divider } from 'semantic-ui-react'
import { useGetStudytrackStatsQuery } from 'redux/studyProgramme'
import InfoBox from '../../Info/InfoBox'
import StudytrackSelector from './StudytrackSelector'
import DataTable from './DataTable'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const populationTitles = ['', 'All started', 'Men', 'Women', 'Finnish', 'Graduated']

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
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px' }}>
        <p style={{ color: 'red' }}>
          Please note that this view is still very much a work in progress. This view is only visible to some admins.
        </p>
      </div>
      <StudytrackSelector track={track} setTrack={setTrack} studytracks={['All students of the studyprogramme']} />
      {getDivider(
        `Students of ${
          track === 'All students of the studyprogramme'
            ? 'the programme by starting year'
            : `the studytrack ${track} by starting year`
        }`,
        'StudytrackOverview'
      )}
      <DataTable titles={populationTitles} data={stats.data} />
    </div>
  )
}

export default StudytrackOverview
