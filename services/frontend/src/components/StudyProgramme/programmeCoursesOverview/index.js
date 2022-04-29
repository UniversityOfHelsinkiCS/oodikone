import React from 'react'
import { useGetProgrammeCoursesStatsQuery } from 'redux/studyProgramme'
import { Loader } from 'semantic-ui-react'
import Toggle from '../Toggle'
import InfotoolTips from '../../../common/InfoToolTips'

const ProgrammeCoursesOverview = ({ studyProgramme, academicYear, setAcademicYear }) => {
  const { /* data */ error, isLoading } = useGetProgrammeCoursesStatsQuery({
    id: studyProgramme,
    academicyear: academicYear,
  })
  const toolTips = InfotoolTips.Studyprogramme

  if (error) return <h3>Something went wrong, please try refreshing the page.</h3>

  if (isLoading) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  return (
    <div className="studyprogramme-courses">
      <div className="toggle-container">
        <Toggle
          cypress="courses_yearToggle"
          toolTips={toolTips.YearToggle}
          firstLabel="Calendar year"
          secondLabel="Academic year"
          value={academicYear}
          setValue={setAcademicYear}
        />
      </div>
    </div>
  )
}

export default ProgrammeCoursesOverview
