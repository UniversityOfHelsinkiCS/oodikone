/* eslint no-unsafe-optional-chaining: "warn" */
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'

import { useEffect, useState } from 'react'

import { getTargetCreditsForProgramme } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { GraduationTimes, GraduationTimesProps } from '@/components/GraduationTimes'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetStudyTrackStatsQuery } from '@/redux/studyProgramme'
import { hasAccessToProgrammePopulation } from '@/util/access'
import { calculateStats } from '@/util/faculty'
import { getGraduationGraphTitle } from '@/util/studyProgramme'
import {
  ProgrammeOrStudyTrackGraduationStats,
  ProgrammeClassSizes,
  ProgrammeMedians,
  MedianEntry,
} from '@oodikone/shared/types'
import { exportStudentTable } from './exportStudentTable'
import { ProgressOfStudents } from './ProgressOfStudents'
import { StudentProgressPercentiles } from './StudentProgressPercentiles'
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
  const { getTextIn } = useLanguage()

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
    isSuccess,
  } = useGetStudyTrackStatsQuery({
    id: studyProgramme,
    combinedProgramme,
    specialGroups: specialGroupsExcluded ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED',
  })

  useEffect(() => {
    if (!studyTrack && studyTrackStats?.mainStatsByTrack[studyProgramme]) setStudyTrack(studyProgramme)
  }, [studyProgramme, studyTrack, studyTrackStats, specialGroupsExcluded])

  const hasErrors = (isSuccess && !studyTrackStats) || isError

  if (isSuccess && !studyTrackStats?.mainStatsByYear.Total?.length) {
    return (
      <Alert severity="warning" variant="outlined">
        There is no data available for the selected programme between 2017-{new Date().getFullYear()}
      </Alert>
    )
  }

  const programmeCode = combinedProgramme ? `${studyProgramme}-${combinedProgramme}` : studyProgramme
  const targetCredits = getTargetCreditsForProgramme(programmeCode)

  const getProgressStats = () => {
    const creditCounts =
      studyTrack === studyProgramme ? studyTrackStats?.creditCounts : studyTrackStats?.creditCountsByTrack[studyTrack]

    const graduatedCount =
      studyTrack === studyProgramme
        ? studyTrackStats?.graduatedCount
        : studyTrackStats?.graduatedCountByTrack[studyTrack]

    const progressStats = calculateStats(creditCounts, graduatedCount, targetCredits)
    progressStats?.chartStats.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })

    return progressStats
  }

  const getProgressComboStats = () => {
    const creditCounts =
      studyTrack === studyProgramme
        ? studyTrackStats?.creditCountsCombo
        : studyTrackStats?.creditCountsComboByTrack[studyTrack]

    const graduatedCount =
      studyTrack === studyProgramme
        ? studyTrackStats?.graduatedCount
        : studyTrackStats?.graduatedCountByTrack[studyTrack]

    const progressComboStats =
      Object.keys(studyTrackStats?.creditCountsCombo ?? {}).length > 0
        ? calculateStats(creditCounts, graduatedCount, targetCredits + 180)
        : null

    progressComboStats?.chartStats?.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })

    return progressComboStats
  }

  const hasStudyTracks = Object.keys(studyTrackStats?.studyTracks ?? {}).length > 1 && studyTrack === studyProgramme
  const isStudyProgrammeMode = studyTrack === '' || studyTrack === studyProgramme

  const calculateStudyTrackStats = (combo = false) => {
    if (!studyTrackStats?.graduationTimes) return {}

    const graduationStats = Object.entries(studyTrackStats.graduationTimes).filter(
      ([key]) => key !== 'goals' && key !== studyProgramme
    ) as [string, ProgrammeOrStudyTrackGraduationStats][]

    const studyTrackStatsGraduationStats = graduationStats.reduce<ProgrammeMedians>((acc, [programme, { medians }]) => {
      for (const { name, amount, statistics, y } of Object.values(combo ? medians.combo : medians.basic)) {
        acc[name] ??= { data: [], programmes: [] }
        acc[name].programmes.push(programme)
        acc[name].data.push({ amount, name: programme, statistics, code: programme, median: y })
      }

      return acc
    }, {})

    // NOTE: Assigning undefined to a field "should" set it to not be active.
    //       The behaviour is not really guaranteed, so it should be delete instead.
    //       Asserting the correctness of the value is acceptable.
    const studyTrackStatsClassSizes: ProgrammeClassSizes = {
      programme: Object.fromEntries(
        Object.values(studyTrackStats.graduationTimes[studyProgramme].medians[combo ? 'combo' : 'basic']).map(
          ({ name, classSize }) => [name, classSize!]
        )
      ),
      studyTracks: graduationStats.reduce((acc, [programme, { medians }]) => {
        acc[programme] ??= {}
        Object.values(combo ? medians.combo : medians.basic).forEach(
          ({ name, classSize }) => (acc[programme][name] = classSize!)
        )

        return acc
      }, {}),
    }

    return { studyTrackStatsGraduationStats, studyTrackStatsClassSizes }
  }

  type gradStats = {
    studyTrackStatsGraduationStats?: ProgrammeMedians
    studyTrackStatsClassSizes?: ProgrammeClassSizes
  }

  const studyTrackStatsGraduationStats: {
    basic: gradStats
    combo: gradStats
  } =
    hasStudyTracks && Object.keys(studyTrackStats?.graduationTimes ?? {}).length > 1
      ? {
          basic: calculateStudyTrackStats(),
          combo: studyTrackStats?.doCombo ? calculateStudyTrackStats(true) : {},
        }
      : {
          basic: {},
          combo: {},
        }

  const formatMedianEntries = (item: MedianEntry) => ({ median: item.y, ...item })

  const graduationTimeCommonProps: Omit<GraduationTimesProps, 'data' | 'goal' | 'title'> = {
    allowExpand: hasStudyTracks,
    isError: hasErrors,
    isLoading: isFetching,
    goalExceptions: { needed: false },

    names: studyTrackStats?.studyTracks,
    showMedian,

    mode: 'study track',
    yearLabel: 'Start year',
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
              disabled={hasErrors || isFetching}
              firstLabel="All study rights"
              infoBoxContent={studyProgrammeToolTips.common.studyRightToggle}
              secondLabel="Special study rights excluded"
              setValue={setSpecialGroupsExcluded}
              value={specialGroupsExcluded}
            />
          </ToggleContainer>
        </Stack>
      </Section>

      <Section
        cypress="study-track-overview"
        exportOnClick={() => exportStudentTable(studyTrackStats, studyProgramme, studyTrack, getTextIn)}
        infoBoxContent={
          combinedProgramme
            ? studyProgrammeToolTips.common.studyTrackOverviewCombinedProgramme
            : studyProgrammeToolTips.common.studyTrackOverview
        }
        isError={hasErrors}
        isLoading={isFetching}
        title={`Students of the ${isStudyProgrammeMode ? 'degree programme' : `study track ${studyTrack}`} by starting year`}
      >
        {!!studyTrackStats && (
          <Stack gap={2}>
            {hasAccessToPopulation ? (
              <>
                <YearSelector
                  studyProgramme={studyProgramme}
                  studyTrack={studyTrack !== studyProgramme ? studyTrack : undefined}
                  years={studyTrackStats.years}
                />
                <Divider />
              </>
            ) : null}
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

      <Section
        cypress="progress-of-students"
        infoBoxContent={studyProgrammeToolTips.studyTracksAndClassStatisticsTab.progressOfStudents}
        isError={hasErrors}
        isLoading={isFetching}
        title="Progress of students of the degree programme by starting year"
      >
        {!!studyTrackStats && (
          <ProgressOfStudents
            progressComboStats={getProgressComboStats()}
            progressStats={getProgressStats()}
            studyProgramme={studyProgramme}
            years={studyTrackStats.years}
          />
        )}
      </Section>

      <Section
        infoBoxContent={studyProgrammeToolTips.studyTracksAndClassStatisticsTab.percentiles}
        isError={hasErrors}
        isLoading={isFetching}
        title="Monthly credit accumulation of the students by starting year"
      >
        {!!studyTrackStats && (
          <StudentProgressPercentiles
            classSizes={studyTrackStats.classSizes}
            data={studyTrackStats.percentiles}
            doCombo={studyTrackStats.doCombo}
            graduationTimeGoals={studyTrackStats?.graduationTimes?.goals}
            isCombinedProgramme={!!combinedProgramme}
            studyTrack={studyTrack !== studyProgramme ? studyTrack : undefined}
          />
        )}
      </Section>

      {isSuccess && studyTrack in studyTrackStats?.graduationTimes ? (
        <Section
          cypress="average-graduation-times"
          infoBoxContent={
            studyProgramme.includes('MH')
              ? studyProgrammeToolTips.studyTracksAndClassStatisticsTab.averageGraduationTimesStudyTracksMaster
              : studyProgrammeToolTips.studyTracksAndClassStatisticsTab.averageGraduationTimesStudyTracks
          }
          isError={hasErrors}
          isLoading={isFetching}
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
                {studyTrackStats.doCombo && !!studyTrackStatsGraduationStats.combo.studyTrackStatsGraduationStats ? (
                  <GraduationTimes
                    classSizes={studyTrackStatsGraduationStats.combo.studyTrackStatsClassSizes}
                    data={studyTrackStats.graduationTimes[studyProgramme].medians.combo.map(formatMedianEntries)}
                    goal={studyTrackStats.graduationTimes.goals.combo}
                    levelProgrammeData={studyTrackStatsGraduationStats.combo.studyTrackStatsGraduationStats}
                    title={getGraduationGraphTitle(studyProgramme, true)}
                    {...graduationTimeCommonProps}
                  />
                ) : null}
                {!!studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats && (
                  <GraduationTimes
                    classSizes={studyTrackStatsGraduationStats.basic.studyTrackStatsClassSizes}
                    data={studyTrackStats.graduationTimes[studyProgramme].medians.basic.map(formatMedianEntries)}
                    goal={studyTrackStats.graduationTimes.goals.basic}
                    levelProgrammeData={studyTrackStatsGraduationStats.basic.studyTrackStatsGraduationStats}
                    title={getGraduationGraphTitle(studyProgramme, false)}
                    {...graduationTimeCommonProps}
                  />
                )}
              </Stack>
            ) : (
              <Stack gap={2}>
                {studyTrackStats.doCombo ? (
                  <GraduationTimes
                    data={studyTrackStats.graduationTimes[studyTrack].medians.combo.map(formatMedianEntries)}
                    goal={studyTrackStats.graduationTimes.goals.combo}
                    title={getGraduationGraphTitle(studyProgramme, true)}
                    {...graduationTimeCommonProps}
                  />
                ) : null}
                <GraduationTimes
                  classSizes={studyTrackStatsGraduationStats.basic.studyTrackStatsClassSizes}
                  data={studyTrackStats.graduationTimes[studyTrack].medians.basic.map(formatMedianEntries)}
                  goal={studyTrackStats.graduationTimes.goals.basic}
                  title={getGraduationGraphTitle(studyProgramme, false)}
                  {...graduationTimeCommonProps}
                />
                {!!combinedProgramme && (
                  <GraduationTimes
                    classSizes={studyTrackStatsGraduationStats.combo.studyTrackStatsClassSizes}
                    data={studyTrackStats.graduationTimesSecondProg[combinedProgramme].medians.combo.map(
                      formatMedianEntries
                    )}
                    goal={studyTrackStats.graduationTimesSecondProg.goals.combo}
                    title={getGraduationGraphTitle(combinedProgramme, true)}
                    {...graduationTimeCommonProps}
                  />
                )}
              </Stack>
            )}
          </Stack>
        </Section>
      ) : null}
    </Stack>
  )
}
