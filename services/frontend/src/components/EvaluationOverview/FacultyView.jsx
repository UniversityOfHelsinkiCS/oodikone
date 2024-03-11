import React, { useState } from 'react'
import { Divider, Header, Loader, Message } from 'semantic-ui-react'

import { facultyToolTips } from '@/common/InfoToolTips'
import {
  useGetFacultiesQuery,
  useGetFacultyProgressStatsQuery,
  useGetFacultyGraduationTimesQuery,
} from '@/redux/facultyStats'
import { InfoBox } from '../Info/InfoBox'
import { useLanguage } from '../LanguagePicker/useLanguage'
import { Toggle } from '../StudyProgramme/Toggle'
import { FacultyGraduations } from './FacultyGraduations'
import { FacultyProgress } from './FacultyProgress'
import '../FacultyStatistics/faculty.css'

export const FacultyView = ({ faculty }) => {
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const [showMedian, setShowMedian] = useState(false)
  const studyProgrammeFilter = 'NEW_STUDY_PROGRAMMES'
  const specials = 'SPECIAL_EXCLUDED'
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const { getTextIn } = useLanguage()

  const allFaculties = useGetFacultiesQuery()
  const faculties = allFaculties?.data
  const facultyDetails = faculties && faculty && faculties.find(f => f.code === faculty)
  const facultyName = facultyDetails && getTextIn(facultyDetails.name)
  const progressStats = useGetFacultyProgressStatsQuery(
    {
      id: faculty,
      studyProgrammeFilter,
      specialGroups: specials,
      graduated,
    },
    { skip: !facultyDetails }
  )

  const graduationStats = useGetFacultyGraduationTimesQuery(
    { id: faculty, studyProgrammeFilter },
    { skip: !facultyDetails }
  )

  const getDivider = (title, toolTipText, content, cypress = undefined) => (
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

  if (!facultyDetails) {
    return (
      <h3>
        {getTextIn({
          en: `Faculty “${faculty}” was not found. Please check the address.`,
          fi: `Tiedekuntaa ”${faculty}” ei löytynyt. Ole hyvä ja tarkista osoite.`,
        })}
      </h3>
    )
  }

  const isFetchingOrLoading =
    progressStats.isLoading || progressStats.isFetching || graduationStats.isLoading || graduationStats.isFetching

  const isError =
    (progressStats.isError && graduationStats.isError) ||
    (progressStats.isSuccess && !progressStats.data && graduationStats.isSuccess && !graduationStats.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <>
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <Header>{facultyName}</Header>
        <span>{faculty}</span>
      </div>
      <Message info>
        <Message.Header>This view is an abridged version of Oodikone's Faculty Overview</Message.Header>
        <p>
          In these statistics, all special studyrights have been excluded, eg. exchange students and non-degree
          students.
        </p>
        <p>
          <b>You can find more statistics on this and all other faculties of the university in main Faculty view. </b>
          The full view includes details such as: how many have graduated or started in each faculty and in its
          programmes; credits produced by the faculty; populations backgrounds and enrollment statuses. This view
          provides statistics both on the whole faculty level and a breakdown of how they are spread among the faculty's
          programmes.
        </p>
        <p>Access the full Faculty view by clicking 'Faculty' in the top navigation bar.</p>
      </Message>
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
                  facultyToolTips.StudentProgress,
                  'InfoFacultyProgress'
                )}
                <div className="toggle-container">
                  <Toggle
                    cypress="GraduatedToggle"
                    firstLabel="Graduated included"
                    secondLabel="Graduated excluded"
                    setValue={setGraduatedGroup}
                    toolTips={facultyToolTips.GraduatedToggle}
                    value={graduatedGroup}
                  />
                </div>
                <FacultyProgress faculty={faculty} getDivider={getDivider} progressStats={progressStats} />
              </>
            )}
            {graduationStats.isSuccess && graduationStats.data && (
              <>
                {getDivider(
                  'Average graduation times',
                  'AverageGraduationTimes',
                  facultyToolTips.AverageGraduationTimes
                )}
                <div className="toggle-container">
                  <Toggle
                    cypress="GraduationTimeToggle"
                    firstLabel="Breakdown"
                    secondLabel="Median times"
                    setValue={setShowMedian}
                    value={showMedian}
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
