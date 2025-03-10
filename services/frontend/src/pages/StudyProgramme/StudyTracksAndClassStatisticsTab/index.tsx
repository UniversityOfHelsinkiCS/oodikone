import { Alert, AlertTitle, Stack } from '@mui/material'
import { useEffect, useState } from 'react'
import { Loader } from 'semantic-ui-react'

import { getTargetCreditsForProgramme } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { BreakdownBarChart } from '@/components/material/BreakdownBarChart'
import { GraduationTimes } from '@/components/material/GraduationTimes'
import { MedianTimeBarChart } from '@/components/material/MedianTimeBarChart'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'
import { useGetStudyTrackStatsQuery } from '@/redux/studyProgramme'
import { calculateStats } from '@/util/faculty'
import { getGraduationGraphTitle } from '@/util/studyProgramme'
import { ProgressOfStudents } from './ProgressOfStudents'
import { StudyTrackDataTable } from './StudyTrackDataTable'
import { StudyTrackSelector } from './StudyTrackSelector'

export const StudyTracksAndClassStatisticsTab = ({
  combinedProgramme,
  graduated,
  setGraduated,
  setSpecialGroupsExcluded,
  specialGroupsExcluded,
  studyProgramme,
}: {
  combinedProgramme: string
  graduated: boolean
  setGraduated: (graduated: boolean) => void
  setSpecialGroupsExcluded: (specialGroupsExcluded: boolean) => void
  specialGroupsExcluded: boolean
  studyProgramme: string
}) => {
  const [showMedian, setShowMedian] = useState(false)
  const [studyTrack, setStudyTrack] = useState(studyProgramme)
  const [showPercentages, setShowPercentages] = useState(false)

  const special = specialGroupsExcluded ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const grad = graduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const {
    data: studyTrackStats,
    isError,
    isFetching,
    isLoading,
    isSuccess,
  } = useGetStudyTrackStatsQuery({
    id: studyProgramme,
    combinedProgramme,
    specialGroups: special,
    graduated: grad,
  })

  useEffect(() => {
    if (!studyTrack && studyTrackStats?.mainStatsByTrack[studyProgramme]) {
      setStudyTrack(studyProgramme)
    }
  }, [studyProgramme, studyTrack, studyTrackStats, specialGroupsExcluded])

  const hasErrors = (isSuccess && !studyTrackStats) || isError
  if (hasErrors) {
    return <h3>Something went wrong, please try refreshing the page.</h3>
  }

  const noData = isSuccess && studyTrackStats.mainStatsByYear && !studyTrackStats.mainStatsByYear.Total.length
  if (noData) {
    return <h3>There is no data available for the selected programme between 2017-2022</h3>
  }

  const programmeCode = combinedProgramme ? `${studyProgramme}-${combinedProgramme}` : studyProgramme

  const progressStats = calculateStats(studyTrackStats?.creditCounts, getTargetCreditsForProgramme(programmeCode))
  if (progressStats?.chartStats) {
    progressStats.chartStats.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })
  }

  const progressComboStats =
    Object.keys(studyTrackStats?.creditCountsCombo ?? {}).length > 0
      ? calculateStats(studyTrackStats?.creditCountsCombo, getTargetCreditsForProgramme(programmeCode) + 180)
      : null

  if (progressComboStats?.chartStats) {
    progressComboStats.chartStats.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })
  }

  const studyTrackStatsGraduationStats = { basic: {}, combo: {} }

  const hasStudyTracks = Object.keys(studyTrackStats?.studyTracks ?? {}).length > 1 && studyTrack === studyProgramme

  const calculateStudyTrackStats = (combo = false) => {
    if (!studyTrackStats?.graduationTimes) {
      return {}
    }

    const studyTrackStatsGraduationStats = Object.entries(studyTrackStats.graduationTimes)
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
      programmes: Object.entries(studyTrackStats.graduationTimes)
        .filter(([key]) => key !== 'goals' && key !== studyProgramme)
        .reduce((acc, [programme, { medians }]) => {
          acc[programme] = {}
          for (const { name, classSize } of Object.values(combo ? medians.combo : medians.basic)) {
            acc[programme][name] = classSize
          }
          return acc
        }, {}),
      [studyProgramme]: Object.values(
        studyTrackStats.graduationTimes[studyProgramme].medians[combo ? 'combo' : 'basic']
      ).reduce((acc, { name, classSize }) => {
        acc[name] = classSize
        return acc
      }, {}),
    }

    return { studyTrackStatsGraduationStats, studyTrackStatsClassSizes }
  }

  if (hasStudyTracks && Object.keys(studyTrackStats?.graduationTimes ?? {}).length > 1) {
    studyTrackStatsGraduationStats.basic = calculateStudyTrackStats()
    if (studyTrackStats?.doCombo) {
      studyTrackStatsGraduationStats.combo = calculateStudyTrackStats(true)
    }
  }

  // TODO: Replace with section status
  if (isLoading || isFetching) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  return (
    <Stack gap={2}>
      <Section>
        <Stack gap={2}>
          <StudyTrackSelector
            setStudyTrack={setStudyTrack}
            studyTrack={studyTrack}
            studyTracks={studyTrackStats?.studyTracks}
          />
          <ToggleContainer>
            <Toggle
              cypress="study-right-toggle"
              disabled={isError || isFetching || isLoading}
              firstLabel="All study rights"
              infoBoxContent={studyProgrammeToolTips.studyRightToggle}
              secondLabel="Special study rights excluded"
              setValue={setSpecialGroupsExcluded}
              value={specialGroupsExcluded}
            />
            <Toggle
              cypress="graduated-toggle"
              disabled={isError || isFetching || isLoading}
              firstLabel="Graduated included"
              infoBoxContent={studyProgrammeToolTips.graduatedToggle}
              secondLabel="Graduated excluded"
              setValue={setGraduated}
              value={graduated}
            />
          </ToggleContainer>
        </Stack>
      </Section>

      <Section
        infoBoxContent={
          combinedProgramme
            ? studyProgrammeToolTips.studyTrackOverviewCombinedProgramme
            : studyProgrammeToolTips.studyTrackOverview
        }
        // TODO: isError={}
        // TODO: isLoading={}
        title={`Students of ${
          studyTrack === '' || studyTrack === studyProgramme
            ? 'the study programme by starting year'
            : `the study track ${studyTrack} by starting year`
        }`}
      >
        <Stack gap={2}>
          <ToggleContainer>
            <Toggle
              firstLabel="Hide percentages"
              secondLabel="Show percentages"
              setValue={setShowPercentages}
              value={showPercentages}
            />
          </ToggleContainer>
          {/* Implement a way to select a subset of years */}
          {studyTrackStats && (
            <StudyTrackDataTable
              combinedProgramme={combinedProgramme}
              dataOfAllTracks={studyTrackStats?.mainStatsByYear}
              dataOfSingleTrack={
                studyTrack && studyTrack !== studyProgramme ? studyTrackStats?.mainStatsByTrack[studyTrack] : null
              }
              otherCountriesStats={studyTrackStats?.otherCountriesCount}
              showPercentages={showPercentages}
              singleTrack={studyTrack !== studyProgramme ? studyTrack : null}
              studyProgramme={studyProgramme}
              studyTracks={studyTrackStats?.studyTracks}
              titles={studyTrackStats?.populationTitles}
              years={studyTrackStats?.years}
            />
          )}
        </Stack>
      </Section>

      {studyTrack === '' || studyTrack === studyProgramme ? (
        <Section
          infoBoxContent={studyProgrammeToolTips.studyTrackProgress}
          // TODO: isError={}
          // TODO: isLoading={}
          title="Progress of students of the study programme by starting year"
        >
          {studyTrackStats && (
            <ProgressOfStudents
              progressComboStats={progressComboStats}
              progressStats={progressStats}
              studyProgramme={studyProgramme}
              years={studyTrackStats.years}
            />
          )}
        </Section>
      ) : (
        <Section title={`Progress of students of the study track ${studyTrack} by starting year`}>
          <Alert severity="info" variant="outlined">
            <AlertTitle>Date unavailable</AlertTitle>
            Progress data is currently only available for all students of the study programme. Please select ”All
            students of the programme” to view the progress data.
          </Alert>
        </Section>
      )}

      {isSuccess && studyTrackStats?.includeGraduated && studyTrackStats?.graduationTimes[studyTrack] && (
        <Section
          infoBoxContent={
            studyProgramme.includes('MH')
              ? studyProgrammeToolTips.averageGraduationTimesStudyTracksMaster
              : studyProgrammeToolTips.averageGraduationTimesStudyTracks
          }
          // TODO: isError={}
          // TODO: isLoading={}
          title="Average graduation times by starting year"
        >
          <Stack gap={2}>
            <ToggleContainer>
              <Toggle
                cypress="graduation-time-toggle"
                firstLabel="Breakdown"
                secondLabel="Median times"
                setValue={setShowMedian}
                value={showMedian}
              />
            </ToggleContainer>
            {hasStudyTracks ? (
              <Stack gap={2}>
                {studyTrackStats?.doCombo && (
                  <GraduationTimes
                    classSizes={studyTrackStatsGraduationStats.combo.studyTrackStatsClassSizes}
                    data={studyTrackStats.graduationTimes[studyProgramme].medians.combo.map(year => ({
                      amount: year.amount,
                      median: year.y,
                      name: year.name,
                      statistics: year.statistics,
                      times: null,
                    }))}
                    goal={studyTrackStats.graduationTimes.goals.combo}
                    goalExceptions={{ needed: false }}
                    level={studyProgramme}
                    levelProgrammeData={studyTrackStatsGraduationStats.combo.studyTrackStatsGraduationStats}
                    mode="study track"
                    names={studyTrackStats.studyTracks}
                    showMedian={showMedian}
                    title={getGraduationGraphTitle(studyProgramme, true)}
                    yearLabel="Start year"
                  />
                )}
                <GraduationTimes
                  classSizes={studyTrackStatsGraduationStats.basic.studyTrackStatsClassSizes}
                  data={studyTrackStats.graduationTimes[studyProgramme].medians.basic.map(year => ({
                    amount: year.amount,
                    median: year.y,
                    name: year.name,
                    statistics: year.statistics,
                    times: null,
                  }))}
                  goal={studyTrackStats.graduationTimes.goals.basic}
                  goalExceptions={{ needed: false }}
                  level={studyProgramme}
                  levelProgrammeData={studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats}
                  mode="study track"
                  names={studyTrackStats.studyTracks}
                  showMedian={showMedian}
                  title={getGraduationGraphTitle(studyProgramme, false)}
                  yearLabel="Start year"
                />
              </Stack>
            ) : (
              <Stack gap={2}>
                {showMedian ? (
                  <>
                    {studyTrackStats.doCombo && (
                      <MedianTimeBarChart
                        byStartYear
                        data={studyTrackStats?.graduationTimes[studyTrack].medians.combo}
                        goal={studyTrackStats?.graduationTimes.goals.combo}
                        title={getGraduationGraphTitle(studyProgramme, studyTrackStats.doCombo)}
                      />
                    )}
                    <MedianTimeBarChart
                      byStartYear
                      data={studyTrackStats?.graduationTimes[studyTrack].medians.basic}
                      goal={studyTrackStats?.graduationTimes.goals.basic}
                      title={getGraduationGraphTitle(studyProgramme, false)}
                    />
                    {combinedProgramme && (
                      <MedianTimeBarChart
                        byStartYear
                        data={studyTrackStats?.graduationTimesSecondProg[combinedProgramme]?.medians?.combo}
                        goal={studyTrackStats?.graduationTimesSecondProg.goals.combo}
                        title={getGraduationGraphTitle(combinedProgramme, true)}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {studyTrackStats.doCombo && (
                      <BreakdownBarChart
                        byStartYear
                        data={studyTrackStats?.graduationTimes[studyTrack]?.medians?.combo}
                        title={getGraduationGraphTitle(studyProgramme, studyTrackStats.doCombo)}
                      />
                    )}
                    <BreakdownBarChart
                      byStartYear
                      data={studyTrackStats?.graduationTimes[studyTrack]?.medians?.basic}
                      title={getGraduationGraphTitle(studyProgramme, false)}
                    />
                    {combinedProgramme && (
                      <BreakdownBarChart
                        byStartYear
                        data={studyTrackStats?.graduationTimesSecondProg[combinedProgramme]?.medians?.combo}
                        title={getGraduationGraphTitle(combinedProgramme, true)}
                      />
                    )}
                  </>
                )}
              </Stack>
            )}
          </Stack>
        </Section>
      )}
    </Stack>
  )
}
