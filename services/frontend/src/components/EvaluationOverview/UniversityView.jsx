import { orderBy } from 'lodash'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Divider, Header, Loader, Message } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { facultyToolTips } from '@/common/InfoToolTips'
import '@/components/FacultyStatistics/faculty.css'
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetAllFacultiesGraduationStatsQuery, useGetAllFacultiesProgressStatsQuery } from '@/redux/facultyStats'
import { FacultyGraduations } from './FacultyGraduations'
import { FacultyProgress } from './FacultyProgress'

export const UniversityView = ({ isEvaluationOverview }) => {
  useTitle('University')
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const [medianMode, setMedianMode] = useState(false)
  const [excludeSpecials, setIncludeSpecials] = useState(isEvaluationOverview)
  const { fullAccessToStudentData, roles } = useGetAuthorizedUserQuery()
  const userHasFacultyRights =
    fullAccessToStudentData || roles.includes('facultyStatistics') || roles.includes('katselmusViewer')
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const progressStats = useGetAllFacultiesProgressStatsQuery({
    graduated,
    includeSpecials: !excludeSpecials,
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
          <p>Programme MH90_001 (Veterinary medicine bachelor + licentiate) is currently excluded.</p>
        </Message>
      )
    }
    return (
      <Message info>
        <Message.Header>This view is a combined version of Oodikone's Faculty Evaluation Overview</Message.Header>
        <p>
          In these statistics, <b>all special study rights have been excluded</b>, eg. exchange students and non-degree
          students.
        </p>
        <p>Access the full Faculty view of individual faculties by clicking 'Faculty' in the top navigation bar.</p>
        <p>
          <b>Veterinary medicine bachelor + licentiate (MH90_001) is disabled</b> and not visible in the progress stats.
          It is visible in graduation times, but notice that it is found in "Bachelor + Master" category although it has
          a target time of 6 years, whereas the other degrees in that category have a target of 5 years.
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
                  <Link to={`/evaluationoverview/faculty/${faculty.code}`}>{`${
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
            'Progress of students of the university',
            'BachelorStudentsOfTheFacultyByStartingYear',
            facultyToolTips.studentProgress,
            'InfoFacultyProgress'
          )}
          <div className="toggle-container">
            <Toggle
              cypress="GraduatedToggle"
              firstLabel="Graduated included"
              secondLabel="Graduated excluded"
              setValue={setGraduatedGroup}
              toolTips={facultyToolTips.graduatedToggle}
              value={graduatedGroup}
            />
            {!isEvaluationOverview && (
              <Toggle
                cypress="StudentToggle"
                firstLabel="All study rights"
                secondLabel="Special study rights excluded"
                setValue={() => setIncludeSpecials(!excludeSpecials)}
                toolTips={facultyToolTips.studentToggle}
                value={excludeSpecials}
              />
            )}
          </div>
          <FacultyProgress faculty="ALL" getDivider={getDivider} progressStats={progressStats} />
        </div>
        {getDivider('Average graduation times', 'AverageGraduationTimes', facultyToolTips.averageGraduationTimes)}
        <div className="toggle-container">
          <Toggle
            cypress="GraduationTimeToggle"
            firstLabel="Breakdown"
            secondLabel="Median times"
            setValue={() => setMedianMode(!medianMode)}
            value={medianMode}
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
