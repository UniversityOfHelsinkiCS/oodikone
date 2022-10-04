import React from 'react'
import { Divider, Loader } from 'semantic-ui-react'
import { useGetFacultyProgressStatsQuery, useGetFacultyStudentStatsQuery } from 'redux/facultyStats'
import FacultyProgressTable from './FacultyProgressTable'
import FacultyBarChart from './FacultyBarChart'
import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'
import FacultyStudentDataTable from './FacultyStudentDataTable'
import sortProgrammeKeys from '../facultyHelpers'

const getDivider = (title, toolTipText, content) => (
  <>
    <div className="divider">
      <Divider data-cy={`Section-${toolTipText}`} horizontal>
        {title}
      </Divider>
    </div>
    {content === 'no-infobox' ? null : <InfoBox content={content} />}
  </>
)

const FacultyProgrammeOverview = ({
  faculty,
  language,
  graduatedGroup,
  setGraduatedGroup,
  specialGroups,
  setSpecialGroups,
  hasRequiredRights,
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
                toolTips.StudentsStatsOfTheFaculty
              )}
              <div>
                <FacultyStudentDataTable
                  tableStats={studentStats?.data.facultyTableStats}
                  programmeStats={studentStats?.data.programmeStats}
                  programmeNames={studentStats?.data.programmeNames}
                  titles={studentStats?.data.titles}
                  years={studentStats?.data.years}
                  sortedKeys={sortProgrammeKeys(Object.keys(studentStats?.data.programmeStats))}
                  language={language}
                  cypress="FacultyStudentStatsTable"
                  hasRequiredRights={hasRequiredRights}
                />
              </div>
            </>
          )}

          {progressStats.isSuccess && progressStats.data && (
            <>
              {getDivider(
                'Progress of students of the faculty ',
                'BachelorStudentsOfTheFacultyByStartingYear',
                toolTips.StudentProgress
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
                    programmeStats={progressStats?.data.bachelorsProgrammeStats}
                    titles={progressStats?.data.bachelorTitles}
                    sortedKeys={sortProgrammeKeys(Object.keys(progressStats?.data.bachelorsProgrammeStats))}
                    progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                    programmeNames={progressStats?.data.programmeNames}
                    language={language}
                    cypress="FacultyBachelorsProgressTable"
                  />
                </div>
              </div>
              {getDivider('Bachelor + Master', 'ProgressOfBachelorMaster', 'no-infobox')}
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
                    programmeStats={progressStats?.data.bcMsProgrammeStats}
                    titles={progressStats?.data.bcMsTitles}
                    sortedKeys={sortProgrammeKeys(Object.keys(progressStats?.data.bcMsProgrammeStats))}
                    progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                    programmeNames={progressStats?.data.programmeNames}
                    language={language}
                    cypress="FacultyBachelorMasterProgressTable"
                  />
                </div>
              </div>
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
                    programmeStats={progressStats?.data.mastersProgrammeStats}
                    titles={progressStats?.data.mastersTitles}
                    sortedKeys={sortProgrammeKeys(Object.keys(progressStats?.data.mastersProgrammeStats))}
                    progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                    programmeNames={progressStats?.data.programmeNames}
                    language={language}
                    cypress="FacultyBachelorsProgressTable"
                  />
                </div>
              </div>
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
                    programmeStats={progressStats?.data.doctoralProgrammeStats}
                    titles={progressStats?.data.doctoralTitles}
                    sortedKeys={sortProgrammeKeys(Object.keys(progressStats?.data.doctoralProgrammeStats))}
                    progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                    programmeNames={progressStats?.data.programmeNames}
                    language={language}
                    cypress="FacultyBachelorsProgressTable"
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
