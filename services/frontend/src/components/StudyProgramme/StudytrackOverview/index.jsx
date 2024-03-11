import React, { useEffect, useState } from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { getGraduationGraphTitle, getTargetCreditsForProgramme } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { calculateStats } from '@/components/FacultyStatistics/FacultyProgrammeOverview'
import { InfoBox } from '@/components/Info/InfoBox'
import { BreakdownBarChart } from '@/components/StudyProgramme/BreakdownBarChart'
import { MedianTimeBarChart } from '@/components/StudyProgramme/MedianTimeBarChart'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import '@/components/StudyProgramme/studyprogramme.css'
import { useGetStudytrackStatsQuery } from '@/redux/studyProgramme'
import { BarChart } from './BarChart'
import { BasicDataTable } from './BasicDataTable'
import { StudytrackDataTable } from './StudytrackDataTable'
import { StudytrackSelector } from './StudytrackSelector'

export const StudytrackOverview = ({
  studyprogramme,
  specialGroups,
  setSpecialGroups,
  graduated,
  setGraduated,
  combinedProgramme,
}) => {
  const [showMedian, setShowMedian] = useState(false)
  const [track, setTrack] = useState(studyprogramme)
  const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const grad = graduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const stats = useGetStudytrackStatsQuery({
    id: studyprogramme,
    combinedProgramme,
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
      <InfoBox content={studyProgrammeToolTips[toolTipText]} />
    </>
  )

  const isError = (stats.isSuccess && !stats.data) || stats.isError

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  const noData = stats.isSuccess && stats.mainStatsByYear && !stats.mainStatsByYear.Total.length
  if (noData) return <h3>There is no data available for the selected programme between 2017-2022</h3>
  const infoTextGraduationTimes = studyprogramme.includes('MH')
    ? 'AverageGraduationTimesStudytracksMaster'
    : 'AverageGraduationTimesStudytracks'
  const infoTextStudentTable = combinedProgramme ? 'StudytrackOverviewCombinedProgramme' : 'StudytrackOverview'

  const programmeCode = combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme

  const {
    tableStats,
    chartStats,
    tableTitles: creditTableTitles,
  } = calculateStats(stats?.data?.creditCounts, getTargetCreditsForProgramme(programmeCode))
  const creditTableStats = {}
  creditTableStats[studyprogramme] = tableStats
  const creditChartData = { creditGraphStats: {}, years: stats?.data?.years }
  creditChartData.creditGraphStats[studyprogramme] = chartStats

  return (
    <div className="studytrack-overview">
      {stats.isLoading || stats.isFetching ? (
        <Loader active style={{ marginTop: '10em' }} />
      ) : (
        <>
          <StudytrackSelector setTrack={setTrack} studytracks={stats?.data?.studytrackOptions} track={track} />
          <div className="toggle-container">
            <Toggle
              cypress="StudentToggle"
              firstLabel="All studyrights"
              secondLabel="Special studyrights excluded"
              setValue={setSpecialGroups}
              toolTips={studyProgrammeToolTips.StudentToggle}
              value={specialGroups}
            />
            <Toggle
              cypress="GraduatedToggle"
              firstLabel="Graduated included"
              secondLabel="Graduated excluded"
              setValue={setGraduated}
              toolTips={studyProgrammeToolTips.GraduatedToggle}
              value={graduated}
            />
          </div>
          {getDivider(
            `Students of ${
              track === '' || track === studyprogramme
                ? 'the studyprogramme by starting year'
                : `the studytrack ${track} by starting year`
            }`,
            infoTextStudentTable
          )}
          <StudytrackDataTable
            combinedProgramme={combinedProgramme}
            dataOfAllTracks={stats?.data?.mainStatsByYear}
            dataOfSingleTrack={track && track !== studyprogramme ? stats?.data?.mainStatsByTrack[track] : null}
            otherCountriesStats={stats?.data?.otherCountriesCount}
            singleTrack={track !== studyprogramme && track}
            studyprogramme={studyprogramme}
            studytracks={stats?.data?.studytrackOptions}
            titles={stats?.data?.populationTitles}
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
          <div className="section-container" style={{ marginBottom: '5em' }}>
            <BarChart cypress="StudytrackProgress" data={creditChartData} track={track || studyprogramme} />
            <BasicDataTable
              cypress="StudytrackProgress"
              data={creditTableStats}
              titles={creditTableTitles}
              track={track || studyprogramme}
            />
          </div>
          {stats?.isSuccess && stats?.data?.includeGraduated && stats?.data?.graduationTimes[track] && (
            <>
              {getDivider('Average graduation times', infoTextGraduationTimes)}
              <Toggle
                cypress="GraduationTimeToggle"
                firstLabel="Breakdown"
                secondLabel="Median times"
                setValue={setShowMedian}
                value={showMedian}
              />
              <div className="section-container-centered">
                {showMedian ? (
                  <div className="section-container">
                    {stats?.data.doCombo && (
                      <MedianTimeBarChart
                        byStartYear
                        data={stats?.data?.graduationTimes[track].medians.combo}
                        goal={stats?.data?.graduationTimes.goals.combo}
                        title={getGraduationGraphTitle(track, stats?.data.doCombo)}
                      />
                    )}
                    <MedianTimeBarChart
                      byStartYear
                      data={stats?.data?.graduationTimes[track].medians.basic}
                      goal={stats?.data?.graduationTimes.goals.basic}
                      title={getGraduationGraphTitle(track, false)}
                    />
                    {combinedProgramme && (
                      <MedianTimeBarChart
                        byStartYear
                        data={stats?.data?.graduationTimesSecondProg[combinedProgramme]?.medians?.combo}
                        goal={stats?.data?.graduationTimesSecondProg.goals.combo}
                        title={getGraduationGraphTitle(combinedProgramme, true)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="section-container">
                    {stats?.data.doCombo && (
                      <BreakdownBarChart
                        byStartYear
                        data={stats?.data?.graduationTimes[track]?.medians?.combo}
                        title={getGraduationGraphTitle(studyprogramme, stats?.data.doCombo)}
                      />
                    )}
                    <BreakdownBarChart
                      byStartYear
                      data={stats?.data?.graduationTimes[track]?.medians?.basic}
                      title={getGraduationGraphTitle(studyprogramme, false)}
                    />
                    {combinedProgramme && (
                      <BreakdownBarChart
                        byStartYear
                        data={stats?.data?.graduationTimesSecondProg[combinedProgramme]?.medians?.combo}
                        title={getGraduationGraphTitle(combinedProgramme, true)}
                      />
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
