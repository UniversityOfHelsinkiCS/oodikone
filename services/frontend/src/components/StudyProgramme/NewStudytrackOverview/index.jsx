import React, { useEffect, useState } from 'react'
import { Divider, Loader, Radio } from 'semantic-ui-react'

import { useGetStudytrackStatsQuery } from 'redux/studyProgramme'
import WithHelpTooltip from '../../Info/InfoWithHelpTooltip'
import InfoBox from '../../Info/InfoBox'
import BarChart from './BarChart'
import BasicDataTable from './BasicDataTable'
import GaugeChart from './GaugeChart'
import StudytrackDataTable from './StudytrackDataTable'
import StudytrackSelector from './StudytrackSelector'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const populationTitles = [
  '',
  'All',
  'Started',
  'Currently enrolled',
  'Absent',
  'Cancelled',
  'Graduated',
  'Men',
  'Women',
  'Finnish',
]
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

const getRadioButton = (toolTip, firstLabel, secondLabel, value, setValue) => (
  <div className="radio-toggle">
    <label className="toggle-label">{firstLabel}</label>
    <Radio toggle checked={value} onChange={() => setValue(!value)} />
    <WithHelpTooltip tooltip={{ short: toolTip }}>
      <label className="toggle-label">{secondLabel}</label>
    </WithHelpTooltip>
  </div>
)

const StudytrackOverview = ({ studyprogramme }) => {
  const toolTips = InfotoolTips.Studyprogramme
  const [showMeanTime, setShowMeanTime] = useState(true)
  const [specialGroups, setSpecialGroups] = useState(true)
  const [track, setTrack] = useState(studyprogramme)
  const special = specialGroups ? 'SPECIAL_INCLUDED' : 'SPECIAL_EXCLUDED'
  const stats = useGetStudytrackStatsQuery({ id: studyprogramme, specialGroups: special })

  useEffect(() => {
    if (!track && stats?.data?.mainStatsByTrack[studyprogramme]) {
      setTrack(studyprogramme)
    }
  }, [studyprogramme, track, stats, specialGroups])

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
      {stats.isLoading || stats.isFetching ? (
        <Loader active style={{ marginTop: '10em' }} />
      ) : (
        <>
          <StudytrackSelector track={track} setTrack={setTrack} studytracks={stats?.data?.studytrackOptions} />
          {getRadioButton(toolTips.StudentToggle, 'Major students', 'All students', specialGroups, setSpecialGroups)}
          {getDivider(
            `Students of ${
              track === '' || track === 'studyprogramme'
                ? 'the studyprogramme by starting year'
                : `the studytrack ${track} by starting year`
            }`,
            'StudytrackOverview'
          )}
          <StudytrackDataTable
            studyprogramme={studyprogramme}
            singleTrack={track !== studyprogramme && track}
            studytracks={stats?.data?.studytrackOptions}
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
          {getDivider('Average graduation times', 'AverageGraduationTimes')}
          {getRadioButton(null, 'Mean time', 'Median time', showMeanTime, setShowMeanTime)}
          <div className="section-container-centered">
            {stats?.data?.years.map(year => (
              <GaugeChart
                key={year}
                year={year}
                data={stats?.data?.graduationMedianTime[track][year]}
                amount={stats?.data?.graduationAmounts[track][year]}
                studyprogramme={studyprogramme}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default StudytrackOverview
