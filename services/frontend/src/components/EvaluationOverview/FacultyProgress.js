import React from 'react'
import { Message } from 'semantic-ui-react'
import { calculateStats } from 'components/FacultyStatistics/FacultyProgrammeOverview'
import FacultyProgressTable from '../FacultyStatistics/FacultyProgrammeOverview/FacultyProgressTable'
import FacultyBarChart from '../FacultyStatistics/FacultyProgrammeOverview/FacultyBarChart'
import sortProgrammeKeys from '../FacultyStatistics/facultyHelpers'

const FacultyProgress = ({ faculty, progressStats, getDivider }) => {
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
      {getDivider('Bachelor', 'BachelorStudentsOfTheFacultyByStartingYear', 'no-infobox')}
      <div className="section-container">
        <div className="graph-container">
          <FacultyBarChart
            cypress="FacultyBachelorsProgress"
            data={{
              id: faculty,
              stats: bachelorStats.chartStats,
              years: progressStats?.data.years,
            }}
          />
        </div>
        <div className="table-container">
          <FacultyProgressTable
            data={bachelorStats.tableStats}
            programmeStats={progressStats?.data.bachelorsProgStats}
            titles={bachelorStats.tableTitles}
            sortedKeys={sortProgrammeKeys(
              Object.keys(progressStats?.data.bachelorsProgStats).map(obj => [
                obj,
                progressStats?.data?.programmeNames[obj].code,
              ]),
              faculty
            ).map(listObj => listObj[0])}
            progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
            programmeNames={progressStats?.data.programmeNames}
            cypress="FacultyBachelorsProgressTable"
            progressTitles={progressStats?.data.yearlyBachelorTitles}
          />
        </div>
      </div>
      {getDivider('Bachelor + Master', 'ProgressOfBachelorMaster', 'no-infobox')}
      <Message data-cy="FacultyProgrammesShownInfo">
        The starting year is the studyright start in the bachelor programme. The credits are comouted by the start date
        of the bachelor programme and at the moment, they do not include any transferred credits. Thus, in these
        statistics some students have less credits than in reality.
      </Message>
      <div className="section-container">
        <div className="graph-container">
          <FacultyBarChart
            cypress="FacultyBachelorMastersProgress"
            data={{
              id: faculty,
              stats: bachelorMasterStats.chartStats,
              years: progressStats?.data.years,
            }}
          />
        </div>
        <div className="table-container">
          <FacultyProgressTable
            data={bachelorMasterStats.tableStats}
            programmeStats={progressStats?.data.bcMsProgStats}
            titles={bachelorMasterStats.tableTitles}
            sortedKeys={sortProgrammeKeys(
              Object.keys(progressStats?.data.bcMsProgStats).map(obj => [
                obj,
                progressStats?.data?.programmeNames[obj].code,
              ]),
              faculty
            ).map(listObj => listObj[0])}
            progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
            programmeNames={progressStats?.data.programmeNames}
            cypress="FacultyBachelorMasterProgressTable"
            progressTitles={progressStats?.data.yearlyBcMsTitles}
            needsExtra={faculty === 'H60' ? 'NO EXTRA' : 'EXTRA HEIGHT'}
          />
        </div>
      </div>
      {!(faculty === 'H90') && (
        <>
          {getDivider('Master', 'MasterStudentsOfTheFacultyByStartingYear', 'no-infobox')}
          <div className="section-container">
            <div className="graph-container">
              <FacultyBarChart
                cypress="FacultyMastersProgress"
                data={{
                  id: faculty,
                  stats: masterStats.chartStats,
                  years: progressStats?.data.years,
                }}
              />
            </div>
            <div className="table-container">
              <FacultyProgressTable
                data={masterStats.tableStats}
                programmeStats={progressStats?.data.mastersProgStats}
                titles={masterStats.tableTitles}
                sortedKeys={sortProgrammeKeys(
                  Object.keys(progressStats?.data.mastersProgStats).map(obj => [
                    obj,
                    progressStats?.data?.programmeNames[obj].code,
                  ]),
                  faculty
                ).map(listObj => listObj[0])}
                progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                programmeNames={progressStats?.data.programmeNames}
                cypress="FacultyMastersProgressTable"
                progressTitles={progressStats?.data.yearlyMasterTitles}
                needsExtra={faculty === 'H60' ? 'NO EXTRA' : 'EXTRA HEIGHT'}
              />
            </div>
          </div>
        </>
      )}
      {getDivider('Doctor', 'DoctoralStudentsOfTheFacultyByStartingYear', 'no-infobox')}
      <div className="section-container">
        <div className="graph-container">
          <FacultyBarChart
            cypress="FacultyDoctoralProgress"
            data={{
              id: faculty,
              stats: doctorStats.chartStats,
              years: progressStats?.data.years,
            }}
          />
        </div>
        <div className="table-container">
          <FacultyProgressTable
            data={doctorStats.tableStats}
            programmeStats={progressStats?.data.doctoralProgStats}
            titles={doctorStats.tableTitles}
            sortedKeys={sortProgrammeKeys(
              Object.keys(progressStats?.data.doctoralProgStats).map(obj => [
                obj,
                progressStats?.data?.programmeNames[obj].code,
              ]),
              faculty
            ).map(listObj => listObj[0])}
            progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
            programmeNames={progressStats?.data.programmeNames}
            cypress="FacultyDoctoralProgressTable"
          />
        </div>
      </div>
    </>
  )
}

export default FacultyProgress
