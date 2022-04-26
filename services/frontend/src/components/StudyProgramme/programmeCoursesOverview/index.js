import React from 'react'
import { useGetProgrammeCoursesStatsQuery } from 'redux/studyProgramme'
import { Loader } from 'semantic-ui-react'
import Toggle from '../Toggle'

const ProgrammeCoursesOverview = ({ studyProgramme, academicYear, setAcademicYear }) => {
  const { /* data */ error, isLoading } = useGetProgrammeCoursesStatsQuery({
    id: studyProgramme,
    academicyear: academicYear,
  })

  if (error) return <h3>Something went wrong, please try refreshing the page.</h3>

  if (isLoading) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  return (
    <div className="studyprogramme-courses">
      <div className="toggle-container">
        <Toggle
          cypress="YearToggle"
          // toolTips={toolTips.YearToggle}
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
