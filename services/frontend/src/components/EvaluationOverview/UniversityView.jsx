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
  const [medianMode, setMedianMode] = useState(false)
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
        <Message.Header>This view is a combined version of Oodikone's Faculty Evaluation Overview</Message.Header>
        <p>
          In these statistics, <b>all special studyrights have been excluded</b>, eg. exchange students and non-degree
          students.
        </p>
        <p>Access the full Faculty view of individual faculties by clicking 'Faculty' in the top navigation bar.</p>
        <p>
          <b>Veterinary medicine bachelor + licentiate (MH90_001) is disabled</b> and not visible in the progress stats.
          It is visible in graduation times, but notice that it is found in "Bachelor + Master" category although it has
          a target time of 6 years, whereas the other degrees in that category have a target of 5 years.{' '}
        </p>
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
        {getDivider('Average graduation times', 'AverageGraduationTimes', facultyToolTips.AverageGraduationTimes)}
        <div className="toggle-container">
          <Toggle
            cypress="GraduationTimeToggle"
            firstLabel="Breakdown"
            secondLabel="Median times"
            value={medianMode}
            setValue={() => setMedianMode(!medianMode)}
          />
        </div>
        <FacultyGraduations
          faculty={faculty}
          graduationStats={graduationStats}
          groupByStartYear={false}
          showMedian={medianMode}
        />
      </div>
    </>
  )
}
