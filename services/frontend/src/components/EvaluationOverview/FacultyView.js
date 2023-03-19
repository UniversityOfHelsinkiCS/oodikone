import React, { useState } from 'react'
import { Divider, Header, Loader } from 'semantic-ui-react'
import {
  useGetFacultiesQuery,
  useGetFacultyProgressStatsQuery,
  useGetFacultyGraduationTimesQuery,
} from 'redux/facultyStats'
import { getTextIn } from 'common'

import FacultyGraduations from './FacultyGraduations'
import FacultyProgress from './FacultyProgress'

import Toggle from '../StudyProgramme/Toggle'
import InfoBox from '../Info/InfoBox'
import InfotoolTips from '../../common/InfoToolTips'
import useLanguage from '../LanguagePicker/useLanguage'
import '../FacultyStatistics/faculty.css'

const FacultyView = ({ faculty }) => {
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const [showMedian, setShowMedian] = useState(false)
  const toolTips = InfotoolTips.Faculty
  const studyProgrammeFilter = 'NEW_STUDY_PROGRAMMES'
  const specials = 'SPECIAL_EXCLUDED'
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const { language } = useLanguage()

  const allFaculties = useGetFacultiesQuery()
  const faculties = allFaculties?.data
  const facultyDetails = faculties && faculty && faculties.find(f => f.code === faculty)
  const facultyName = facultyDetails && getTextIn(facultyDetails.name, language)

  const progressStats = useGetFacultyProgressStatsQuery({
    id: faculty,
    studyProgrammeFilter,
    specialGroups: specials,
    graduated,
  })

  const graduationStats = useGetFacultyGraduationTimesQuery({ id: faculty, studyProgrammeFilter })

  const getDivider = (title, toolTipText, content = '', cypress = undefined) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      {content === 'no-infobox' ? null : <InfoBox content={content} cypress={cypress} />}
    </>
  )

  if (allFaculties.isLoading || allFaculties.isFetching) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  const isFetchingOrLoading =
    progressStats.isLoading || progressStats.isFetching || graduationStats.isLoading || graduationStats.isFetching

  const isError =
    (progressStats.isError && graduationStats.isError) ||
    (progressStats.isSuccess && !progressStats.data && graduationStats.isSuccess && !graduationStats.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <>
      <div align="center" style={{ padding: '30px' }}>
        <Header textAlign="center">{facultyName}</Header>
        <span>{faculty}</span>
      </div>
      <div className="faculty-overview">
        {isFetchingOrLoading ? (
          <Loader active style={{ marginTop: '15em' }} />
        ) : (
          <div className="programmes-overview">
            {progressStats.isSuccess && progressStats.data && (
              <>
                {getDivider(
                  'Progress of students of the faculty ',
                  'BachelorStudentsOfTheFacultyByStartingYear',
                  toolTips.StudentProgress,
                  'InfoFacultyProgress'
                )}
                <div className="toggle-container">
                  <Toggle
                    cypress="GraduatedToggle"
                    toolTips={toolTips.GraduatedToggle}
                    firstLabel="Graduated included"
                    secondLabel="Graduated excluded"
                    value={graduatedGroup}
                    setValue={setGraduatedGroup}
                  />
                </div>
                <FacultyProgress
                  faculty={faculty}
                  progressStats={progressStats}
                  language={language}
                  getDivider={getDivider}
                />
              </>
            )}
            {graduationStats.isSuccess && graduationStats.data && (
              <>
                {getDivider('Average graduation times', 'AverageGraduationTimes')}
                <div className="toggle-container">
                  <Toggle
                    cypress="GraduationTimeToggle"
                    firstLabel="Breakdown"
                    secondLabel="Median times"
                    value={showMedian}
                    setValue={setShowMedian}
                  />
                </div>
                <FacultyGraduations
                  faculty={faculty}
                  graduationStats={graduationStats}
                  groupByStartYear={false}
                  showMedian={showMedian}
                />
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default FacultyView
