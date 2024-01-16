import React, { useState } from 'react'
import { Divider, Header, Loader, Message } from 'semantic-ui-react'

import {
  useGetFacultiesQuery,
  useGetAllFacultiesProgressStatsQuery,
  useGetAllFacultiesGraduationStatsQuery,
} from 'redux/facultyStats'
import { facultyToolTips } from 'common/InfoToolTips'
import { FacultyProgress } from './FacultyProgress'
import { Toggle } from '../StudyProgramme/Toggle'
import { InfoBox } from '../Info/InfoBox'
import '../FacultyStatistics/faculty.css'
import { FacultyGraduations } from './FacultyGraduations'

export const UniversityView = ({ faculty }) => {
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const allFaculties = useGetFacultiesQuery()
  const progressStats = useGetAllFacultiesProgressStatsQuery({
    graduated,
  })

  const graduationStats = useGetAllFacultiesGraduationStatsQuery()

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

  const isFetchingOrLoading =
    progressStats.isLoading || progressStats.isFetching || graduationStats.isLoading || graduationStats.isFetching

  const isError =
    progressStats.isError ||
    (progressStats.isSuccess && !progressStats.data) ||
    graduationStats.isError ||
    !graduationStats.data
  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <>
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <Header>University-level view</Header>
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
                    toolTips={facultyToolTips.GraduatedToggle}
                    firstLabel="Graduated included"
                    secondLabel="Graduated excluded"
                    value={graduatedGroup}
                    setValue={setGraduatedGroup}
                  />
                </div>
                <FacultyProgress faculty="ALL" progressStats={progressStats} getDivider={getDivider} />
              </>
            )}
          </div>
        )}
      </div>
      <>
        {getDivider('Average graduation times', 'AverageGraduationTimes', facultyToolTips.AverageGraduationTimes)}
        <div className="toggle-container">
          <Toggle
            cypress="GraduationTimeToggle"
            firstLabel="Breakdown"
            secondLabel="Median times"
            value={false}
            setValue={() => {}}
          />
        </div>
        <FacultyGraduations
          faculty={faculty}
          graduationStats={graduationStats}
          groupByStartYear={false}
          showMedian={false}
        />
      </>
    </>
  )
}
