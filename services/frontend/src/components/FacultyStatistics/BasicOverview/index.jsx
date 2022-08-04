import React from 'react'
import { Divider, Loader } from 'semantic-ui-react'

import { useGetFacultyCreditStatsQuery, useGetFacultyBasicStatsQuery } from 'redux/facultyStats'
import LineGraph from 'components/StudyProgramme/BasicOverview/LineGraph'
import StackedBarChart from 'components/StudyProgramme/BasicOverview/StackedBarChart'
import DataTable from 'components/StudyProgramme/BasicOverview/DataTable'
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
                <LineGraph cypress="StudentsOfTheFaculty" data={basics?.data} />
                <DataTable
                  cypress="StudentsOfTheFaculty"
                  data={basics?.data?.tableStats}
                  titles={basics?.data?.titles}
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
                  titles={credits?.data?.titles}
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
