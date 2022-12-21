import React, { useEffect, useState } from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { useGetStudytrackStatsQuery } from 'redux/studyProgramme'
import InfoBox from '../../Info/InfoBox'
import BarChart from './BarChart'
import BasicDataTable from './BasicDataTable'
import StudytrackDataTable from './StudytrackDataTable'
import StudytrackSelector from './StudytrackSelector'
import Toggle from '../Toggle'
import TimeBarChart from '../TimeBarChart'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const StudytrackOverview = ({ studyprogramme, specialGroups, setSpecialGroups, graduated, setGraduated }) => {
  const toolTips = InfotoolTips.Studyprogramme
  const [showMeanTime, setShowMeanTime] = useState(false)
  const [track, setTrack] = useState(studyprogramme)
  const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const grad = graduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const stats = useGetStudytrackStatsQuery({
    id: studyprogramme,
    specialGroups: special,
    graduated: grad,
  })

  useEffect(() => {
    if (!track && stats?.data?.mainStatsByTrack[studyprogramme]) {
      setTrack(studyprogramme)
    }
  }, [studyprogramme, track, stats, specialGroups])

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <InfoBox content={toolTips[toolTipText]} />
    </>
  )

  const isError = (stats.isSuccess && !stats.data) || stats.isError

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  const noData = stats.isSuccess && stats.mainStatsByYear && !stats.mainStatsByYear.Total.length

  if (noData) return <h3>There is no data available for the selected programme between 2017-2022</h3>

  return (
    <div className="studytrack-overview">
      {stats.isLoading || stats.isFetching ? (
        <Loader active style={{ marginTop: '10em' }} />
      ) : (
        <>
          <StudytrackSelector track={track} setTrack={setTrack} studytracks={stats?.data?.studytrackOptions} />
          <div className="toggle-container">
            <Toggle
              cypress="StudentToggle"
              toolTips={toolTips.StudentToggle}
              firstLabel="All studyrights"
              secondLabel="Special studyrights excluded"
              value={specialGroups}
              setValue={setSpecialGroups}
            />
            <Toggle
              cypress="GraduatedToggle"
              toolTips={toolTips.GraduatedToggle}
              firstLabel="Graduated included"
              secondLabel="Graduated excluded"
              value={graduated}
              setValue={setGraduated}
            />
          </div>
          {getDivider(
            `Students of ${
              track === '' || track === studyprogramme
                ? 'the studyprogramme by starting year'
                : `the studytrack ${track} by starting year`
            }`,
            'StudytrackOverview'
          )}
          <StudytrackDataTable
            studyprogramme={studyprogramme}
            singleTrack={track !== studyprogramme && track}
            studytracks={stats?.data?.studytrackOptions}
            titles={stats?.data?.populationTitles}
            dataOfAllTracks={stats?.data?.mainStatsByYear}
            dataOfSingleTrack={track && track !== studyprogramme ? stats?.data?.mainStatsByTrack[track] : null}
            years={stats?.data?.years}
          />
          {getDivider(
            `Progress of students of ${
              track === '' || track === studyprogramme
                ? 'the studyprogramme by starting year'
                : `the studytrack ${track} by starting year`
            }`,
            'StudytrackProgress'
          )}
          <div className="section-container">
            <BarChart cypress="StudytrackProgress" data={stats?.data} track={track || studyprogramme} />
            <BasicDataTable
              cypress="StudytrackProgress"
              data={stats?.data?.creditTableStats}
              track={track || studyprogramme}
              titles={stats?.data?.creditTableTitles}
            />
          </div>
          {stats?.isSuccess && stats?.data?.includeGraduated && stats?.data?.graduationTimes[track] && (
            <>
              {getDivider('Average graduation times', 'AverageGraduationTimesStudytracks')}
              <Toggle
                firstLabel="Median time"
                secondLabel="Mean time"
                value={showMeanTime}
                setValue={setShowMeanTime}
              />
              <div className="section-container-centered">
                <TimeBarChart
                  data={
                    showMeanTime
                      ? stats?.data?.graduationTimes[track].means
                      : stats?.data?.graduationTimes[track].medians
                  }
                  goal={stats?.data?.graduationTimes.goal}
                  showMeanTime={showMeanTime}
                  byStartYear
                  title={' '}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default StudytrackOverview
