import React from 'react'
import { Message } from 'semantic-ui-react'

import { sortProgrammeKeys } from '@/components/FacultyStatistics/facultyHelpers'
import { calculateStats } from '@/components/FacultyStatistics/FacultyProgrammeOverview'
import { FacultyBarChart } from '@/components/FacultyStatistics/FacultyProgrammeOverview/FacultyBarChart'
import { FacultyProgressTable } from '@/components/FacultyStatistics/FacultyProgrammeOverview/FacultyProgressTable'

export const FacultyProgress = ({ faculty, progressStats, getDivider }) => {
  const bachelorStats = calculateStats(progressStats?.data?.creditCounts?.bachelor, 180)
  const bachelorMasterStats = calculateStats(
    progressStats?.data?.creditCounts?.bachelorMaster,
    faculty === 'H90' ? 360 : 300,
    180,
    7
  )
  const masterStats = calculateStats(progressStats?.data?.creditCounts?.master, 120)
  const licentiateStats = calculateStats(progressStats?.data?.creditCounts?.licentiate, 360)
  const doctorStats = calculateStats(progressStats?.data?.creditCounts?.doctor, 40, 0, 5)

  return (
    <>
      {getDivider('Bachelor', 'BachelorStudentsOfTheFacultyByStartingYear', 'no-infobox')}
      <FacultyBarChart
        cypress="FacultyBachelorsProgress"
        data={{
          id: faculty,
          stats: bachelorStats.chartStats,
          years: progressStats?.data.years,
        }}
      />
      <FacultyProgressTable
        cypress="FacultyBachelorsProgressTable"
        data={bachelorStats.tableStats}
        programmeNames={progressStats?.data.programmeNames}
        programmeStats={progressStats?.data.bachelorsProgStats}
        progressTitles={progressStats?.data.yearlyBachelorTitles}
        sortedKeys={sortProgrammeKeys(
          Object.keys(progressStats?.data.bachelorsProgStats).map(obj => [
            obj,
            progressStats?.data?.programmeNames[obj].code,
          ]),
          faculty
        ).map(listObj => listObj[0])}
        titles={bachelorStats.tableTitles}
      />
      {getDivider('Bachelor + Master', 'ProgressOfBachelorMaster', 'no-infobox')}
      <Message data-cy="FacultyProgrammesShownInfo">
        The starting year is the studyright start in the bachelor programme. The credits are computed by the start date
        of the bachelor programme and at the moment, they do not include any transferred credits. Thus, in these
        statistics some students have less credits than in reality.
      </Message>
      <FacultyBarChart
        cypress="FacultyBachelorMastersProgress"
        data={{
          id: faculty,
          stats: bachelorMasterStats.chartStats,
          years: progressStats?.data.years,
        }}
      />
      <FacultyProgressTable
        cypress="FacultyBachelorMasterProgressTable"
        data={bachelorMasterStats.tableStats}
        programmeNames={progressStats?.data.programmeNames}
        programmeStats={progressStats?.data.bcMsProgStats}
        progressTitles={progressStats?.data.yearlyBcMsTitles}
        sortedKeys={sortProgrammeKeys(
          Object.keys(progressStats?.data.bcMsProgStats).map(obj => [
            obj,
            progressStats?.data?.programmeNames[obj].code,
          ]),
          faculty
        ).map(listObj => listObj[0])}
        titles={bachelorMasterStats.tableTitles}
      />
      {faculty !== 'H90' && (
        <>
          {getDivider('Master', 'MasterStudentsOfTheFacultyByStartingYear', 'no-infobox')}
          <FacultyBarChart
            cypress="FacultyMastersProgress"
            data={{
              id: faculty,
              stats: masterStats.chartStats,
              years: progressStats?.data.years,
            }}
          />
          <FacultyProgressTable
            cypress="FacultyMastersProgressTable"
            data={masterStats.tableStats}
            programmeNames={progressStats?.data.programmeNames}
            programmeStats={progressStats?.data.mastersProgStats}
            progressTitles={progressStats?.data.yearlyMasterTitles}
            sortedKeys={sortProgrammeKeys(
              Object.keys(progressStats?.data.mastersProgStats).map(obj => [
                obj,
                progressStats?.data?.programmeNames[obj].code,
              ]),
              faculty
            ).map(listObj => listObj[0])}
            titles={masterStats.tableTitles}
          />
        </>
      )}
      {(faculty === 'H30' || faculty === 'ALL') && (
        <>
          {getDivider('Licentiate', 'LicentiateStudentsOfTheFacultyByStartingYear', 'no-infobox')}
          <FacultyBarChart
            cypress="FacultyLicentiateProgress"
            data={{
              id: faculty,
              stats: licentiateStats.chartStats,
              years: progressStats?.data.years,
            }}
          />
          <FacultyProgressTable
            cypress="FacultyLicentiateProgressTable"
            data={licentiateStats.tableStats}
            programmeNames={progressStats?.data.programmeNames}
            programmeStats={progressStats?.data.licentiateProgStats}
            progressTitles={progressStats?.data.yearlyLicentiateTitles}
            sortedKeys={sortProgrammeKeys(
              Object.keys(progressStats?.data.licentiateProgStats).map(obj => [
                obj,
                progressStats?.data?.programmeNames[obj].code,
              ]),
              faculty
            ).map(listObj => listObj[0])}
            titles={licentiateStats.tableTitles}
          />
        </>
      )}
      {getDivider('Doctor', 'DoctoralStudentsOfTheFacultyByStartingYear', 'no-infobox')}
      <FacultyBarChart
        cypress="FacultyDoctoralProgress"
        data={{
          id: faculty,
          stats: doctorStats.chartStats,
          years: progressStats?.data.years,
        }}
      />
      <FacultyProgressTable
        cypress="FacultyDoctoralProgressTable"
        data={doctorStats.tableStats}
        programmeNames={progressStats?.data.programmeNames}
        programmeStats={progressStats?.data.doctoralProgStats}
        sortedKeys={sortProgrammeKeys(
          Object.keys(progressStats?.data.doctoralProgStats).map(obj => [
            obj,
            progressStats?.data?.programmeNames[obj].code,
          ]),
          faculty
        ).map(listObj => listObj[0])}
        titles={doctorStats.tableTitles}
      />
    </>
  )
}
