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
import { StudytrackDataTable } from './StudytrackDataTable'
import { StudytrackSelector } from './StudytrackSelector'

export const StudytrackOverview = ({
  combinedProgramme,
  graduated,
  setGraduated,
  setSpecialGroupsExcluded,
  specialGroupsExcluded,
  studyprogramme,
}) => {
  const [showMedian, setShowMedian] = useState(false)
  const [track, setTrack] = useState(studyprogramme)
  const special = specialGroupsExcluded ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
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
  }, [studyprogramme, track, stats, specialGroupsExcluded])

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
  const infoTextGraduationTimes = studyprogramme.includes('MH')
    ? 'AverageGraduationTimesStudytracksMaster'
    : 'AverageGraduationTimesStudytracks'
  const infoTextStudentTable = combinedProgramme ? 'StudytrackOverviewCombinedProgramme' : 'StudytrackOverview'

  const programmeCode = combinedProgramme ? `${studyprogramme}-${combinedProgramme}` : studyprogramme

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
    Object.keys(stats?.data?.studytrackOptions || {}).length > 1 && track === studyprogramme

  const calculateStudyTrackStats = combo => {
    const studyTrackStatsGraduationStats = Object.entries(stats.data.graduationTimes)
      .filter(([key]) => key !== 'goals' && key !== studyprogramme)
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
        .filter(([key]) => key !== 'goals' && key !== studyprogramme)
        .reduce((acc, [programme, { medians }]) => {
          acc[programme] = {}
          for (const { name, classSize } of Object.values(combo ? medians.combo : medians.basic)) {
            acc[programme][name] = classSize
          }
          return acc
        }, {}),
      [studyprogramme]: Object.values(
        stats.data.graduationTimes[studyprogramme].medians[combo ? 'combo' : 'basic']
      ).reduce((acc, { name, classSize }) => {
        acc[name] = classSize
        return acc
      }, {}),
    }

    return { studyTrackStatsGraduationStats, studyTrackStatsClassSizes }
  }

  if (studyProgrammeHasStudyTracks && Object.keys(stats?.data?.graduationTimes || {}).length > 0) {
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
          <StudytrackSelector setTrack={setTrack} studytracks={stats?.data?.studytrackOptions} track={track} />
          <div className="toggle-container">
            <Toggle
              cypress="StudentToggle"
              firstLabel="All studyrights"
              secondLabel="Special studyrights excluded"
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

          {track === '' || track === studyprogramme ? (
            <>
              {getDivider('Progress of students of the studyprogramme by starting year', 'StudytrackProgress')}
              <ProgressOfStudents
                progressComboStats={progressComboStats}
                progressStats={progressStats}
                track={track || studyprogramme}
                years={stats?.data?.years}
              />
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Divider content={`Progress of students of the studytrack ${track} by starting year`} horizontal />
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
                      data={stats.data.graduationTimes[studyprogramme].medians.combo.map(year => ({
                        amount: year.amount,
                        name: year.name,
                        statistics: year.statistics,
                        times: null,
                        median: year.y,
                      }))}
                      goal={stats.data.graduationTimes.goals.combo}
                      goalExceptions={{ needed: false }}
                      level={studyprogramme}
                      levelProgrammeData={studyTrackStatsGraduationStats.combo.studyTrackStatsGraduationStats}
                      mode="study track"
                      programmeNames={stats.data.studytrackOptions}
                      showMedian={showMedian}
                      title={getGraduationGraphTitle(studyprogramme, true)}
                      yearLabel="Start year"
                    />
                  )}
                  <GraduationTimes
                    classSizes={studyTrackStatsGraduationStats.basic.studyTrackStatsClassSizes}
                    data={stats.data.graduationTimes[studyprogramme].medians.basic.map(year => ({
                      amount: year.amount,
                      name: year.name,
                      statistics: year.statistics,
                      times: null,
                      median: year.y,
                    }))}
                    goal={stats.data.graduationTimes.goals.basic}
                    goalExceptions={{ needed: false }}
                    level={studyprogramme}
                    levelProgrammeData={studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats}
                    mode="study track"
                    programmeNames={stats.data.studytrackOptions}
                    showMedian={showMedian}
                    title={getGraduationGraphTitle(studyprogramme, false)}
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
                          title={getGraduationGraphTitle(studyprogramme, stats?.data.doCombo)}
                        />
                      )}
                      <MedianTimeBarChart
                        byStartYear
                        data={stats?.data?.graduationTimes[track].medians.basic}
                        goal={stats?.data?.graduationTimes.goals.basic}
                        title={getGraduationGraphTitle(studyprogramme, false)}
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
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
