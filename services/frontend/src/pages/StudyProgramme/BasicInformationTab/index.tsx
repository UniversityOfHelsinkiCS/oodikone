import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

import { useState } from 'react'

import { isDefaultServiceProvider } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { LineGraph } from '@/components/common/LineGraph'
import { MedianTimeBarChart } from '@/components/common/MedianTimeBarChart'
import { StackedBarChart } from '@/components/common/StackedBarChart'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { BreakdownBarChart } from '@/components/GraduationTimes/BreakdownDisplay/BreakdownBarChartV2'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import { DataTable } from '@/components/StudyProgramme/DataTable'
import { useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery } from '@/redux/studyProgramme'
import { makeGraphData, makeTableStats } from '@/util/creditsProduced'
import { getGraduationGraphTitle, isNewProgramme } from '@/util/studyProgramme'
import { getTimestamp } from '@/util/timeAndDate'
import { BarChart } from './BarChart'

const getGraduatedText = (code: string) => {
  if (code.startsWith('T') || code.startsWith('LIS')) {
    return 'Graduated of the programme'
  }
  return 'Graduated and thesis writers of the programme'
}

export const BasicInformationTab = ({
  academicYear,
  combinedProgramme,
  setAcademicYear,
  setSpecialGroupsExcluded,
  specialGroupsExcluded,
  studyProgramme,
}: {
  academicYear: boolean
  combinedProgramme: string
  setAcademicYear: (value: boolean) => void
  setSpecialGroupsExcluded: (value: boolean) => void
  specialGroupsExcluded: boolean
  studyProgramme: string
}) => {
  const [showAll, setShowAll] = useState(false)
  const [showMedian, setShowMedian] = useState(false)
  const { getTextIn } = useLanguage()
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const specialGroups = specialGroupsExcluded ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const basics = useGetBasicStatsQuery({
    id: studyProgramme,
    combinedProgramme,
    yearType,
    specialGroups,
  })
  const credits = useGetCreditStatsQuery({
    codes: [studyProgramme, combinedProgramme].filter(Boolean),
    specialGroups,
    yearType,
  })
  const graduations = useGetGraduationStatsQuery({
    id: studyProgramme,
    combinedProgramme,
    specialGroups,
    yearType,
  })

  const creditStats = credits?.data?.stats?.[studyProgramme]?.stats
  const tableStats = makeTableStats(creditStats, showAll, academicYear)
  const creditGraphStats = makeGraphData(creditStats, showAll, academicYear)

  const secondStats = credits?.data?.stats?.[combinedProgramme]?.stats
  const secondTableStats = secondStats ? makeTableStats(secondStats, showAll, academicYear) : null
  const secondCreditGraphStats = secondStats ? makeGraphData(secondStats, showAll, academicYear) : null

  const doCombo = graduations?.data?.doCombo
  const timesData = graduations?.data?.graduationTimes
  const timesDataSecondProgramme = graduations?.data?.graduationTimesSecondProgramme

  const basicsIsLoading = basics.isLoading || basics.isFetching
  const creditsIsLoading = credits.isLoading || credits.isFetching
  const graduationsIsLoading = graduations.isLoading || graduations.isFetching
  const isFetchingOrLoading = basicsIsLoading || creditsIsLoading || graduationsIsLoading

  const basicsIsError = basics.isError || (basics.isSuccess && !basics.data)
  const creditsIsError = credits.isError || (credits.isSuccess && !credits.data)
  const graduationsIsError = graduations.isError || (graduations.isSuccess && !graduations.data)
  const hasErrors = basicsIsError || creditsIsError || graduationsIsError

  return (
    <Stack gap={2}>
      <Section>
        <ToggleContainer>
          <Toggle
            cypress="year-toggle"
            disabled={isFetchingOrLoading || hasErrors}
            firstLabel="Calendar year"
            infoBoxContent={studyProgrammeToolTips.yearToggle}
            secondLabel="Academic year"
            setValue={setAcademicYear}
            value={academicYear}
          />
          <Toggle
            cypress="study-right-toggle"
            disabled={isFetchingOrLoading || hasErrors}
            firstLabel="All study rights"
            infoBoxContent={studyProgrammeToolTips.studyRightToggle}
            secondLabel="Special study rights excluded"
            setValue={setSpecialGroupsExcluded}
            value={specialGroupsExcluded}
          />
        </ToggleContainer>
      </Section>

      <Section
        cypress="students-of-the-study-programme"
        infoBoxContent={studyProgrammeToolTips.studentsOfTheStudyProgramme}
        isError={basicsIsError}
        isLoading={basicsIsLoading}
        title="Students of the degree programme"
      >
        {basics.isSuccess && basics.data ? (
          <Stack gap={2}>
            {!isNewProgramme(studyProgramme) && (
              <Alert severity="info" variant="outlined">
                Please note, that the data is complete only for current Bachelor, Masters and Doctoral programmes
              </Alert>
            )}
            <LineGraph
              cypress="students-of-the-study-programme"
              exportFileName={`oodikone_StudentsOfTheStudyProgramme_${studyProgramme}_${getTimestamp()}`}
              graphStats={basics.data.graphStats}
              years={basics.data.years}
            />
            <DataTable
              cypress="students-of-the-study-programme"
              data={basics.data.tableStats}
              titles={basics.data.titles}
            />
          </Stack>
        ) : null}
      </Section>

      <Section
        cypress="credits-produced-by-the-study-programme"
        infoBoxContent={studyProgrammeToolTips.creditsProducedByTheStudyProgramme}
        isError={creditsIsError}
        isLoading={creditsIsLoading}
        title="Credits produced by the degree programme"
      >
        {creditGraphStats && tableStats && isDefaultServiceProvider() ? (
          <Stack gap={2}>
            <Stack alignItems="center">
              <Stack alignItems="center" direction="row">
                <Switch checked={showAll} data-cy="special-categories-toggle" onChange={() => setShowAll(!showAll)} />
                <Typography>Show special categories</Typography>
              </Stack>
            </Stack>
            <StackedBarChart
              cypress="credits-produced-by-the-study-programme"
              data={creditGraphStats.data}
              exportFileName={`oodikone_CreditsProducedByTheStudyProgramme_${studyProgramme}_${getTimestamp()}`}
              labels={creditGraphStats.years}
            />
            <DataTable
              cypress="credits-produced-by-the-study-programme"
              data={tableStats.data}
              titles={tableStats.titles}
            />
            {secondCreditGraphStats && secondTableStats ? (
              <Stack gap={2}>
                <Typography variant="h6">Credits produced by the licentiate programme</Typography>
                <StackedBarChart
                  cypress="credits-produced-by-the-study-programme"
                  data={secondCreditGraphStats.data}
                  exportFileName={`oodikone_CreditsProducedByTheStudyProgramme_${studyProgramme}_${getTimestamp()}`}
                  labels={secondCreditGraphStats.years}
                />
                <DataTable
                  cypress="credits-produced-by-the-study-programme-second"
                  data={secondTableStats.data}
                  titles={secondTableStats.titles}
                />
              </Stack>
            ) : null}
          </Stack>
        ) : null}
      </Section>

      <Section
        cypress="graduated-and-thesis-writers-of-the-programme"
        infoBoxContent={studyProgrammeToolTips.graduatedAndThesisWritersOfTheProgramme}
        isError={graduationsIsError}
        isLoading={graduationsIsLoading}
        title={getGraduatedText(studyProgramme)}
      >
        {graduations.isSuccess && graduations.data ? (
          <Stack gap={2}>
            <BarChart
              graphStats={graduations.data.graphStats}
              id={graduations.data.id}
              years={graduations.data.years}
            />
            <DataTable
              cypress="graduated-and-graduations-of-the-programme"
              data={graduations?.data?.tableStats}
              titles={graduations?.data?.titles}
            />
          </Stack>
        ) : null}
      </Section>

      <Section
        cypress="average-graduation-times"
        infoBoxContent={studyProgrammeToolTips.averageGraduationTimes}
        isError={graduationsIsError}
        isLoading={graduationsIsLoading}
        title="Average graduation times"
      >
        {graduations.isSuccess && graduations.data ? (
          <Stack gap={2}>
            <ToggleContainer>
              <Toggle
                cypress="graduation-time-toggle"
                firstLabel="Breakdown"
                secondLabel="Median time"
                setValue={setShowMedian}
                value={showMedian}
              />
            </ToggleContainer>
            {showMedian ? (
              <>
                {doCombo ? (
                  <MedianTimeBarChart
                    byStartYear={false}
                    data={graduations?.data?.comboTimes?.medians}
                    goal={graduations?.data?.comboTimes?.goal}
                    title={getGraduationGraphTitle(studyProgramme, doCombo)}
                  />
                ) : null}
                {studyProgramme !== 'MH90_001' && (
                  <MedianTimeBarChart
                    byStartYear={false}
                    data={timesData?.medians}
                    goal={graduations?.data.graduationTimes?.goal}
                    title={getGraduationGraphTitle(studyProgramme)}
                  />
                )}
                {combinedProgramme ? (
                  <MedianTimeBarChart
                    byStartYear={false}
                    data={timesDataSecondProgramme?.medians}
                    goal={graduations?.data.graduationTimesSecondProgramme?.goal}
                    title={getGraduationGraphTitle(combinedProgramme, true)}
                  />
                ) : null}
              </>
            ) : (
              <>
                {doCombo ? (
                  <BreakdownBarChart
                    data={graduations?.data?.comboTimes?.medians}
                    title={getGraduationGraphTitle(studyProgramme, doCombo)}
                  />
                ) : null}
                {studyProgramme !== 'MH90_001' && (
                  <BreakdownBarChart data={timesData?.medians} title={getGraduationGraphTitle(studyProgramme)} />
                )}
                {combinedProgramme ? (
                  <BreakdownBarChart
                    data={timesDataSecondProgramme?.medians}
                    title={getGraduationGraphTitle(combinedProgramme, true)}
                  />
                ) : null}
              </>
            )}
          </Stack>
        ) : null}
      </Section>

      <Section
        cypress="programmes-before-or-after"
        infoBoxContent={studyProgrammeToolTips.programmesBeforeOrAfter}
        isError={graduationsIsError}
        isLoading={graduationsIsLoading}
        title={
          studyProgramme.includes('KH')
            ? 'Primary master programme studies after this programme'
            : 'Primary bachelor programme studies before this programme'
        }
      >
        {graduations.isSuccess && graduations?.data?.programmesBeforeOrAfterGraphStats?.length ? (
          <Stack gap={2}>
            <StackedBarChart
              cypress="programmes-before-or-after"
              data={graduations?.data?.programmesBeforeOrAfterGraphStats.map(programme => ({
                ...programme,
                name: getTextIn(programme.name),
              }))}
              exportFileName={`oodikone_graduations_${studyProgramme}_${getTimestamp()}`}
              labels={graduations?.data?.years}
            />
            <DataTable
              cypress="programmes-before-or-after"
              data={graduations?.data?.programmesBeforeOrAfterTableStats.map(programme =>
                programme.with(2, getTextIn(programme[2]))
              )}
              titles={graduations?.data?.programmesBeforeOrAfterTitles}
            />
          </Stack>
        ) : null}
      </Section>
    </Stack>
  )
}
