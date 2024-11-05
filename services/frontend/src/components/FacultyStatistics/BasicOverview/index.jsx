import { useState } from 'react'
import { Divider, Loader, Message, Radio } from 'semantic-ui-react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { makeGraphData, makeTableStats } from '@/components/common/CreditsProduced'
import { InteractiveDataTable } from '@/components/FacultyStatistics/InteractiveDataView'
import { InfoBox } from '@/components/InfoBox'
import { LineGraph } from '@/components/StudyProgramme/BasicOverview/LineGraph'
import { StackedBarChart } from '@/components/StudyProgramme/BasicOverview/StackedBarChart'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import '@/components/FacultyStatistics/faculty.css'
import '@/components/StudyProgramme/studyprogramme.css'
import {
  useGetFacultyBasicStatsQuery,
  useGetFacultyCreditStatsQuery,
  useGetFacultyThesisStatsQuery,
} from '@/redux/facultyStats'
import { useGetProgrammesQuery } from '@/redux/populations'
import { getTimestamp } from '@/util/timeAndDate'

const calculateTotals = stats => {
  const totals = {}
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

const getSortedProgrammeIdsAndPlotLinePlaces = (data, degreeProgrammes, faculty) => {
  if (!data || !degreeProgrammes) {
    return { programmes: [], chartPlotLinePlaces: [] }
  }

  const programmeCodes = Object.values(data)
    .map(prog => prog.code)
    .reduce((acc, code) => {
      acc[code] = degreeProgrammes[code]?.degreeProgrammeType ?? null
      return acc
    }, {})
  const programmeIds = Object.entries(data).reduce((acc, [key, value]) => {
    acc[value.code] = key
    return acc
  }, {})

  const degreeTypes = [
    {
      types: ['urn:code:degree-program-type:bachelors-degree'],
      key: 'Bachelors',
      programmes: [],
    },
    {
      types: ['urn:code:degree-program-type:masters-degree'],
      key: 'Masters',
      programmes: [],
    },
    {
      types: ['urn:code:degree-program-type:doctor', 'urn:code:degree-program-type:lic'],
      key: 'Doctors and Licentiates',
      programmes: [],
    },
    {
      types: ['urn:code:degree-program-type:postgraduate-professional'],
      key: 'Postgraduate professionals',
      programmes: [],
    },
  ]

  for (const [programmeCode, degreeType] of Object.entries(programmeCodes)) {
    const progId = programmeIds[programmeCode]
    for (const degree of degreeTypes) {
      if (degree.types.includes(degreeType)) {
        degree.programmes.push(progId)
        break
      }
    }
  }

  for (const degree of degreeTypes) {
    degree.programmes.sort((a, b) => a.localeCompare(b))
  }

  const sortedProgrammes = []
  const plotLinePlaces = []

  for (const degree of degreeTypes) {
    if (degree.programmes.length > 0) {
      plotLinePlaces.push([sortedProgrammes.length, degree.key])
      sortedProgrammes.push(...degree.programmes)
    }
  }

  if (faculty) {
    plotLinePlaces.push([sortedProgrammes.length, 'Produced by faculty'])
    sortedProgrammes.push(faculty)
  }

  return { programmes: sortedProgrammes, plotLinePlaces }
}

export const BasicOverview = ({
  academicYear,
  faculty,
  setAcademicYear,
  setSpecialGroups,
  setStudyProgrammes,
  specialGroups,
  studyProgrammes,
}) => {
  const [showAll, setShowAll] = useState(false)

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

  const tableStats = credits.data ? makeTableStats(calculateTotals(credits.data), showAll, academicYear) : {}
  const graphStats = credits.data ? makeGraphData(calculateTotals(credits.data), showAll, academicYear) : null
  const programmeStats = credits.data?.ids.reduce((obj, id) => {
    return {
      ...obj,
      [id]: makeTableStats(credits.data[id].stats, showAll, academicYear).data,
    }
  }, {})

  const getDivider = (title, toolTipText) => (
    <>
      <Divider data-cy={`Section-${toolTipText}`} horizontal>
        {title}
      </Divider>
      <InfoBox content={facultyToolTips[toolTipText]} cypress={toolTipText} />
    </>
  )

  const isFetchingOrLoading =
    credits.isLoading ||
    credits.isFetching ||
    basics.isLoading ||
    basics.isFetching ||
    thesisWriters.isLoading ||
    thesisWriters.isFetching

  const isError =
    (basics.isError && credits.isError && thesisWriters.isError) ||
    (basics.isSuccess &&
      !basics.data &&
      credits.isSuccess &&
      !credits.data &&
      thesisWriters.isSuccess &&
      !thesisWriters.data)

  if (isError) {
    return <h3>Something went wrong, please try refreshing the page.</h3>
  }

  const creditSortingTitles = ['Code', 'Total', 'Degree', 'Exchange', 'Open uni', 'Transferred']
  if (showAll) creditSortingTitles.splice(5, 0, 'Other uni', 'Separate')

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
    <div className="faculty-overview">
      <div className="toggle-container">
        <Toggle
          cypress="YearToggle"
          firstLabel="Calendar year"
          secondLabel="Academic year"
          setValue={setAcademicYear}
          toolTips={facultyToolTips.yearToggle}
          value={academicYear}
        />
        <Toggle
          cypress="ProgrammeToggle"
          firstLabel="New study programmes"
          secondLabel="All study programmes"
          setValue={setStudyProgrammes}
          toolTips={facultyToolTips.programmeToggle}
          value={studyProgrammes}
        />
        <Toggle
          cypress="StudentToggle"
          firstLabel="All study rights"
          secondLabel="Special study rights excluded"
          setValue={setSpecialGroups}
          toolTips={facultyToolTips.studentToggle}
          value={specialGroups}
        />
      </div>
      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <>
          {studyProgrammeFilter === 'ALL_PROGRAMMES' && (
            <Message data-cy="FacultyProgrammesShownInfo">
              Please note that the data is complete only for current Bachelor's, Master's and Doctoral programmes.
              Especially, credits and thesis writers contain only data for current programmes.
            </Message>
          )}
          {special === 'SPECIAL_EXCLUDED' && (
            <Message data-cy="FacultyExcludeSpecialsInfo">
              Please note that excluding the special study rights does not affect the "Credits produced by the faculty"
              view.
            </Message>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider('Students of the faculty', 'studentsOfTheFaculty')}
              <div className="section-container">
                <LineGraph
                  cypress="StudentsOfTheFaculty"
                  data={{ ...basics?.data.studentInfo, years: basics.data.years }}
                  exportFileName={`oodikone_StudentsOfTheFaculty_${faculty?.code}_${getTimestamp()}`}
                  wideTable
                />
                <div className="table-container-wide datatable">
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
                </div>
              </div>
            </>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider('Graduated of the faculty', 'graduatedOfTheFaculty')}
              <div className="section-container">
                <LineGraph
                  cypress="GraduatedOfTheFaculty"
                  data={{ ...basics?.data.graduationInfo, years: basics.data.years }}
                  exportFileName={`oodikone_GraduatedOfTheFaculty_${faculty?.code}_${getTimestamp()}`}
                />
                <div className="table-container">
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
                </div>
              </div>
            </>
          )}
          {thesisWriters.isSuccess && thesisWriters.data && (
            <>
              {getDivider('Thesis writers of the faculty', 'thesisWritersOfTheFaculty')}
              <div className="section-container">
                <LineGraph
                  cypress="ThesisWritersOfTheFaculty"
                  data={{ ...thesisWriters.data, years: thesisWriters.data.years }}
                  exportFileName={`oodikone_ThesisWritersOfTheFaculty_${faculty?.code}_${getTimestamp()}`}
                />
                <div className="table-container">
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
                </div>
              </div>
            </>
          )}
          {credits.isSuccess && credits.data && (
            <>
              {getDivider('Credits produced by the faculty', 'creditsProducedByTheFaculty')}
              <div className="original-toggle-container">
                <Radio checked={showAll} label="Show special categories" onChange={() => setShowAll(!showAll)} toggle />
              </div>
              <div className="section-container">
                <StackedBarChart
                  cypress="CreditsProducedByTheFaculty"
                  data={graphStats.data}
                  exportFileName={`oodikone_CreditsProducedByTheFaculty_${faculty?.code}_${getTimestamp()}`}
                  labels={graphStats.years}
                  wideTable
                />
                <div className="table-container-wide">
                  <InteractiveDataTable
                    cypress="CreditsProducedByTheFaculty"
                    dataProgrammeStats={programmeStats}
                    dataStats={tableStats.data}
                    plotLinePlaces={creditStatsPlotLinePlaces}
                    programmeNames={{
                      ...credits.data.programmeNames,
                      [faculty.code]: { ...faculty.name, code: faculty.code },
                    }}
                    shortNames={creditSortingTitles}
                    sliceStart={2}
                    sortedKeys={creditStatsProgrammes}
                    titles={tableStats.titles}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
