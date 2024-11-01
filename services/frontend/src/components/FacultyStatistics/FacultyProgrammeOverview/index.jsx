import { Button, Divider, Loader, Message, Popup } from 'semantic-ui-react'

import { getCreditCategories } from '@/common'
import { facultyToolTips } from '@/common/InfoToolTips'
import { sortProgrammeKeys } from '@/components/FacultyStatistics/facultyHelpers'
import { downloadProgressTable, downloadStudentTable } from '@/components/FacultyStatistics/xlsxFileDownloadHelper'
import '@/components/FacultyStatistics/faculty.css'
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import { useGetFacultyProgressStatsQuery, useGetFacultyStudentStatsQuery } from '@/redux/facultyStats'
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

const getKey = (programmeKeys, index) => {
  if (programmeKeys[index][1].startsWith('T') || programmeKeys[index][1].startsWith('LIS')) {
    return 'T'
  }
  if (programmeKeys[index][1].includes('KH')) {
    return 'KH'
  }
  return 'MH'
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
  if (creditCounts === undefined) return null

  if (Object.keys(creditCounts).length === 0) return null

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
  requiredRights,
  setGraduatedGroup,
  setSpecialGroups,
  specialGroups,
}) => {
  const specials = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const { getTextIn } = useLanguage()
  const progressStats = useGetFacultyProgressStatsQuery({
    id: faculty?.id,
    specialGroups: specials,
    graduated,
  })
  const studentStats = useGetFacultyStudentStatsQuery({
    id: faculty.id,
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
        (programmeKeys[i][1].includes('KH') && programmeKeys[i + 1][1].includes('MH')) ||
        (programmeKeys[i][1].includes('MH') &&
          (programmeKeys[i + 1][1].startsWith('T') || programmeKeys[i + 1][1].startsWith('LIS')))
      ) {
        const key = getKey(programmeKeys, i + 1)
        plotLinePlaces.push([i + 1, key])
      }
    }
    return plotLinePlaces
  }
  const sortedProgrammeKeysStudents = studentStats?.data?.programmeStats
    ? Object.keys(studentStats?.data?.programmeStats || {})
        .sort((a, b) => {
          const priority = {
            'urn:code:degree-program-type:bachelors-degree': 1,
            'urn:code:degree-program-type:masters-degree': 2,
          }

          const aPriority = priority[studentStats.data.programmeNames[a].degreeProgrammeType] || 3
          const bPriority = priority[studentStats.data.programmeNames[b].degreeProgrammeType] || 3

          return aPriority - bPriority
        })
        .map(obj => [studentStats.data.programmeNames[obj]?.id, obj])
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
  const doctorStats = calculateStats(progressStats?.data?.creditCounts?.doctor, 40, 0, 5)

  const hasNonZeroStats = stats => {
    const allValuesZero = values => values.every(value => parseFloat(value) === 0)
    return stats?.chartStats.some(row => !allValuesZero(row.data))
  }

  return (
    <div className="faculty-overview">
      <div className="toggle-container">
        <Toggle
          cypress="StudentToggle"
          firstLabel="All study rights"
          secondLabel="Special study rights excluded"
          setValue={setSpecialGroups}
          toolTips={facultyToolTips.studentToggle}
          value={specialGroups}
        />
        <Toggle
          cypress="GraduatedToggle"
          firstLabel="Graduated included"
          secondLabel="Graduated excluded"
          setValue={setGraduatedGroup}
          toolTips={facultyToolTips.graduatedToggle}
          value={graduatedGroup}
        />
      </div>
      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <div className="programmes-overview">
          {studentStats?.data && (
            <>
              {getDivider(
                'Students of the faculty by starting year',
                'studentsOfTheFacultyByStartingYear',
                facultyToolTips.studentsStatsOfTheFaculty,
                'InfoFacultyStudentTable'
              )}
              <Popup
                content="Download student table statistics as xlsx."
                trigger={
                  <Button
                    floated="right"
                    icon="download"
                    onClick={() =>
                      downloadStudentTable(
                        studentStats,
                        studentStats.data.programmeNames,
                        faculty,
                        sortedProgrammeKeysStudents.map(listObj => listObj[1]),
                        getTextIn
                      )
                    }
                    style={{ backgroundColor: 'white', borderRadius: 0 }}
                  />
                }
              />
              <div>
                <FacultyStudentDataTable
                  cypress="FacultyStudentStatsTable"
                  extraTableStats={studentStats?.data.facultyTableStatsExtra}
                  programmeNames={studentStats?.data.programmeNames}
                  programmeStats={studentStats?.data.programmeStats}
                  requiredRights={requiredRights}
                  sortedKeys={sortedProgrammeKeysStudents.map(listObj => listObj[1])}
                  tableLinePlaces={getTableLinePlaces(sortedProgrammeKeysStudents)}
                  tableStats={studentStats?.data.facultyTableStats}
                  titles={studentStats?.data.titles}
                  years={studentStats?.data.years}
                />
              </div>
            </>
          )}
          {progressStats.isSuccess && progressStats.data && (
            <>
              {getDivider(
                'Progress of students of the faculty ',
                'bachelorStudentsOfTheFacultyByStartingYear',
                facultyToolTips.studentProgress,
                'InfoFacultyProgress'
              )}
              <Popup
                content="Download progress statistics as xlsx."
                trigger={
                  <Button
                    floated="right"
                    icon="download"
                    onClick={() =>
                      downloadProgressTable(
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
              {hasNonZeroStats(bachelorStats) && (
                <>
                  {getDivider('Bachelor', 'bachelorStudentsOfTheFacultyByStartingYear', 'no-infobox')}
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
                        cypress="FacultyBachelorsProgressTable"
                        data={bachelorStats.tableStats}
                        programmeNames={progressStats?.data.programmeNames}
                        programmeStats={progressStats?.data.bachelorsProgStats}
                        progressTitles={progressStats?.data.yearlyBachelorTitles}
                        progressYearsVisible={Array(progressStats?.data.years.slice(1).length).fill(false)}
                        sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.bachelorsProgStats).map(
                          listObj => listObj[0]
                        )}
                        titles={bachelorStats.tableTitles}
                      />
                    </div>
                  </div>
                </>
              )}
              {hasNonZeroStats(bachelorMasterStats) && (
                <>
                  {getDivider(
                    faculty.code === 'H90' ? 'Bachelor + Licentiate' : 'Bachelor + Master',
                    'progressOfBachelorMaster',
                    'no-infobox'
                  )}
                  <Message data-cy="FacultyProgrammesShownInfo">
                    Please note: The starting year is the studyright start in the bachelor programme. The credits are
                    computed by the start date of the bachelor programme and at the moment, they do not include any
                    transferred credits. Thus, in these statistics some students have fewer credits than in reality.
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
                        cypress="FacultyBachelorMasterProgressTable"
                        data={bachelorMasterStats.tableStats}
                        programmeNames={progressStats?.data.programmeNames}
                        programmeStats={progressStats?.data.bcMsProgStats}
                        progressTitles={progressStats?.data.yearlyBcMsTitles}
                        sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.bcMsProgStats).map(
                          listObj => listObj[0]
                        )}
                        titles={bachelorMasterStats.tableTitles}
                      />
                    </div>
                  </div>
                </>
              )}
              {hasNonZeroStats(masterStats) && !(faculty.code === 'H90') && (
                <>
                  {getDivider('Master', 'masterStudentsOfTheFacultyByStartingYear', 'no-infobox')}
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
                        cypress="FacultyMastersProgressTable"
                        data={masterStats.tableStats}
                        programmeNames={progressStats?.data.programmeNames}
                        programmeStats={progressStats?.data.mastersProgStats}
                        progressTitles={progressStats?.data.yearlyMasterTitles}
                        sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.mastersProgStats).map(
                          listObj => listObj[0]
                        )}
                        titles={masterStats.tableTitles}
                      />
                    </div>
                  </div>
                </>
              )}
              {hasNonZeroStats(doctorStats) && (
                <>
                  {getDivider('Doctor', 'doctoralStudentsOfTheFacultyByStartingYear', 'no-infobox')}
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
                        cypress="FacultyDoctoralProgressTable"
                        data={doctorStats.tableStats}
                        programmeNames={progressStats?.data.programmeNames}
                        programmeStats={progressStats?.data.doctoralProgStats}
                        sortedKeys={getSortedProgrammeKeysProgress(progressStats?.data.doctoralProgStats).map(
                          listObj => listObj[0]
                        )}
                        titles={doctorStats.tableTitles}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
