import React, { useState } from 'react'
import { Divider, Header, Loader, Message, Segment } from 'semantic-ui-react'
import { useGetAllFacultiesProgressStatsQuery, useGetAllFacultiesGraduationStatsQuery } from 'redux/facultyStats'
import { facultyToolTips } from 'common/InfoToolTips'
import { Link } from 'react-router-dom'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { orderBy } from 'lodash'
import { FacultyProgress } from './FacultyProgress'
import { Toggle } from '../StudyProgramme/Toggle'
import { InfoBox } from '../Info/InfoBox'
import '../FacultyStatistics/faculty.css'
import { FacultyGraduations } from './FacultyGraduations'

export const UniversityViewPage = () => {
  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <UniversityView />
      </Segment>
    </div>
  )
}

export const UniversityView = ({ isEvaluationOverview }) => {
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const [medianMode, setMedianMode] = useState(false)
  const { isAdmin, roles } = useGetAuthorizedUserQuery()
  const userHasFacultyRights = isAdmin || roles.includes('facultyStatistics') || roles.includes('katselmusViewer')
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const progressStats = useGetAllFacultiesProgressStatsQuery({
    graduated,
  })
  const { getTextIn } = useLanguage()
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

  if (graduationStats.isLoading || graduationStats.isFetching || progressStats.isFetching || progressStats.isLoading) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  const getMessage = () => {
    if (!isEvaluationOverview) {
      return (
        <Message info>
          <p>
            In these statistics, <b>all special studyrights have been excluded</b>, eg. exchange students and non-degree
            students. A toggle will be added later to include special studyrights. Also, programme MH90_001 (Veterinary
            medicine bachelor + licentiate) is currently excluded.
          </p>
        </Message>
      )
    }
    return (
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
    )
  }

  const isError =
    progressStats.isError ||
    (progressStats.isSuccess && !progressStats.data) ||
    graduationStats.isError ||
    !graduationStats.data
  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  const allFaculties = Object.values(progressStats.data.programmeNames)
  return (
    <>
      <div style={{ padding: '30px', textAlign: 'center' }}>
        <Header>University-level view</Header>
      </div>
      {getMessage()}
      <div>
        {userHasFacultyRights && isEvaluationOverview && (
          <div>
            <p>
              <b>Click here to open the corresponding view for an individual faculty</b>
            </p>
            <div className="facultyLinkBox">
              {orderBy(allFaculties, 'code').map(faculty => (
                <span key={faculty.code}>
                  <Link style={{ marginTop: '5px' }} to={`/evaluationoverview/faculty/${faculty.code}`}>{`${
                    faculty.code
                  } ${getTextIn(faculty)}`}</Link>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="faculty-overview">
        <div className="programmes-overview">
          {getDivider(
            'Progress of students of the university ',
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
        </div>

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
          graduationStats={graduationStats}
          groupByStartYear={false}
          showMedian={medianMode}
          universityMode
        />
      </div>
    </>
  )
}
