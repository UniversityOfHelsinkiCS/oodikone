import React from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import {
  useGetFacultyCreditStatsQuery,
  useGetFacultyBasicStatsQuery,
  useGetFacultyThesisStatsQuery,
} from 'redux/facultyStats'
import LineGraph from 'components/StudyProgramme/BasicOverview/LineGraph'
import StackedBarChart from 'components/StudyProgramme/BasicOverview/StackedBarChart'
import InteractiveDataTable from '../InteractiveDataView'
import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'

const Overview = ({ faculty, academicYear, setAcademicYear, studyProgrammes, setStudyProgrammes, language }) => {
  const toolTips = InfotoolTips.Studyprogramme
  const toolTipsProgramme = InfotoolTips.Faculty
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const studyProgrammeFilter = studyProgrammes ? 'ALL_PROGRAMMES' : 'NEW_STUDY_PROGRAMMES'
  const special = 'SPECIAL_INCLUDED' // specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const credits = useGetFacultyCreditStatsQuery({
    id: faculty?.code,
    yearType,
    studyProgrammeFilter,
    specialGroups: special,
  })
  const basics = useGetFacultyBasicStatsQuery({
    id: faculty?.code,
    yearType,
    studyProgrammeFilter,
    specialGroups: special,
  })

  const thesisWriters = useGetFacultyThesisStatsQuery({ id: faculty?.code, yearType, studyProgrammeFilter })

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <InfoBox content="Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan. Kaikki valmistuneet -lukumäärä sisältää kaikki mahdolliset suoritetuksi merkityt opiskeluoikeudet." />
      {/* <InfoBox content={toolTips[toolTipText]} /> */}
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

  return (
    <div className="faculty-overview">
      <div className="toggle-container">
        <Toggle
          cypress="YearToggle"
          toolTips={toolTips.YearToggle}
          firstLabel="Calendar year"
          secondLabel="Academic year"
          value={academicYear}
          setValue={setAcademicYear}
        />
        <Toggle
          cypress="ProgrammeToggle"
          toolTips={toolTipsProgramme.ProgrammeToggle}
          firstLabel="New study programmes"
          secondLabel="All study programmes"
          value={studyProgrammes}
          setValue={setStudyProgrammes}
        />
      </div>

      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '15em' }} />
      ) : (
        <>
          {basics.isSuccess && basics.data && (
            <>
              {getDivider('Students of the faculty', 'StudentsOfTheFaculty')}
              <div className="section-container">
                <LineGraph
                  cypress="StudentsOfTheFaculty"
                  data={{ ...basics?.data.studentInfo, years: basics.data.years }}
                />
                <InteractiveDataTable
                  cypress="StudentsOfTheFaculty"
                  dataStats={basics?.data?.studentInfo.tableStats}
                  dataProgrammeStats={basics?.data?.studentInfo.programmeTableStats}
                  programmeNames={basics?.data?.programmeNames}
                  sortedKeys={sortProgrammeKeys(Object.keys(basics?.data?.studentInfo.programmeTableStats))}
                  titles={basics?.data?.studentInfo.titles}
                  sliceStart={1}
                  language={language}
                  yearsVisible={Array(basics?.data?.studentInfo.tableStats.length).fill(false)}
                />
              </div>
            </>
          )}
          {credits.isSuccess && credits.data && (
            <>
              {getDivider('Credits produced by the faculty', 'CreditsProducedByTheFaculty')}
              <div className="section-container">
                <StackedBarChart
                  cypress="CreditsProducedByTheSFaculty"
                  data={credits?.data?.graphStats}
                  labels={credits?.data?.years}
                />
                <InteractiveDataTable
                  cypress="CreditsProducedByTheFaculty"
                  dataStats={credits?.data?.tableStats}
                  dataProgrammeStats={credits?.data?.programmeTableStats}
                  programmeNames={credits?.data?.programmeNames}
                  sortedKeys={sortProgrammeKeys(Object.keys(credits?.data?.programmeTableStats))}
                  titles={credits?.data?.titles}
                  extraHeight="EXTRA HEIGHT"
                  sliceStart={2}
                  language={language}
                  yearsVisible={Array(credits?.data?.tableStats.length).fill(false)}
                />
              </div>
            </>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider('Graduated of the faculty', 'GraduatedOfTheFaculty')}
              <div className="section-container">
                <LineGraph
                  cypress="GraduatedOfTheFaculty"
                  data={{ ...basics?.data.graduationInfo, years: basics.data.years }}
                />
                <InteractiveDataTable
                  cypress="GraduatedOfTheFaculty"
                  dataStats={basics?.data?.graduationInfo.tableStats}
                  dataProgrammeStats={basics?.data?.graduationInfo.programmeTableStats}
                  programmeNames={basics?.data?.programmeNames}
                  sortedKeys={sortProgrammeKeys(Object.keys(basics?.data?.graduationInfo.programmeTableStats))}
                  titles={basics?.data?.graduationInfo.titles}
                  sliceStart={2}
                  language={language}
                  yearsVisible={Array(basics?.data?.graduationInfo.tableStats.length).fill(false)}
                />
              </div>
            </>
          )}
          {thesisWriters.isSuccess && thesisWriters.data && (
            <>
              {getDivider('Thesis writers of the faculty', 'ThesisWritersOfTheFaculty')}
              <div className="section-container">
                <LineGraph
                  cypress="ThesisWritersOfTheFaculty"
                  data={{ ...thesisWriters?.data, years: thesisWriters?.data.years }}
                />
                <InteractiveDataTable
                  cypress="ThesisWritersOfTheFaculty"
                  dataStats={thesisWriters?.data.tableStats}
                  dataProgrammeStats={thesisWriters?.data.programmeTableStats}
                  programmeNames={thesisWriters?.data.programmeNames}
                  sortedKeys={sortProgrammeKeys(Object.keys(thesisWriters?.data.programmeTableStats))}
                  titles={thesisWriters?.data?.titles}
                  sliceStart={2}
                  extraHeight="EXTRA HEIGHT"
                  language={language}
                  yearsVisible={Array(thesisWriters?.data.tableStats.length).fill(false)}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Overview
