import { Message } from 'semantic-ui-react'

import { calculateStats, sortProgrammeKeys } from '@/components/FacultyStatistics/facultyHelpers'
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
  const doctorStats = calculateStats(progressStats?.data?.creditCounts?.doctor, 40, 0, 5)

  return (
    <>
      {bachelorStats != null && (
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
            cypress="Table-FacultyBachelorsProgress"
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
        </>
      )}
      {bachelorMasterStats != null && (
        <>
          {getDivider('Bachelor + Master', 'ProgressOfBachelorMaster', 'no-infobox')}
          <Message data-cy="FacultyProgrammesShownInfo">
            The starting year is the studyright start in the bachelor programme. The credits are computed by the start
            date of the bachelor programme and at the moment, they do not include any transferred credits. Thus, in
            these statistics some students have fewer credits than in reality.
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
            cypress="Table-FacultyBachelorMastersProgress"
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
        </>
      )}
      {masterStats != null && faculty !== 'H90' && (
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
            cypress="Table-FacultyMastersProgress"
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
      {doctorStats != null && (
        <>
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
            cypress="Table-FacultyDoctoralProgress"
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
      )}
    </>
  )
}
