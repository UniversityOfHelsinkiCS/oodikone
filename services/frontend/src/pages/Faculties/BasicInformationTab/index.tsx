import { Alert, Stack, Switch, Typography } from '@mui/material'
import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { makeGraphData, makeTableStats } from '@/components/common/CreditsProduced'
import { LineGraph } from '@/components/material/LineGraph'
import { Section } from '@/components/material/Section'
import { StackedBarChart } from '@/components/material/StackedBarChart'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'
import {
  useGetFacultyBasicStatsQuery,
  useGetFacultyCreditStatsQuery,
  useGetFacultyThesisStatsQuery,
} from '@/redux/facultyStats'
import { useGetProgrammesQuery } from '@/redux/populations'
import { NameWithCode } from '@/shared/types'
import { DegreeProgramme, GetFacultiesResponse } from '@/types/api/faculty'
import { getTimestamp } from '@/util/timeAndDate'
import { InteractiveDataTable } from './InteractiveDataTable'

const calculateTotals = stats => {
  const totals: Record<number, Record<string, number>> = {}
  for (const id of stats.ids) {
    const providerStats = stats[id].stats
    for (const year of Object.keys(providerStats)) {
      const yearStats = providerStats[year]
      if (!totals[year]) totals[year] = {}
      for (const field of Object.keys(yearStats)) {
        if (field === 'total') continue
        if (!totals[year][field]) totals[year][field] = 0
        if (!totals[year].total) totals[year].total = 0
        totals[year][field] += Math.round(yearStats[field])
        totals[year].total += Math.round(yearStats[field])
      }
    }
  }
  return totals
}

const getSortedProgrammeIdsAndPlotLinePlaces = (
  data?: Record<string, NameWithCode>,
  degreeProgrammes?: Record<string, DegreeProgramme>,
  faculty?: string
) => {
  if (!data || !degreeProgrammes) {
    return { programmes: [] as string[], chartPlotLinePlaces: [] as string[][] }
  }

  const programmeCodes: Record<string, string> = Object.values(data)
    .map(programme => programme.code)
    .reduce((acc, code) => {
      acc[code] = degreeProgrammes[code]?.degreeProgrammeType ?? null
      return acc
    }, {})
  const programmeIds: Record<string, string> = Object.entries(data).reduce((acc, [key, value]) => {
    acc[value.code] = key
    return acc
  }, {})

  const degreeTypes = [
    {
      types: ['urn:code:degree-program-type:bachelors-degree'],
      key: 'Bachelors',
      programmes: [] as string[],
    },
    {
      types: ['urn:code:degree-program-type:masters-degree'],
      key: 'Masters',
      programmes: [] as string[],
    },
    {
      types: ['urn:code:degree-program-type:doctor', 'urn:code:degree-program-type:lic'],
      key: 'Doctors and Licentiates',
      programmes: [] as string[],
    },
    {
      types: ['urn:code:degree-program-type:postgraduate-professional'],
      key: 'Postgraduate professionals',
      programmes: [] as string[],
    },
  ]

  for (const [programmeCode, degreeType] of Object.entries(programmeCodes)) {
    const programmeId = programmeIds[programmeCode]
    for (const degree of degreeTypes) {
      if (degree.types.includes(degreeType)) {
        degree.programmes.push(programmeId)
        break
      }
    }
  }

  for (const degree of degreeTypes) {
    degree.programmes.sort((a, b) => a.localeCompare(b))
  }

  const sortedProgrammes: string[] = []
  const plotLinePlaces: string[][] = []

  for (const degree of degreeTypes) {
    if (degree.programmes.length > 0) {
      plotLinePlaces.push([sortedProgrammes.length.toString(), degree.key])
      sortedProgrammes.push(...degree.programmes)
    }
  }

  if (faculty) {
    plotLinePlaces.push([sortedProgrammes.length.toString(), 'Produced by faculty'])
    sortedProgrammes.push(faculty)
  }

  return { programmes: sortedProgrammes, plotLinePlaces }
}

export const BasicInformationTab = ({
  faculty,
  setSpecialGroups,
  setStudyProgrammes,
  specialGroups,
  studyProgrammes,
}: {
  faculty: GetFacultiesResponse
  setSpecialGroups: (value: boolean) => void
  setStudyProgrammes: (value: boolean) => void
  specialGroups: boolean
  studyProgrammes: boolean
}) => {
  const [showAll, setShowAll] = useState(false)
  const [academicYear, setAcademicYear] = useState(false)

  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'

  const basics = useGetFacultyBasicStatsQuery({
    id: faculty?.id,
    yearType,
    studyProgrammeFilter,
    specialGroups: special,
  })

  const thesisWriters = useGetFacultyThesisStatsQuery({
    id: faculty?.id,
    yearType,
    studyProgrammeFilter,
    specialGroups: special,
  })

  const credits = useGetFacultyCreditStatsQuery({
    id: faculty?.id,
    yearType,
  })

  const { data: degreeProgrammes } = useGetProgrammesQuery()

  const tableStats: { data: (number | string)[][]; titles: string[] } | null = credits.data
    ? makeTableStats(calculateTotals(credits.data), showAll, academicYear)
    : null
  const graphStats = credits.data ? makeGraphData(calculateTotals(credits.data), showAll, academicYear) : null
  const programmeStats = credits.data?.ids.reduce((obj, id) => {
    return {
      ...obj,
      [id]: makeTableStats(credits.data![id].stats, showAll, academicYear)?.data,
    }
  }, {})

  const basicsIsLoading = basics.isLoading || basics.isFetching
  const creditsIsLoading = credits.isLoading || credits.isFetching
  const thesisWritersIsLoading = thesisWriters.isLoading || thesisWriters.isFetching
  const isFetchingOrLoading = basicsIsLoading || creditsIsLoading || thesisWritersIsLoading

  const basicsIsError = basics.isError || (basics.isSuccess && !basics.data)
  const creditsIsError = credits.isError || (credits.isSuccess && !credits.data)
  const thesisWritersIsError = thesisWriters.isError || (thesisWriters.isSuccess && !thesisWriters.data)
  const hasErrors = basicsIsError || creditsIsError || thesisWritersIsError

  const creditSortingTitles = ['Code', 'Total', 'Degree', 'Exchange', 'Open uni', 'Transferred']
  if (showAll) {
    creditSortingTitles.splice(5, 0, 'Other uni', 'Separate')
  }

  const transferShortTitles = ['Code', 'Started', 'Accepted', 'Graduated']
  if (special === 'SPECIAL_INCLUDED') {
    transferShortTitles.push('Transferred out', 'Transferred into')
  }

  const { programmes: basicStatsProgrammes, plotLinePlaces: basicStatsPlotLinePlaces } =
    getSortedProgrammeIdsAndPlotLinePlaces(basics.data?.programmeNames, degreeProgrammes)
  const { programmes: thesisWriterStatsProgrammes, plotLinePlaces: thesisWriterStatsPlotLinePlaces } =
    getSortedProgrammeIdsAndPlotLinePlaces(thesisWriters.data?.programmeNames, degreeProgrammes)
  const { programmes: creditStatsProgrammes, plotLinePlaces: creditStatsPlotLinePlaces } =
    getSortedProgrammeIdsAndPlotLinePlaces(credits.data?.programmeNames, degreeProgrammes, faculty.code)

  return (
    <Stack gap={2}>
      <Section>
        <ToggleContainer>
          <Toggle
            cypress="YearToggle"
            disabled={isFetchingOrLoading || hasErrors}
            firstLabel="Calendar year"
            infoBoxContent={facultyToolTips.yearToggle}
            secondLabel="Academic year"
            setValue={setAcademicYear}
            value={academicYear}
          />
          <Toggle
            cypress="ProgrammeToggle"
            disabled={isFetchingOrLoading || hasErrors}
            firstLabel="New study programmes"
            infoBoxContent={facultyToolTips.programmeToggle}
            secondLabel="All study programmes"
            setValue={setStudyProgrammes}
            value={studyProgrammes}
          />
          <Toggle
            cypress="StudentToggle"
            disabled={isFetchingOrLoading || hasErrors}
            firstLabel="All study rights"
            infoBoxContent={facultyToolTips.studentToggle}
            secondLabel="Special study rights excluded"
            setValue={setSpecialGroups}
            value={specialGroups}
          />
          {studyProgrammeFilter === 'ALL_PROGRAMMES' && (
            <Alert data-cy="FacultyProgrammesShownInfo" severity="info" sx={{ width: '100%' }}>
              Please note that the data is complete only for current Bachelor's, Master's and Doctoral programmes.
              Especially, credits and thesis writers contain only data for current programmes.
            </Alert>
          )}
          {special === 'SPECIAL_EXCLUDED' && (
            <Alert data-cy="FacultyExcludeSpecialsInfo" severity="info" sx={{ width: '100%' }}>
              Please note that excluding the special study rights does not affect the "Credits produced by the faculty"
              view.
            </Alert>
          )}
        </ToggleContainer>
      </Section>
      <Section
        cypress="StudentsOfTheFaculty"
        infoBoxContent={facultyToolTips.studentsOfTheFaculty}
        isError={basicsIsError}
        isLoading={basicsIsLoading}
        title="Students of the faculty"
      >
        {basics.isSuccess && basics.data && (
          <Stack gap={2}>
            <LineGraph
              cypress="StudentsOfTheFaculty"
              exportFileName={`oodikone_StudentsOfTheFaculty_${faculty?.code}_${getTimestamp()}`}
              graphStats={basics.data.studentInfo.graphStats}
              years={basics.data.years}
            />
            <InteractiveDataTable
              cypress="StudentsOfTheFaculty"
              dataProgrammeStats={basics.data.studentInfo.programmeTableStats}
              dataStats={basics.data.studentInfo.tableStats}
              plotLinePlaces={basicStatsPlotLinePlaces}
              programmeNames={basics.data.programmeNames}
              shortNames={transferShortTitles}
              sliceStart={1}
              sortedKeys={basicStatsProgrammes}
              titles={basics.data.studentInfo.titles}
            />
          </Stack>
        )}
      </Section>
      <Section
        cypress="GraduatedOfTheFaculty"
        infoBoxContent={facultyToolTips.graduatedOfTheFaculty}
        isError={basicsIsError}
        isLoading={basicsIsLoading}
        title="Graduated of the faculty"
      >
        {basics.isSuccess && basics.data && (
          <Stack gap={2}>
            <LineGraph
              cypress="GraduatedOfTheFaculty"
              exportFileName={`oodikone_GraduatedOfTheFaculty_${faculty?.code}_${getTimestamp()}`}
              graphStats={basics.data.graduationInfo.graphStats}
              years={basics.data.years}
            />
            <InteractiveDataTable
              cypress="GraduatedOfTheFaculty"
              dataProgrammeStats={basics.data.graduationInfo.programmeTableStats}
              dataStats={basics.data.graduationInfo.tableStats}
              plotLinePlaces={basicStatsPlotLinePlaces}
              programmeNames={basics.data.programmeNames}
              sliceStart={2}
              sortedKeys={basicStatsProgrammes}
              titles={basics.data.graduationInfo.titles}
            />
          </Stack>
        )}
      </Section>
      <Section
        cypress="ThesisWritersOfTheFaculty"
        infoBoxContent={facultyToolTips.thesisWritersOfTheFaculty}
        isError={thesisWritersIsError}
        isLoading={thesisWritersIsLoading}
        title="Thesis writers of the faculty"
      >
        {thesisWriters.isSuccess && thesisWriters.data && (
          <Stack gap={2}>
            <LineGraph
              cypress="ThesisWritersOfTheFaculty"
              exportFileName={`oodikone_ThesisWritersOfTheFaculty_${faculty?.code}_${getTimestamp()}`}
              graphStats={thesisWriters.data.graphStats}
              years={thesisWriters.data.years}
            />
            <InteractiveDataTable
              cypress="ThesisWritersOfTheFaculty"
              dataProgrammeStats={thesisWriters.data.programmeTableStats}
              dataStats={thesisWriters.data.tableStats}
              plotLinePlaces={thesisWriterStatsPlotLinePlaces}
              programmeNames={thesisWriters.data.programmeNames}
              sliceStart={2}
              sortedKeys={thesisWriterStatsProgrammes}
              titles={thesisWriters.data.titles}
            />
          </Stack>
        )}
      </Section>
      <Section
        cypress="CreditsProducedByTheFaculty"
        infoBoxContent={facultyToolTips.creditsProducedByTheFaculty}
        isError={creditsIsError}
        isLoading={creditsIsLoading}
        title="Credits produced by the faculty"
      >
        <Stack gap={2}>
          <Stack alignItems="center">
            <Stack alignItems="center" direction="row">
              <Switch checked={showAll} onChange={() => setShowAll(!showAll)} />
              <Typography>Show special categories</Typography>
            </Stack>
          </Stack>
          {credits.isSuccess && credits.data && (
            <Stack gap={2}>
              <StackedBarChart
                cypress="CreditsProducedByTheFaculty"
                data={graphStats?.data}
                exportFileName={`oodikone_CreditsProducedByTheFaculty_${faculty?.code}_${getTimestamp()}`}
                labels={graphStats?.years}
              />
              <InteractiveDataTable
                cypress="CreditsProducedByTheFaculty"
                dataProgrammeStats={programmeStats}
                dataStats={tableStats?.data}
                plotLinePlaces={creditStatsPlotLinePlaces}
                programmeNames={{
                  ...credits.data.programmeNames,
                  [faculty.code]: { ...faculty.name, code: faculty.code },
                }}
                shortNames={creditSortingTitles}
                sliceStart={2}
                sortedKeys={creditStatsProgrammes}
                titles={tableStats?.titles}
              />
            </Stack>
          )}
        </Stack>
      </Section>
    </Stack>
  )
}
