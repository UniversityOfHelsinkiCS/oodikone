import React from 'react'
import { Button, Divider, Loader, Message, Popup } from 'semantic-ui-react'

import { getCreditCategories } from '@/common'
import { facultyToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetFacultyProgressStatsQuery, useGetFacultyStudentStatsQuery } from '@/redux/facultyStats'
import { InfoBox } from '../../Info/InfoBox'
import { Toggle } from '../../StudyProgramme/Toggle'
import '../faculty.css'
import { sortProgrammeKeys } from '../facultyHelpers'
import { downloadProgressTableCsv, downloadStudentTableCsv } from '../xlsxFileDownloadHelper'
import { FacultyBarChart } from './FacultyBarChart'
import { FacultyProgressTable } from './FacultyProgressTable'
import { FacultyStudentDataTable } from './FacultyStudentDataTable'

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

const isBetween = (number, lowerLimit, upperLimit) => {
  return (lowerLimit === undefined || number >= lowerLimit) && (upperLimit === undefined || number < upperLimit)
}

export const calculateStats = (
  creditCounts,
  maximumAmountOfCredits,
  minimumAmountOfCredits = 0,
  numberOfCreditCategories = 7
) => {
  const tableStats = []
  if (creditCounts === undefined) return tableStats

  const limits = getCreditCategories(
    true,
    'academic-year',
    maximumAmountOfCredits,
    Object.keys(creditCounts),
    numberOfCreditCategories - 1,
    minimumAmountOfCredits
  )
  const tableTitles = ['', 'All']
  for (let i = 0; i < limits.length; i++) {
    if (limits[i][0] === undefined) tableTitles.push(`< ${limits[i][1]} credits`)
    else if (limits[i][1] === undefined) tableTitles.push(`≥ ${limits[i][0]} credits`)
    else tableTitles.push(`${limits[i][0]}–${limits[i][1]} credits`)
  }

  Object.keys(creditCounts).forEach(year => {
    const yearCreditCount = creditCounts[year]
    const yearCounts = [year, yearCreditCount.length]
    tableStats.push(yearCounts)
    for (let i = 0; i < limits.length; i++) {
      yearCounts.push(yearCreditCount.filter(credits => isBetween(credits, limits[i][0], limits[i][1])).length)
    }
  })

  const totalCounts = ['Total']
  for (let i = 1; i < tableStats[0].length; i++) {
    let columnSum = 0
    for (let j = 0; j < tableStats.length; j++) {
      columnSum += tableStats[j][i]
    }
    totalCounts.push(columnSum)
  }
  tableStats.push(totalCounts)

  // Calculate statistics for the bar chart (i.e., transpose the tableStats as rows are now columns and vice versa)
  const chartStats = []
  for (let i = 2; i < tableStats[0].length; i++) {
    const column = []
    for (let j = tableStats.length - 1; j >= 0; j--) {
      column.push(tableStats[j][i])
    }
    chartStats.push({ name: tableTitles[i].replace('<', 'Less than').replace('≥', 'At least'), data: column })
  }
  return { tableStats, chartStats, tableTitles }
}

export const FacultyProgrammeOverview = ({
  faculty,
  graduatedGroup,
  setGraduatedGroup,
  specialGroups,
  setSpecialGroups,
  requiredRights,
}) => {
  const specials = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const { getTextIn } = useLanguage()
  const progressStats = useGetFacultyProgressStatsQuery({
    id: faculty?.code,
    specialGroups: specials,
    graduated,
  })
  const studentStats = useGetFacultyStudentStatsQuery({
    id: faculty.code,
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

  // These are for color coding the rows based on the programme; bachelor, master, doctor
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
  const sortedProgrammeKeysStudents = studentStats?.data?.programmeStats
    ? sortProgrammeKeys(
        Object.keys(studentStats?.data.programmeStats).map(obj => [obj, studentStats?.data?.programmeNames[obj]?.code]),
        faculty.code
      )
    : []

  const getSortedProgrammeKeysProgress = studyLevelStats => {
    return sortProgrammeKeys(
      Object.keys(studyLevelStats).map(obj => [obj, progressStats?.data?.programmeNames[obj].code]),
      faculty.code
    )
  }

  const bachelorStats = calculateStats(progressStats?.data?.creditCounts?.bachelor, 180)
  const bachelorMasterStats = calculateStats(
    progressStats?.data?.creditCounts?.bachelorMaster,
    faculty.code === 'H90' ? 360 : 300,
    180,
    7
  )
  const masterStats = calculateStats(progressStats?.data?.creditCounts?.master, 120)
  const licentiateStats = calculateStats(progressStats?.data?.creditCounts?.licentiate, 360)
  const doctorStats = calculateStats(progressStats?.data?.creditCounts?.doctor, 40, 0, 5)

  return (
    <div className="faculty-overview">
      <div className="toggle-container">
        <Toggle
          cypress="StudentToggle"
          toolTips={facultyToolTips.StudentToggle}
          firstLabel="All studyrights"
          secondLabel="Special studyrights excluded"
          value={specialGroups}
          setValue={setSpecialGroups}
        />
        <Toggle
          cypress="GraduatedToggle"
          toolTips={facultyToolTips.GraduatedToggle}
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
                facultyToolTips.StudentsStatsOfTheFaculty,
                'InfoFacultyStudentTable'
              )}
              <Popup
                content="Download student table statistics as xlsx."
                trigger={
                  <Button
                    icon="download"
                    floated="right"
                    onClick={() =>
                      downloadStudentTableCsv(
                        studentStats,
                        studentStats?.data?.programmeNames,
                        faculty,
                        sortedProgrammeKeysStudents.map(listObj => listObj[0]),
                        getTextIn
                      )
                    }
                    style={{ backgroundColor: 'white', borderRadius: 0 }}
                  />
                }
              />
              <div>
                <FacultyStudentDataTable
                  tableStats={studentStats?.data.facultyTableStats}
                  extraTableStats={studentStats?.data.facultyTableStatsExtra}
                  programmeStats={studentStats?.data.programmeStats}
                  programmeNames={studentStats?.data.programmeNames}
                  titles={studentStats?.data.titles}
                  years={studentStats?.data.years}
                  sortedKeys={sortedProgrammeKeysStudents.map(listObj => listObj[0])}
                  tableLinePlaces={getTableLinePlaces(sortedProgrammeKeysStudents)}
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
                facultyToolTips.StudentProgress,
                'InfoFacultyProgress'
              )}
              <Popup
                content="Download progress statistics as xlsx."
                trigger={
                  <Button
                    icon="download"
                    floated="right"
                    onClick={() =>
                      downloadProgressTableCsv(
                        {
                          ...progressStats,
                          bachelorStats,
                          bachelorMasterStats,
                          masterStats,
                          doctorStats,
                        },
                        progressStats?.data?.programmeNames,
                        faculty,
                        getTextIn
                      )
                    }
                    style={{ backgroundColor: 'white', borderRadius: 0 }}
                  />
                }
              />
              {getDivider('Bachelor', 'BachelorStudentsOfTheFacultyByStartingYear', 'no-infobox')}
              <div className="section-container">
                <div className="graph-container">
                  <FacultyBarChart
                    cypress="FacultyBachelorsProgress"
                    data={{
                      id: faculty.code,
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
                    sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.bachelorsProgStats).map(
                      listObj => listObj[0]
                    )}
                    progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                    programmeNames={progressStats?.data.programmeNames}
                    cypress="FacultyBachelorsProgressTable"
                    progressTitles={progressStats?.data.yearlyBachelorTitles}
                  />
                </div>
              </div>
              {getDivider(
                faculty.code === 'H90' ? 'Bachelor + Licentiate' : 'Bachelor + Master',
                'ProgressOfBachelorMaster',
                'no-infobox'
              )}
              <Message data-cy="FacultyProgrammesShownInfo">
                Please note: The starting year is the studyright start in the bachelor programme. The credits are
                computed by the start date of the bachelor programme and at the moment, they do not include any
                transferred credits. Thus, in these statistics some students have less credits than in reality.
              </Message>
              <div className="section-container">
                <div className="graph-container">
                  <FacultyBarChart
                    cypress="FacultyBachelorMastersProgress"
                    data={{
                      id: faculty.code,
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
                    sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.bcMsProgStats).map(
                      listObj => listObj[0]
                    )}
                    programmeNames={progressStats?.data.programmeNames}
                    cypress="FacultyBachelorMasterProgressTable"
                    progressTitles={progressStats?.data.yearlyBcMsTitles}
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
                        sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.mastersProgStats).map(
                          listObj => listObj[0]
                        )}
                        programmeNames={progressStats?.data.programmeNames}
                        cypress="FacultyMastersProgressTable"
                        progressTitles={progressStats?.data.yearlyMasterTitles}
                      />
                    </div>
                  </div>
                </>
              )}
              {faculty.code === 'H30' && (
                <>
                  {getDivider('Licentiate', 'LicentiateStudentsOfTheFacultyByStartingYear', 'no-infobox')}
                  <div className="section-container">
                    <div className="graph-container">
                      <FacultyBarChart
                        cypress="FacultyLicentiateProgress"
                        data={{
                          id: faculty.code,
                          stats: licentiateStats.chartStats,
                          years: progressStats?.data.years,
                        }}
                      />
                    </div>
                    <div className="table-container">
                      <FacultyProgressTable
                        data={licentiateStats.tableStats}
                        programmeStats={progressStats?.data.licentiateProgStats}
                        titles={licentiateStats.tableTitles}
                        sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.licentiateProgStats).map(
                          listObj => listObj[0]
                        )}
                        programmeNames={progressStats?.data.programmeNames}
                        cypress="FacultyLicentiateProgressTable"
                        progressTitles={progressStats?.data.yearlyLicentiateTitles}
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
                    sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.doctoralProgStats).map(
                      listObj => listObj[0]
                    )}
                    programmeNames={progressStats?.data.programmeNames}
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
