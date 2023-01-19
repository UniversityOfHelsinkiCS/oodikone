import React from 'react'
import { Divider, Loader, Message } from 'semantic-ui-react'
import { useGetFacultyProgressStatsQuery, useGetFacultyStudentStatsQuery } from 'redux/facultyStats'
import FacultyProgressTable from './FacultyProgressTable'
import FacultyBarChart from './FacultyBarChart'
import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'
import FacultyStudentDataTable from './FacultyStudentDataTable'
import sortProgrammeKeys from '../facultyHelpers'

const getDivider = (title, toolTipText, content, cypress) => (
  <>
    <div className="divider">
      <Divider data-cy={`Section-${toolTipText}`} horizontal>
        {title}
      </Divider>
    </div>
    {content === 'no-infobox' ? null : <InfoBox content={content} cypress={cypress} />}
  </>
)
const getKey = (programmeKeys, idx) => {
  return programmeKeys[idx][1].startsWith('T') ? 'T' : programmeKeys[idx][1].slice(0, 2)
}
const FacultyProgrammeOverview = ({
  faculty,
  language,
  graduatedGroup,
  setGraduatedGroup,
  specialGroups,
  setSpecialGroups,
  requiredRights,
}) => {
  const toolTips = InfotoolTips.Faculty
  const studyProgrammeFilter = 'NEW_STUDY_PROGRAMMES'
  const specials = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const progressStats = useGetFacultyProgressStatsQuery({
    id: faculty?.code,
    studyProgrammeFilter,
    specialGroups: specials,
    graduated,
  })
  const studentStats = useGetFacultyStudentStatsQuery({
    id: faculty.code,
    studyProgrammeFilter,
    specialGroups: specials,
    graduated,
  })

  const isFetchingOrLoading =
    progressStats.isLoading || progressStats.isFetching || studentStats.isLoading || studentStats.isFetching

  const isError =
    progressStats.isError ||
    studentStats.isError ||
    (progressStats.isSuccess && !progressStats.data) ||
    (studentStats.isSuccess && !studentStats.data)
  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  const getTableLinePlaces = programmeKeys => {
    if (programmeKeys.length === 0) return []
    const key = getKey(programmeKeys, 0)
    const plotLinePlaces = [[0, key]]
    for (let i = 0; i < programmeKeys.length - 1; i++) {
      if (
        (programmeKeys[i][1].startsWith('KH') && programmeKeys[i + 1][1].startsWith('MH')) ||
        (programmeKeys[i][1].startsWith('MH') && programmeKeys[i + 1][1].startsWith('T'))
      ) {
        const key = getKey(programmeKeys, i + 1)
        plotLinePlaces.push([i + 1, key])
      }
    }
    return plotLinePlaces
  }

  return (
    <div className="faculty-overview">
      <div className="toggle-container">
        <Toggle
          cypress="StudentToggle"
          toolTips={toolTips.StudentToggle}
          firstLabel="All studyrights"
          secondLabel="Special studyrights excluded"
          value={specialGroups}
          setValue={setSpecialGroups}
        />
        <Toggle
          cypress="GraduatedToggle"
          toolTips={toolTips.GraduatedToggle}
          firstLabel="Graduated included"
          secondLabel="Graduated excluded"
          value={graduatedGroup}
          setValue={setGraduatedGroup}
        />
      </div>
      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <div className="programmes-overview">
          {studentStats && studentStats.data && (
            <>
              {getDivider(
                'Students of the faculty By Starting year',
                'StudentsOfTheFacultyByStartingYear',
                toolTips.StudentsStatsOfTheFaculty,
                'InfoFacultyStudentTable'
              )}
              <div>
                <FacultyStudentDataTable
                  tableStats={studentStats?.data.facultyTableStats}
                  programmeStats={studentStats?.data.programmeStats}
                  programmeNames={studentStats?.data.programmeNames}
                  titles={studentStats?.data.titles}
                  years={studentStats?.data.years}
                  sortedKeys={sortProgrammeKeys(
                    Object.keys(studentStats?.data.programmeStats).map(obj => [
                      obj,
                      studentStats?.data?.programmeNames[obj]?.code,
                    ]),
                    faculty.code
                  ).map(listObj => listObj[0])}
                  tableLinePlaces={getTableLinePlaces(
                    sortProgrammeKeys(
                      Object.keys(studentStats?.data?.programmeStats).map(obj => [
                        obj,
                        studentStats?.data?.programmeNames[obj].code,
                      ]),
                      faculty.code
                    )
                  )}
                  language={language}
                  cypress="FacultyStudentStatsTable"
                  requiredRights={requiredRights}
                />
              </div>
            </>
          )}

          {progressStats.isSuccess && progressStats.data && (
            <>
              {getDivider(
                'Progress of students of the faculty ',
                'BachelorStudentsOfTheFacultyByStartingYear',
                toolTips.StudentProgress,
                'InfoFacultyProgress'
              )}
              {getDivider('Bachelor', 'BachelorStudentsOfTheFacultyByStartingYear', 'no-infobox')}
              <div className="section-container">
                <div className="graph-container">
                  <FacultyBarChart
                    cypress="FacultyBachelorsProgress"
                    data={{
                      id: faculty.code,
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
                      faculty.code
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
                The starting year is the studyright start in the bachelor programme.
              </Message>
              <div className="section-container">
                <div className="graph-container">
                  <FacultyBarChart
                    cypress="FacultyBachelorMastersProgress"
                    data={{
                      id: faculty.code,
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
                      faculty.code
                    ).map(listObj => listObj[0])}
                    progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                    programmeNames={progressStats?.data.programmeNames}
                    language={language}
                    cypress="FacultyBachelorMasterProgressTable"
                    progressTitles={progressStats?.data.yearlyBcMsTitles}
                    needsExtra={faculty.code === 'H60' ? 'NO EXTRA' : 'EXTRA HEIGHT'}
                  />
                </div>
              </div>
              {!(faculty.code === 'H90') && (
                <>
                  {getDivider('Master', 'MasterStudentsOfTheFacultyByStartingYear', 'no-infobox')}
                  <div className="section-container">
                    <div className="graph-container">
                      <FacultyBarChart
                        cypress="FacultyMastersProgress"
                        data={{
                          id: faculty.code,
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
                          faculty.code
                        ).map(listObj => listObj[0])}
                        progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                        programmeNames={progressStats?.data.programmeNames}
                        language={language}
                        cypress="FacultyMastersProgressTable"
                        progressTitles={progressStats?.data.yearlyMasterTitles}
                        needsExtra={faculty.code === 'H60' ? 'NO EXTRA' : 'EXTRA HEIGHT'}
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
                      id: faculty.code,
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
                      faculty.code
                    ).map(listObj => listObj[0])}
                    progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                    programmeNames={progressStats?.data.programmeNames}
                    language={language}
                    cypress="FacultyDoctoralProgressTable"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default FacultyProgrammeOverview
