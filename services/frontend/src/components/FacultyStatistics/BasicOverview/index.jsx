import React from 'react'
import { Divider } from 'semantic-ui-react'
import Toggle from '../../StudyProgramme/Toggle'
import InfoBox from '../../Info/InfoBox'
import InfotoolTips from '../../../common/InfoToolTips'
import '../faculty.css'

const Overview = ({ faculty, academicYear, setAcademicYear, specialGroups, setSpecialGroups }) => {
  const toolTips = InfotoolTips.Studyprogramme
  // const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  // const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  if (!faculty) {
    return null
    // remove this
  }

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <InfoBox content="Sisältää opintopisteet suoritusvuosittain. Suoritukset on jaoteltu Sisussa näkyvän kurssin suorituspäivän mukaan." />
      {/* <InfoBox content={toolTips[toolTipText]} /> */}
    </>
  )

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
          cypress="StudentToggle"
          toolTips={toolTips.StudentToggle}
          firstLabel="All studyrights"
          secondLabel="Special studyrights excluded"
          value={specialGroups}
          setValue={setSpecialGroups}
        />
      </div>
      <>{getDivider('Credits produced by the faculty', 'CreditsProducedByTheFaculty')}</>
    </div>
  )
}

export default Overview
