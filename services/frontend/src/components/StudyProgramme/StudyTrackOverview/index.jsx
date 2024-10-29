import { useEffect, useState } from 'react'
import { Divider, Loader, Message } from 'semantic-ui-react'

import { getGraduationGraphTitle, getTargetCreditsForProgramme } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { calculateStats } from '@/components/FacultyStatistics/FacultyProgrammeOverview'
import { GraduationTimes } from '@/components/FacultyStatistics/TimesAndPaths/GraduationTimes'
import { InfoBox } from '@/components/InfoBox'
import { BreakdownBarChart } from '@/components/StudyProgramme/BreakdownBarChart'
import { MedianTimeBarChart } from '@/components/StudyProgramme/MedianTimeBarChart'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import '@/components/StudyProgramme/studyprogramme.css'
import { useGetStudytrackStatsQuery } from '@/redux/studyProgramme'
import { ProgressOfStudents } from './ProgressOfStudents'
import { StudyTrackDataTable } from './StudyTrackDataTable'
import { StudyTrackSelector } from './StudyTrackSelector'

export const StudyTrackOverview = ({
  combinedProgramme,
  graduated,
  setGraduated,
  setSpecialGroupsExcluded,
  specialGroupsExcluded,
  studyProgramme,
}) => {
  const [showMedian, setShowMedian] = useState(false)
  const [track, setTrack] = useState(studyProgramme)
  const special = specialGroupsExcluded ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const grad = graduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const stats = useGetStudytrackStatsQuery({
    id: studyProgramme,
    combinedProgramme,
    specialGroups: special,
    graduated: grad,
  })
  useEffect(() => {
    if (!track && stats?.data?.mainStatsByTrack[studyProgramme]) {
      setTrack(studyProgramme)
    }
  }, [studyProgramme, track, stats, specialGroupsExcluded])

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <InfoBox content={studyProgrammeToolTips[toolTipText]} />
      </div>
    </>
  )

  const isError = (stats.isSuccess && !stats.data) || stats.isError

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  const noData = stats.isSuccess && stats.mainStatsByYear && !stats.mainStatsByYear.Total.length
  if (noData) return <h3>There is no data available for the selected programme between 2017-2022</h3>
  const infoTextGraduationTimes = studyProgramme.includes('MH')
    ? 'AverageGraduationTimesStudyTracksMaster'
    : 'AverageGraduationTimesStudyTracks'
  const infoTextStudentTable = combinedProgramme ? 'StudyTrackOverviewCombinedProgramme' : 'StudyTrackOverview'

  const programmeCode = combinedProgramme ? `${studyProgramme}-${combinedProgramme}` : studyProgramme

  const progressStats = calculateStats(stats?.data?.creditCounts, getTargetCreditsForProgramme(programmeCode))
  if (progressStats?.chartStats) {
    progressStats.chartStats.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })
  }

  const progressComboStats =
    Object.keys(stats?.data?.creditCountsCombo || {}).length > 0
      ? calculateStats(stats.data.creditCountsCombo, getTargetCreditsForProgramme(programmeCode) + 180)
      : null

  if (progressComboStats?.chartStats) {
    progressComboStats.chartStats.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })
  }

  const studyTrackStatsGraduationStats = { basic: {}, combo: {} }

  // One of the study track options is always the study programme itself
  const studyProgrammeHasStudyTracks =
    Object.keys(stats?.data?.studytrackOptions || {}).length > 1 && track === studyProgramme

  const calculateStudyTrackStats = combo => {
    const studyTrackStatsGraduationStats = Object.entries(stats.data.graduationTimes)
      .filter(([key]) => key !== 'goals' && key !== studyProgramme)
      .reduce((acc, [programme, { medians }]) => {
        for (const { name, amount, statistics, y } of Object.values(combo ? medians.combo : medians.basic)) {
          if (!acc[name]) {
            acc[name] = { data: [], programmes: [programme] }
          } else {
            acc[name].programmes.push(programme)
          }
          acc[name].data.push({ amount, name: programme, statistics, code: programme, median: y })
        }
        return acc
      }, {})

    const studyTrackStatsClassSizes = {
      programmes: Object.entries(stats.data.graduationTimes)
        .filter(([key]) => key !== 'goals' && key !== studyProgramme)
        .reduce((acc, [programme, { medians }]) => {
          acc[programme] = {}
          for (const { name, classSize } of Object.values(combo ? medians.combo : medians.basic)) {
            acc[programme][name] = classSize
          }
          return acc
        }, {}),
      [studyProgramme]: Object.values(
        stats.data.graduationTimes[studyProgramme].medians[combo ? 'combo' : 'basic']
      ).reduce((acc, { name, classSize }) => {
        acc[name] = classSize
        return acc
      }, {}),
    }

    return { studyTrackStatsGraduationStats, studyTrackStatsClassSizes }
  }

  if (studyProgrammeHasStudyTracks && Object.keys(stats?.data?.graduationTimes || {}).length > 1) {
    studyTrackStatsGraduationStats.basic = calculateStudyTrackStats()
    if (stats?.data?.doCombo) {
      studyTrackStatsGraduationStats.combo = calculateStudyTrackStats(true)
    }
  }

  return (
    <div className="studytrack-overview">
      {stats.isLoading || stats.isFetching ? (
        <Loader active style={{ marginTop: '10em' }} />
      ) : (
        <>
          <StudyTrackSelector setTrack={setTrack} studyTracks={stats?.data?.studytrackOptions} track={track} />
          <div className="toggle-container">
            <Toggle
              cypress="StudentToggle"
              firstLabel="All study rights"
              secondLabel="Special study rights excluded"
              setValue={setSpecialGroupsExcluded}
              toolTips={studyProgrammeToolTips.StudentToggle}
              value={specialGroupsExcluded}
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
              track === '' || track === studyProgramme
                ? 'the study programme by starting year'
                : `the study track ${track} by starting year`
            }`,
            infoTextStudentTable
          )}
          <StudyTrackDataTable
            combinedProgramme={combinedProgramme}
            dataOfAllTracks={stats?.data?.mainStatsByYear}
            dataOfSingleTrack={track && track !== studyProgramme ? stats?.data?.mainStatsByTrack[track] : null}
            otherCountriesStats={stats?.data?.otherCountriesCount}
            singleTrack={track !== studyProgramme && track}
            studyProgramme={studyProgramme}
            studyTracks={stats?.data?.studytrackOptions}
            titles={stats?.data?.populationTitles}
            years={stats?.data?.years}
          />

          {track === '' || track === studyProgramme ? (
            <>
              {getDivider('Progress of students of the study programme by starting year', 'StudyTrackProgress')}
              <ProgressOfStudents
                progressComboStats={progressComboStats}
                progressStats={progressStats}
                track={track || studyProgramme}
                years={stats?.data?.years}
              />
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Divider content={`Progress of students of the study track ${track} by starting year`} horizontal />
              <Message
                content="Currently progress data is only available for all students of the study programme. Please select ”All students of the programme” to view the progress data."
                header="Data not available"
                icon="info circle"
                style={{ marginBottom: '2rem', marginTop: '2rem', maxWidth: '60%' }}
                warning
              />
            </div>
          )}
          {stats?.isSuccess && stats?.data?.includeGraduated && stats?.data?.graduationTimes[track] && (
            <>
              {getDivider('Average graduation times by starting year', infoTextGraduationTimes)}
              <Toggle
                cypress="GraduationTimeToggle"
                firstLabel="Breakdown"
                secondLabel="Median times"
                setValue={setShowMedian}
                value={showMedian}
              />
              {studyProgrammeHasStudyTracks ? (
                <div className="section-container-centered">
                  {stats?.data.doCombo && (
                    <GraduationTimes
                      classSizes={studyTrackStatsGraduationStats.combo.studyTrackStatsClassSizes}
                      data={stats.data.graduationTimes[studyProgramme].medians.combo.map(year => ({
                        amount: year.amount,
                        name: year.name,
                        statistics: year.statistics,
                        times: null,
                        median: year.y,
                      }))}
                      goal={stats.data.graduationTimes.goals.combo}
                      goalExceptions={{ needed: false }}
                      level={studyProgramme}
                      levelProgrammeData={studyTrackStatsGraduationStats.combo.studyTrackStatsGraduationStats}
                      mode="study track"
                      programmeNames={stats.data.studytrackOptions}
                      showMedian={showMedian}
                      title={getGraduationGraphTitle(studyProgramme, true)}
                      yearLabel="Start year"
                    />
                  )}
                  <GraduationTimes
                    classSizes={studyTrackStatsGraduationStats.basic.studyTrackStatsClassSizes}
                    data={stats.data.graduationTimes[studyProgramme].medians.basic.map(year => ({
                      amount: year.amount,
                      name: year.name,
                      statistics: year.statistics,
                      times: null,
                      median: year.y,
                    }))}
                    goal={stats.data.graduationTimes.goals.basic}
                    goalExceptions={{ needed: false }}
                    level={studyProgramme}
                    levelProgrammeData={studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats}
                    mode="study track"
                    programmeNames={stats.data.studytrackOptions}
                    showMedian={showMedian}
                    title={getGraduationGraphTitle(studyProgramme, false)}
                    yearLabel="Start year"
                  />
                </div>
              ) : (
                <div className="section-container-centered">
                  {showMedian ? (
                    <div className="section-container">
                      {stats?.data.doCombo && (
                        <MedianTimeBarChart
                          byStartYear
                          data={stats?.data?.graduationTimes[track].medians.combo}
                          goal={stats?.data?.graduationTimes.goals.combo}
                          title={getGraduationGraphTitle(studyProgramme, stats?.data.doCombo)}
                        />
                      )}
                      <MedianTimeBarChart
                        byStartYear
                        data={stats?.data?.graduationTimes[track].medians.basic}
                        goal={stats?.data?.graduationTimes.goals.basic}
                        title={getGraduationGraphTitle(studyProgramme, false)}
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
                          title={getGraduationGraphTitle(studyProgramme, stats?.data.doCombo)}
                        />
                      )}
                      <BreakdownBarChart
                        byStartYear
                        data={stats?.data?.graduationTimes[track]?.medians?.basic}
                        title={getGraduationGraphTitle(studyProgramme, false)}
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
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
