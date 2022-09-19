import React from 'react'
import { Divider, Loader } from 'semantic-ui-react'
import { useGetFacultyProgressStatsQuery } from 'redux/facultyStats'
import FacultyProgressTable from './FacultyProgressTable'
import FacultyBarChart from './FacultyBarChart'
// import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
// import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'

// const toolTips = InfotoolTips.Faculty

const getDivider = (title, toolTipText) => (
  <>
    <div className="divider">
      <Divider data-cy={`Section-${toolTipText}`} horizontal>
        {title}
      </Divider>
    </div>
    <InfoBox content="To be done" />
  </>
)

const FacultyProgrammeOverview = ({ faculty, language }) => {
  // const toolTipsProgramme = InfotoolTips.Faculty
  // const [programme, setProgramme] = useState(faculty)
  const studyProgrammeFilter = 'NEW_STUDY_PROGRAMMES'
  const progressStats = useGetFacultyProgressStatsQuery({ id: faculty?.code, studyProgrammeFilter })

  const isFetchingOrLoading = progressStats.isLoading || progressStats.isFetching

  const isError = progressStats.isError || (progressStats.isSuccess && !progressStats.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  /*
  Order of the programme keys: KH -> MH -> T -> FI -> K- -> Numbers containing letters at end -> Y- -> Numbers
  */
  const regexValuesAll = [
    /^KH/,
    /^MH/,
    /^T/,
    /^LI/,
    /^K-/,
    /^FI/,
    /^00901$/,
    /^00910$/,
    /^\d.*a$/,
    /^Y/,
    /\d$/,
    /^\d.*e$/,
  ]

  const testKey = value => {
    for (let i = 0; i < regexValuesAll.length; i++) {
      if (regexValuesAll[i].test(value)) {
        return i
      }
    }
    return 6
  }

  const sortProgrammeKeys = programmeKeys => {
    return programmeKeys.sort((a, b) => {
      if (testKey(a) - testKey(b) === 0) {
        return a.localeCompare(b)
      }
      return testKey(a) - testKey(b)
    })
  }
  // Toggles in studytrans ans student populations

  return (
    <div className="programmes-overview">
      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <div className="programmes-overview">
          {/* {placeholderdata && (
            <>{getDivider('Students of the faculty By Starting year', 'StudentsOfTheFacultyByStartingYear')}</>
          )} */}
          {progressStats.isSuccess && progressStats.data && (
            <>
              {getDivider(
                'Progress of bachelor students of the faculty by starting year',
                'ProgressOfBachelorStudentsOfTheFacultyByStartingYear'
              )}
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
              {getDivider(
                'Progress of master students of the faculty by starting year',
                'ProgressOfMasterStudentsOfTheFacultyByStartingYear'
              )}
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
              {getDivider(
                'Progress of doctoral students of the faculty by starting year',
                'ProgressOfDoctoralStudentsOfTheFacultyByStartingYear'
              )}
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
