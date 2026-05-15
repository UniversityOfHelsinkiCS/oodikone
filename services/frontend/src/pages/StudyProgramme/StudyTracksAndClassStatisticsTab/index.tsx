import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'

import { useEffect, useState } from 'react'

import { getTargetCreditsForProgramme } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { GraduationTimes, GraduationTimesProps } from '@/components/GraduationTimes'
import { Section } from '@/components/Section'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetStudyTrackStatsQuery } from '@/redux/studyProgramme'
import { hasAccessToProgrammePopulation } from '@/util/access'
import { calculateStats } from '@/util/faculty'
import { getGraduationGraphTitle } from '@/util/studyProgramme'
import { ProgrammeOrStudyTrackGraduationStats, ProgrammeClassSizes, ProgrammeMedians, MedianEntry } from '@oodikone/shared/types'
import { ProgressOfStudents } from './ProgressOfStudents'
import { StudyTrackDataTable } from './StudyTrackDataTable'
import { StudyTrackSelector } from './StudyTrackSelector'
import { YearSelector } from './YearSelector'

export const StudyTracksAndClassStatisticsTab = ({
  combinedProgramme,
  setSpecialGroupsExcluded,
  specialGroupsExcluded,
  studyProgramme,
}: {
  combinedProgramme: string
  setSpecialGroupsExcluded: (specialGroupsExcluded: boolean) => void
  specialGroupsExcluded: boolean
  studyProgramme: string
}) => {
  const [studyTrack, setStudyTrack] = useState(studyProgramme)
  const [showMedian, setShowMedian] = useState(false)
  const [showPercentages, setShowPercentages] = useState(false)

  const { fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const studyProgrammeRights = programmeRights.map(({ code }) => code)
  const hasAccessToPopulation = hasAccessToProgrammePopulation(
    combinedProgramme,
    fullAccessToStudentData,
    studyProgramme,
    studyProgrammeRights
  )

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

  const progressStats = calculateStats(
    studyTrackStats?.creditCounts,
    studyTrackStats?.graduatedCount,
    getTargetCreditsForProgramme(programmeCode)
  )
  if (progressStats?.chartStats) {
    progressStats.chartStats.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })
  }

  const progressComboStats =
    Object.keys(studyTrackStats?.creditCountsCombo ?? {}).length > 0
      ? calculateStats(
        studyTrackStats?.creditCountsCombo,
        studyTrackStats?.graduatedCount,
        getTargetCreditsForProgramme(programmeCode) + 180
      )
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

  const calculateStudyTrackStats = (combo: boolean) => {
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
          acc[name] = classSize!
          return acc
        },
        {} as Record<string, number>
      ),
      studyTracks: graduationStats.reduce(
        (acc, [programme, { medians }]) => {
          acc[programme] = {}
          for (const { name, classSize } of Object.values(combo ? medians.combo : medians.basic)) {
            acc[programme][name] = classSize!
          }
          return acc
        },
        {} as Record<string, Record<string, number>>
      ),
    }

    return { studyTrackStatsGraduationStats, studyTrackStatsClassSizes }
  }

  if (Object.keys(studyTrackStats?.graduationTimes ?? {}).length > 1) {
    studyTrackStatsGraduationStats.basic = calculateStudyTrackStats(false)
    if (studyTrackStats?.doCombo) {
      studyTrackStatsGraduationStats.combo = calculateStudyTrackStats(true)
    }
  }

  const formatMedianEntries = (item: MedianEntry) => ({ median: item.y, ...item })

  const graduationTimeCommonProps: Omit<GraduationTimesProps, 'data' | 'goal' | 'title'> = {
    allowExpand: hasStudyTracks,
    isError: hasErrors,
    isLoading: isFetchingOrLoading,
    goalExceptions: { needed: false },

    names: studyTrackStats?.studyTracks,
    showMedian: showMedian,

    level: "programme",
    mode: "programme",
    yearLabel: "Start year",
  } as const

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
        {!!studyTrackStats && (
          <Stack gap={2}>
            {hasAccessToPopulation && (
              <>
                <YearSelector
                  studyProgramme={studyProgramme}
                  studyTrack={studyTrack !== studyProgramme ? studyTrack : undefined}
                  years={studyTrackStats.years}
                />
                <Divider />
              </>
            )}
            <ToggleContainer>
              <Toggle
                firstLabel="Hide percentages"
                secondLabel="Show percentages"
                setValue={setShowPercentages}
                value={showPercentages}
              />
            </ToggleContainer>
            {!!studyTrackStats && (
              <StudyTrackDataTable
                combinedProgramme={combinedProgramme}
                dataOfAllTracks={studyTrackStats.mainStatsByYear}
                dataOfSingleTrack={
                  studyTrack && studyTrack !== studyProgramme ? studyTrackStats.mainStatsByTrack[studyTrack] : null
                }
                otherCountriesStats={studyTrackStats.otherCountriesCount}
                populationLinkVisible={hasAccessToPopulation}
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
          title="Progress of students of the degree programme by starting year"
        >
          {!!studyTrackStats && (
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
            Progress data is currently only available for all students of the degree programme. Please select ”All
            students of the programme” to view the progress data.
          </Alert>
        </Section>
      )}

      {isSuccess && studyTrack in studyTrackStats?.graduationTimes && (
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
                {studyTrackStats.doCombo && !!studyTrackStatsGraduationStats.combo.studyTrackStatsGraduationStats && (
                  <GraduationTimes
                    classSizes={studyTrackStatsGraduationStats.combo.studyTrackStatsClassSizes!}
                    data={studyTrackStats.graduationTimes[studyProgramme].medians.combo.map(formatMedianEntries)}
                    goal={studyTrackStats.graduationTimes.goals.combo}
                    title={getGraduationGraphTitle(studyProgramme, true)}
                    {...graduationTimeCommonProps}
                  />
                )}
                {!!studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats && (
                  <GraduationTimes
                    classSizes={studyTrackStatsGraduationStats.basic.studyTrackStatsClassSizes!}
                    data={studyTrackStats.graduationTimes[studyProgramme].medians.basic.map(formatMedianEntries)}
                    goal={studyTrackStats.graduationTimes.goals.basic}
                    levelProgrammeData={studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats}
                    title={getGraduationGraphTitle(studyProgramme, false)}
                    {...graduationTimeCommonProps}
                  />
                )}
              </Stack>
            ) : (
              <Stack gap={2} >
                {studyTrackStats.doCombo && (
                  <GraduationTimes
                    data={studyTrackStats.graduationTimes[studyTrack].medians.combo.map(formatMedianEntries)}
                    goal={studyTrackStats.graduationTimes.goals.combo}
                    title={getGraduationGraphTitle(studyProgramme, true)}
                    {...graduationTimeCommonProps}
                  />
                )}
                <GraduationTimes
                  classSizes={studyTrackStatsGraduationStats.basic.studyTrackStatsClassSizes}
                  data={studyTrackStats.graduationTimes[studyTrack].medians.basic.map(formatMedianEntries)}
                  goal={studyTrackStats.graduationTimes.goals.basic}
                  title={getGraduationGraphTitle(studyProgramme, false)}
                  {...graduationTimeCommonProps}
                />
                {!!combinedProgramme && (
                  <GraduationTimes
                    data={studyTrackStats.graduationTimesSecondProg[combinedProgramme].medians.combo.map(formatMedianEntries)}
                    classSizes={studyTrackStatsGraduationStats.combo.studyTrackStatsClassSizes!}
                    goal={studyTrackStats.graduationTimesSecondProg.goals.combo}
                    title={getGraduationGraphTitle(combinedProgramme, true)}
                    {...graduationTimeCommonProps}
                  />
                )}
              </Stack>
            )}
          </Stack>
        </Section>
      )}
    </Stack>
  )
}
