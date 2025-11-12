import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { LineGraph } from '@/components/material/LineGraph'
import { Section } from '@/components/material/Section'
import { StackedBarChart } from '@/components/material/StackedBarChart'
import {
  useGetFacultyBasicStatsQuery,
  useGetFacultyCreditStatsQuery,
  useGetFacultyThesisStatsQuery,
} from '@/redux/facultyStats'
import { useGetProgrammesQuery } from '@/redux/populations'
import { DegreeProgramme, GetFacultiesResponse } from '@/types/api/faculty'
import { makeGraphData, makeTableStats } from '@/util/creditsProduced'
import { getTimestamp } from '@/util/timeAndDate'
import { NameWithCode } from '@oodikone/shared/types'
import { InteractiveDataTable } from './InteractiveDataTable'

const calculateTotals = stats => {
  const totals: Record<number, Record<string, number>> = {}
  for (const id of stats.ids) {
    const providerStats = stats[id].stats
    for (const year of Object.keys(providerStats)) {
      const yearStats = providerStats[year]
      totals[year] ??= {}
      for (const field of Object.keys(yearStats)) {
        if (field === 'total') continue
        totals[year][field] ??= 0
        totals[year].total ??= 0
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
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_DEGREE_PROGRAMMES'
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
            cypress="year-toggle"
            disabled={isFetchingOrLoading || hasErrors}
            firstLabel="Calendar year"
            infoBoxContent={facultyToolTips.yearToggle}
            secondLabel="Academic year"
            setValue={setAcademicYear}
            value={academicYear}
          />
          <Toggle
            cypress="programme-toggle"
            disabled={isFetchingOrLoading || hasErrors}
            firstLabel="New degree programmes"
            infoBoxContent={facultyToolTips.programmeToggle}
            secondLabel="All degree programmes"
            setValue={setStudyProgrammes}
            value={studyProgrammes}
          />
          <Toggle
            cypress="study-right-toggle"
            disabled={isFetchingOrLoading || hasErrors}
            firstLabel="All study rights"
            infoBoxContent={facultyToolTips.studyRightToggle}
            secondLabel="Special study rights excluded"
            setValue={setSpecialGroups}
            value={specialGroups}
          />
          {studyProgrammeFilter === 'ALL_PROGRAMMES' && (
            <Alert data-cy="faculty-programmes-shown-info" severity="info" sx={{ width: '100%' }}>
              Please note that the data is complete only for current Bachelor's, Master's and Doctoral programmes.
              Especially, credits and thesis writers contain only data for current programmes.
            </Alert>
          )}
          {special === 'SPECIAL_EXCLUDED' && (
            <Alert data-cy="faculty-exclude-specials-info" severity="info" sx={{ width: '100%' }}>
              Please note that excluding the special study rights does not affect the "Credits produced by the faculty"
              view.
            </Alert>
          )}
        </ToggleContainer>
      </Section>
      <Section
        cypress="students-of-the-faculty"
        infoBoxContent={facultyToolTips.studentsOfTheFaculty}
        isError={basicsIsError}
        isLoading={basicsIsLoading}
        title="Students of the faculty"
      >
        {basics.isSuccess && basics.data ? (
          <Stack gap={2}>
            <LineGraph
              cypress="students-of-the-faculty"
              exportFileName={`oodikone_students-of-the-faculty_${faculty?.code}_${getTimestamp()}`}
              graphStats={basics.data.studentInfo.graphStats}
              years={basics.data.years}
            />
            <InteractiveDataTable
              cypress="students-of-the-faculty"
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
        ) : null}
      </Section>
      <Section
        cypress="graduated-of-the-faculty"
        infoBoxContent={facultyToolTips.graduatedOfTheFaculty}
        isError={basicsIsError}
        isLoading={basicsIsLoading}
        title="Graduated of the faculty"
      >
        {basics.isSuccess && basics.data ? (
          <Stack gap={2}>
            <LineGraph
              cypress="graduated-of-the-faculty"
              exportFileName={`oodikon"graduated-of-the-faculty"_${faculty?.code}_${getTimestamp()}`}
              graphStats={basics.data.graduationInfo.graphStats}
              years={basics.data.years}
            />
            <InteractiveDataTable
              cypress="graduated-of-the-faculty"
              dataProgrammeStats={basics.data.graduationInfo.programmeTableStats}
              dataStats={basics.data.graduationInfo.tableStats}
              plotLinePlaces={basicStatsPlotLinePlaces}
              programmeNames={basics.data.programmeNames}
              sliceStart={2}
              sortedKeys={basicStatsProgrammes}
              titles={basics.data.graduationInfo.titles}
            />
          </Stack>
        ) : null}
      </Section>
      <Section
        cypress="thesis-writers-of-the-faculty"
        infoBoxContent={facultyToolTips.thesisWritersOfTheFaculty}
        isError={thesisWritersIsError}
        isLoading={thesisWritersIsLoading}
        title="Thesis writers of the faculty"
      >
        {thesisWriters.isSuccess && thesisWriters.data ? (
          <Stack gap={2}>
            <LineGraph
              cypress="thesis-writers-of-the-faculty"
              exportFileName={`oodikone_ThesisWritersOfTheFaculty_${faculty?.code}_${getTimestamp()}`}
              graphStats={thesisWriters.data.graphStats}
              years={thesisWriters.data.years}
            />
            <InteractiveDataTable
              cypress="thesis-writers-of-the-faculty"
              dataProgrammeStats={thesisWriters.data.programmeTableStats}
              dataStats={thesisWriters.data.tableStats}
              plotLinePlaces={thesisWriterStatsPlotLinePlaces}
              programmeNames={thesisWriters.data.programmeNames}
              sliceStart={2}
              sortedKeys={thesisWriterStatsProgrammes}
              titles={thesisWriters.data.titles}
            />
          </Stack>
        ) : null}
      </Section>
      <Section
        cypress="credits-produced-by-the-faculty"
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
          {credits.isSuccess && credits.data ? (
            <Stack gap={2}>
              <StackedBarChart
                cypress="credits-produced-by-the-faculty"
                data={graphStats?.data}
                exportFileName={`oodikone_credits-produced-by-the-faculty_${faculty?.code}_${getTimestamp()}`}
                labels={graphStats?.years}
              />
              <InteractiveDataTable
                cypress="credits-produced-by-the-faculty"
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
          ) : null}
        </Stack>
      </Section>
    </Stack>
  )
}
