import React, { useEffect, useState } from 'react'
import { Divider, Loader, Radio } from 'semantic-ui-react'
import { useGetStudytrackStatsQuery } from 'redux/studyProgramme'
import InfoBox from '../../Info/InfoBox'
import BarChart from './BarChart'
import BasicDataTable from './BasicDataTable'
import StudytrackDataTable from './StudytrackDataTable'
import StudytrackSelector from './StudytrackSelector'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const populationTitles = ['', 'All started', 'Men', 'Women', 'Finnish', 'Graduated']
const creditTableTitles = [
  '',
  'All started',
  '< 30 credits',
  '30-59 credits',
  '60-89 credits',
  '90-119 credits',
  '120-149 credits',
  '> 150 credits',
]

const getRadioButton = (firstLabel, secondLabel, value, setValue) => (
  <div className="radio-toggle">
    <label className="toggle-label">{firstLabel}</label>
    <Radio toggle checked={value} onChange={() => setValue(!value)} />
    <label className="toggle-label">{secondLabel}</label>
  </div>
)

const StudytrackOverview = ({ studyprogramme }) => {
  const toolTips = InfotoolTips.Studyprogramme
  const [transferred, setTransferred] = useState(false)
  const [track, setTrack] = useState(studyprogramme)
  const stats = useGetStudytrackStatsQuery({ id: studyprogramme, transferred })

  useEffect(() => {
    if (!track && stats?.data?.mainStatsByTrack[studyprogramme]) {
      setTrack(studyprogramme)
    }
  }, [studyprogramme, track, stats])

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
      {stats.isLoading ? (
        <Loader active={stats.isLoading} />
      ) : (
        <>
          <StudytrackSelector track={track} setTrack={setTrack} studytracks={stats?.data?.studytrackOptions} />
          {getRadioButton('Exclude transferred students', 'Include transferred students', transferred, setTransferred)}
          {getDivider(
            `Students of ${
              track === '' || track === 'studyprogramme'
                ? 'the studyprogramme by starting year'
                : `the studytrack ${track} by starting year`
            }`,
            'StudytrackOverview'
          )}
          <StudytrackDataTable
            track={track || studyprogramme}
            titles={populationTitles}
            dataOfAllTracks={stats?.data?.mainStatsByYear}
            dataOfSingleTrack={track && track !== studyprogramme ? stats?.data?.mainStatsByTrack[track] : null}
          />
          {getDivider(
            `Progress of students of ${
              track === '' || track === 'studyprogramme'
                ? 'the studyprogramme by starting year'
                : `the studytrack ${track} by starting year`
            }`,
            'StudytrackProgress'
          )}
          <div className="section-container">
            <BarChart data={stats?.data} track={track || studyprogramme} />
            <BasicDataTable
              data={stats?.data?.creditTableStats}
              track={track || studyprogramme}
              titles={creditTableTitles}
            />
          </div>
        </>
      )}
    </div>
  )
}

export default StudytrackOverview
