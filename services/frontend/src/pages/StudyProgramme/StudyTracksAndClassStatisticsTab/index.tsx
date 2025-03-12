import { Alert, AlertTitle, Divider, Stack } from '@mui/material'
import { useEffect, useState } from 'react'

import { getTargetCreditsForProgramme } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { BreakdownBarChart } from '@/components/material/BreakdownBarChart'
import { GraduationTimes } from '@/components/material/GraduationTimes'
import { MedianTimeBarChart } from '@/components/material/MedianTimeBarChart'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'
import { useGetStudyTrackStatsQuery } from '@/redux/studyProgramme'
import { ProgrammeOrStudyTrackGraduationStats, ProgrammeClassSizes, ProgrammeMedians } from '@/shared/types'
import { calculateStats } from '@/util/faculty'
import { getGraduationGraphTitle } from '@/util/studyProgramme'
import { ProgressOfStudents } from './ProgressOfStudents'
import { StudyTrackDataTable } from './StudyTrackDataTable'
import { StudyTrackSelector } from './StudyTrackSelector'
import { YearSelector } from './YearSelector'

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
  const [studyTrack, setStudyTrack] = useState(studyProgramme)
  const [showMedian, setShowMedian] = useState(false)
  const [showPercentages, setShowPercentages] = useState(false)

  const {
    data: studyTrackStats,
    isError,
    isFetching,
    isLoading,
    isSuccess,
  } = useGetStudyTrackStatsQuery({
    id: studyProgramme,
    combinedProgramme,
    specialGroups: specialGroupsExcluded ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED',
    graduated: graduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED',
  })

  useEffect(() => {
    if (!studyTrack && studyTrackStats?.mainStatsByTrack[studyProgramme]) {
      setStudyTrack(studyProgramme)
    }
  }, [studyProgramme, studyTrack, studyTrackStats, specialGroupsExcluded])

  const hasErrors = (isSuccess && !studyTrackStats) || isError
  const isFetchingOrLoading = isFetching || isLoading

  const noData = isSuccess && studyTrackStats.mainStatsByYear && !studyTrackStats.mainStatsByYear.Total.length
  if (noData) {
    return (
      <Alert severity="warning" variant="outlined">
        There is no data available for the selected programme between 2017-{new Date().getFullYear()}
      </Alert>
    )
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

  const studyTrackStatsGraduationStats = {
    basic: {} as {
      studyTrackStatsGraduationStats?: ProgrammeMedians
      studyTrackStatsClassSizes?: ProgrammeClassSizes
    },
    combo: {} as {
      studyTrackStatsGraduationStats?: ProgrammeMedians
      studyTrackStatsClassSizes?: ProgrammeClassSizes
    },
  }

  const hasStudyTracks = Object.keys(studyTrackStats?.studyTracks ?? {}).length > 1 && studyTrack === studyProgramme
  const isStudyProgrammeMode = studyTrack === '' || studyTrack === studyProgramme

  const calculateStudyTrackStats = (combo = false) => {
    if (!studyTrackStats?.graduationTimes) {
      return {}
    }

    const graduationStats = Object.entries(studyTrackStats.graduationTimes).filter(
      ([key]) => key !== 'goals' && key !== studyProgramme
    ) as [string, ProgrammeOrStudyTrackGraduationStats][]

    const studyTrackStatsGraduationStats = graduationStats.reduce((acc, [programme, { medians }]) => {
      for (const { name, amount, statistics, y } of Object.values(combo ? medians.combo : medians.basic)) {
        if (!acc[name]) {
          acc[name] = { data: [], programmes: [programme] }
        } else {
          acc[name].programmes.push(programme)
        }
        acc[name].data.push({ amount, name: programme, statistics, code: programme, median: y })
      }
      return acc
    }, {} as ProgrammeMedians)

    const studyTrackStatsClassSizes: ProgrammeClassSizes = {
      programme: Object.values(
        studyTrackStats.graduationTimes[studyProgramme].medians[combo ? 'combo' : 'basic']
      ).reduce(
        (acc, { name, classSize }) => {
          acc[name] = classSize
          return acc
        },
        {} as Record<string, number>
      ),
      studyTracks: graduationStats.reduce(
        (acc, [programme, { medians }]) => {
          acc[programme] = {}
          for (const { name, classSize } of Object.values(combo ? medians.combo : medians.basic)) {
            acc[programme][name] = classSize
          }
          return acc
        },
        {} as Record<string, Record<string, number>>
      ),
    }

    return { studyTrackStatsGraduationStats, studyTrackStatsClassSizes }
  }

  if (hasStudyTracks && Object.keys(studyTrackStats?.graduationTimes ?? {}).length > 1) {
    studyTrackStatsGraduationStats.basic = calculateStudyTrackStats()
    if (studyTrackStats?.doCombo) {
      studyTrackStatsGraduationStats.combo = calculateStudyTrackStats(true)
    }
  }

  return (
    <Stack gap={2}>
      <Section cypress="study-track-selector">
        <Stack gap={2}>
          <StudyTrackSelector
            setStudyTrack={setStudyTrack}
            studyTrack={studyTrack}
            studyTracks={studyTrackStats?.studyTracks}
          />
          <ToggleContainer>
            <Toggle
              cypress="study-right-toggle"
              disabled={hasErrors || isFetchingOrLoading}
              firstLabel="All study rights"
              infoBoxContent={studyProgrammeToolTips.studyRightToggle}
              secondLabel="Special study rights excluded"
              setValue={setSpecialGroupsExcluded}
              value={specialGroupsExcluded}
            />
            <Toggle
              cypress="graduated-toggle"
              disabled={hasErrors || isFetchingOrLoading}
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
        cypress="study-track-overview"
        infoBoxContent={
          combinedProgramme
            ? studyProgrammeToolTips.studyTrackOverviewCombinedProgramme
            : studyProgrammeToolTips.studyTrackOverview
        }
        isError={hasErrors}
        isLoading={isFetchingOrLoading}
        title={`Students of the study ${isStudyProgrammeMode ? 'programme' : `track ${studyTrack}`} by starting year`}
      >
        {studyTrackStats && (
          <Stack gap={2}>
            <YearSelector studyProgramme={studyProgramme} years={studyTrackStats.years} />
            <Divider />
            <ToggleContainer>
              <Toggle
                firstLabel="Hide percentages"
                secondLabel="Show percentages"
                setValue={setShowPercentages}
                value={showPercentages}
              />
            </ToggleContainer>
            {studyTrackStats && (
              <StudyTrackDataTable
                combinedProgramme={combinedProgramme}
                dataOfAllTracks={studyTrackStats.mainStatsByYear}
                dataOfSingleTrack={
                  studyTrack && studyTrack !== studyProgramme ? studyTrackStats.mainStatsByTrack[studyTrack] : null
                }
                otherCountriesStats={studyTrackStats.otherCountriesCount}
                showPercentages={showPercentages}
                singleTrack={studyTrack !== studyProgramme ? studyTrack : null}
                studyProgramme={studyProgramme}
                studyTracks={studyTrackStats.studyTracks}
                titles={studyTrackStats.populationTitles}
                years={studyTrackStats.years}
              />
            )}
          </Stack>
        )}
      </Section>

      {isStudyProgrammeMode ? (
        <Section
          cypress="progress-of-students"
          infoBoxContent={studyProgrammeToolTips.studyTrackProgress}
          isError={hasErrors}
          isLoading={isFetchingOrLoading}
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
          cypress="average-graduation-times"
          infoBoxContent={
            studyProgramme.includes('MH')
              ? studyProgrammeToolTips.averageGraduationTimesStudyTracksMaster
              : studyProgrammeToolTips.averageGraduationTimesStudyTracks
          }
          isError={hasErrors}
          isLoading={isFetchingOrLoading}
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
                {studyTrackStats.doCombo && studyTrackStatsGraduationStats.combo.studyTrackStatsGraduationStats && (
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
                    isError={false}
                    isLoading={false}
                    level="programme"
                    levelProgrammeData={studyTrackStatsGraduationStats.combo.studyTrackStatsGraduationStats}
                    mode="study track"
                    names={studyTrackStats.studyTracks}
                    showMedian={showMedian}
                    title={getGraduationGraphTitle(studyProgramme, true)}
                    yearLabel="Start year"
                  />
                )}
                {studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats && (
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
                    isError={false}
                    isLoading={false}
                    level="programme"
                    levelProgrammeData={studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats}
                    mode="study track"
                    names={studyTrackStats.studyTracks}
                    showMedian={showMedian}
                    title={getGraduationGraphTitle(studyProgramme, false)}
                    yearLabel="Start year"
                  />
                )}
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
