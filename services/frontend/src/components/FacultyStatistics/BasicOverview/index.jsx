import React from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { useGetFacultyCreditStatsQuery, useGetFacultyBasicStatsQuery } from 'redux/facultyStats'
import LineGraph from 'components/StudyProgramme/BasicOverview/LineGraph'
import StackedBarChart from 'components/StudyProgramme/BasicOverview/StackedBarChart'
import InteractiveDataTable from '../InteractiveDataView'
import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'

const Overview = ({ faculty, academicYear, setAcademicYear }) => {
  const toolTips = InfotoolTips.Studyprogramme
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const special = 'SPECIAL_INCLUDED' // specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const credits = useGetFacultyCreditStatsQuery({ id: faculty?.code, yearType, specialGroups: special })
  const basics = useGetFacultyBasicStatsQuery({ id: faculty?.code, yearType, specialGroups: special })
  // basic.data.studentsInfo --> data for students of faculty table
  // basics.data.graduationInfo --> data for graduated and thesis writers table

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
  const isFetchingOrLoading = credits.isLoading || credits.isFetching || basics.isLoading || basics.isFetching

  const isError =
    (basics.isError && credits.isError) || (basics.isSuccess && !basics.data && credits.isSuccess && !credits.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

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
      </div>

      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '10em' }} />
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
                  titles={basics?.data?.studentInfo.titles}
                  sliceStart={1}
                  language="fi"
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
                  titles={credits?.data?.titles}
                  sliceStart={2}
                  language="fi"
                />
              </div>
            </>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider('Graduated and thesis writers of the faculty', 'GraduatedAndThesisWritersOfTheFaculty')}
              <div className="section-container">
                <LineGraph
                  cypress="GraduatedAndThesisWritersOfTheFaculty"
                  data={{ ...basics?.data.graduationInfo, years: basics.data.years }}
                />
                <InteractiveDataTable
                  cypress="GraduatedAndThesisWritersOfTheFaculty"
                  dataStats={basics?.data?.graduationInfo.tableStats}
                  dataProgrammeStats={basics?.data?.graduationInfo.programmeTableStats}
                  programmeNames={basics?.data?.programmeNames}
                  titles={basics?.data?.graduationInfo.titles}
                  sliceStart={2}
                  language="fi"
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
