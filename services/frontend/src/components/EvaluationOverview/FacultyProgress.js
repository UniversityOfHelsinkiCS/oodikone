import React from 'react'
import { Message } from 'semantic-ui-react'

import FacultyProgressTable from '../FacultyStatistics/FacultyProgrammeOverview/FacultyProgressTable'
import FacultyBarChart from '../FacultyStatistics/FacultyProgrammeOverview/FacultyBarChart'
import sortProgrammeKeys from '../FacultyStatistics/facultyHelpers'

const FacultyProgress = ({ faculty, progressStats, language, getDivider }) => {
  return (
    <>
      {getDivider('Bachelor', 'BachelorStudentsOfTheFacultyByStartingYear', 'no-infobox')}
      <div className="section-container">
        <div className="graph-container">
          <FacultyBarChart
            cypress="FacultyBachelorsProgress"
            data={{
              id: faculty,
              stats: progressStats?.data.bachelorsGraphStats,
              years: progressStats?.data.years,
            }}
          />
        </div>
        <div className="table-container">
          <FacultyProgressTable
            data={progressStats?.data.bachelorsTableStats}
            programmeStats={progressStats?.data.bachelorsProgStats}
            titles={progressStats?.data.bachelorTitles}
            sortedKeys={sortProgrammeKeys(
              Object.keys(progressStats?.data.bachelorsProgStats).map(obj => [
                obj,
                progressStats?.data?.programmeNames[obj].code,
              ]),
              faculty
            ).map(listObj => listObj[0])}
            progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
            programmeNames={progressStats?.data.programmeNames}
            language={language}
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
              stats: progressStats?.data.bcMsGraphStats,
              years: progressStats?.data.years,
            }}
          />
        </div>
        <div className="table-container">
          <FacultyProgressTable
            data={progressStats?.data.bcMsTableStats}
            programmeStats={progressStats?.data.bcMsProgStats}
            titles={progressStats?.data.bcMsTitles}
            sortedKeys={sortProgrammeKeys(
              Object.keys(progressStats?.data.bcMsProgStats).map(obj => [
                obj,
                progressStats?.data?.programmeNames[obj].code,
              ]),
              faculty
            ).map(listObj => listObj[0])}
            progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
            programmeNames={progressStats?.data.programmeNames}
            language={language}
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
                  stats: progressStats?.data.mastersGraphStats,
                  years: progressStats?.data.years,
                }}
              />
            </div>
            <div className="table-container">
              <FacultyProgressTable
                data={progressStats?.data.mastersTableStats}
                programmeStats={progressStats?.data.mastersProgStats}
                titles={progressStats?.data.mastersTitles}
                sortedKeys={sortProgrammeKeys(
                  Object.keys(progressStats?.data.mastersProgStats).map(obj => [
                    obj,
                    progressStats?.data?.programmeNames[obj].code,
                  ]),
                  faculty
                ).map(listObj => listObj[0])}
                progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                programmeNames={progressStats?.data.programmeNames}
                language={language}
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
              stats: progressStats?.data.doctoralGraphStats,
              years: progressStats?.data.years,
            }}
          />
        </div>
        <div className="table-container">
          <FacultyProgressTable
            data={progressStats?.data.doctoralTableStats}
            programmeStats={progressStats?.data.doctoralProgStats}
            titles={progressStats?.data.doctoralTitles}
            sortedKeys={sortProgrammeKeys(
              Object.keys(progressStats?.data.doctoralProgStats).map(obj => [
                obj,
                progressStats?.data?.programmeNames[obj].code,
              ]),
              faculty
            ).map(listObj => listObj[0])}
            progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
            programmeNames={progressStats?.data.programmeNames}
            language={language}
            cypress="FacultyDoctoralProgressTable"
          />
        </div>
      </div>
    </>
  )
}

export default FacultyProgress
