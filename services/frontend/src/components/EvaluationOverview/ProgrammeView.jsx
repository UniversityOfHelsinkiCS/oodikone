import { useState } from 'react'
import { Divider, Header, Loader, Message, Segment } from 'semantic-ui-react'

import { getTargetCreditsForProgramme } from '@/common'
import { studyProgrammeToolTips } from '@/common/InfoToolTips'
import { calculateStats } from '@/components/FacultyStatistics/FacultyProgrammeOverview'
import { InfoBox } from '@/components/InfoBox'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DataTable } from '@/components/StudyProgramme/BasicOverview/DataTable'
import { StackedBarChart } from '@/components/StudyProgramme/BasicOverview/StackedBarChart'
import { BreakdownBarChart } from '@/components/StudyProgramme/BreakdownBarChart'
import { MedianTimeBarChart } from '@/components/StudyProgramme/MedianTimeBarChart'
import { ProgressOfStudents } from '@/components/StudyProgramme/StudyTrackOverview/ProgressOfStudents'
import { Toggle } from '@/components/StudyProgramme/Toggle'
import '@/components/StudyProgramme/studyprogramme.css'
import { useGetEvaluationStatsQuery } from '@/redux/studyProgramme'

export const ProgrammeView = ({ studyprogramme }) => {
  const { getTextIn } = useLanguage()
  const [showMedian, setShowMedian] = useState(false)
  const [academicYear, setAcademicYear] = useState(false)
  const [graduated, setGraduated] = useState(false)

  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const grad = graduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'

  const statistics = useGetEvaluationStatsQuery({
    id: studyprogramme,
    yearType,
    specialGroups: 'SPECIAL_EXCLUDED',
    graduated: grad,
  })

  const progressStats = calculateStats(statistics?.data?.creditCounts, getTargetCreditsForProgramme(studyprogramme))
  if (progressStats?.chartStats) {
    progressStats.chartStats.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })
  }

  const progressComboStats =
    Object.keys(statistics?.data?.creditCountsCombo || {}).length > 0
      ? calculateStats(statistics.data.creditCountsCombo, getTargetCreditsForProgramme(studyprogramme) + 180)
      : null

  if (progressComboStats?.chartStats) {
    progressComboStats.chartStats.forEach(creditCategory => {
      const [total, ...years] = creditCategory.data
      creditCategory.data = [total, ...years.reverse()]
    })
  }

  const programmeName = statistics?.data?.programmeName && getTextIn(statistics?.data?.programmeName)

  const graduationData = statistics?.data?.graduations

  const doCombo = graduationData?.doCombo
  const timesData = graduationData?.graduationTimes

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <InfoBox content={studyProgrammeToolTips[toolTipText]} />
    </>
  )

  const displayMedian = () => (
    <>
      {doCombo && (
        <MedianTimeBarChart
          byStartYear={false}
          data={graduationData?.comboTimes?.medians}
          goal={graduationData?.comboTimes?.goal}
          title="Bachelor + Master study right"
        />
      )}
      <MedianTimeBarChart
        byStartYear={false}
        data={graduationData?.graduationTimes?.medians}
        goal={graduationData?.graduationTimes?.goal}
        title={doCombo ? 'Master study right' : ' '}
      />
    </>
  )

  const displayBreakdown = () => (
    <>
      {doCombo && (
        <BreakdownBarChart data={graduationData?.comboTimes?.medians} title="Bachelor + Master study right" />
      )}
      <BreakdownBarChart data={timesData?.medians} title={doCombo ? 'Master study right' : ' '} />
    </>
  )

  const isFetchingOrLoading = statistics.isLoading || statistics.isFetching

  const isError = statistics.isError || (statistics.isSuccess && !statistics.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <>
      <div align="center" style={{ padding: '30px' }}>
        <Header textAlign="center">{programmeName}</Header>
        <span>{studyprogramme}</span>
      </div>
      <div className="studyprogramme-overview">
        {isFetchingOrLoading ? (
          <Loader active style={{ marginTop: '10em' }} />
        ) : (
          <Segment className="contentSegment">
            <Message info>
              <Message.Header>This view is an abridged version of Oodikone's Studyprogramme Overview</Message.Header>
              <p style={{ marginTop: '12px' }}>
                In these statistics, the following students are excluded: Students whose studyrights{' '}
                <b>have been transferred away from or into the program</b> as well as exchange students and non-degree
                students.
              </p>
              <p>
                <b>
                  You can find more statistics on this and other studyprogrammes of the university in main
                  Studyprogramme Overview.{' '}
                </b>
                The full view includes details such as: how many have graduated or started in each programme and in its
                studytracks; credits produced by the programme; population backgrounds and enrollment statuses.
              </p>
              <p>
                Access the full Studyprogramme Overview by clicking 'Programmes' in the top navigation bar and then
                'Overview'. Alternatively, you can select 'Class statistics' to explore studyprogrammes by starting
                class with interactive statistics and visualizations.
              </p>
              <p>
                Note that both views have access restrictions. If you can't access either view and feel you should have
                access, please contact <a href="mailto:oodikone@helsinki.fi">oodikone@helsinki.fi</a>.
              </p>
            </Message>
            <div>
              {getDivider(
                'Progress of students of the study programme by starting year',
                'StudyTrackProgressEvaluationOverview'
              )}
              <Toggle
                cypress="GraduatedToggle"
                firstLabel="Graduated included"
                secondLabel="Graduated excluded"
                setValue={setGraduated}
                toolTips={studyProgrammeToolTips.GraduatedToggle}
                value={graduated}
              />
              <ProgressOfStudents
                progressComboStats={progressComboStats}
                progressStats={progressStats}
                track={studyprogramme}
                years={statistics.data.years}
              />
              {getDivider('Graduation times', 'AverageGraduationTimes')}
              <div className="toggle-container">
                <Toggle
                  cypress="GraduationTimeToggle"
                  firstLabel="Breakdown"
                  secondLabel="Median time"
                  setValue={setShowMedian}
                  value={showMedian}
                />
                <Toggle
                  cypress="YearToggle"
                  firstLabel="Calendar year"
                  secondLabel="Academic year"
                  setValue={setAcademicYear}
                  toolTips={studyProgrammeToolTips.YearToggle}
                  value={academicYear}
                />
              </div>
              <div className={`section-container${doCombo ? '' : '-centered'}`}>
                {showMedian ? displayMedian() : displayBreakdown()}
              </div>
              {graduationData?.programmesBeforeOrAfterGraphStats?.length !== 0 && (
                <>
                  {getDivider(
                    studyprogramme.includes('KH')
                      ? 'Primary master programme studies after this programme'
                      : 'Primary bachelor programme studies before this programme',
                    'ProgrammesBeforeOrAfter'
                  )}
                  <div className="section-container">
                    <StackedBarChart
                      cypress="ProgrammesBeforeOrAfter"
                      data={graduationData?.programmesBeforeOrAfterGraphStats.map(programme => ({
                        ...programme,
                        name: getTextIn(programme.name),
                      }))}
                      labels={graduationData?.years}
                      wideTable
                    />
                    <DataTable
                      data={graduationData?.programmesBeforeOrAfterTableStats.map(programme =>
                        programme.with(2, getTextIn(programme[2]))
                      )}
                      titles={graduationData?.programmesBeforeOrAfterTitles}
                      wideTable
                    />
                  </div>
                </>
              )}
            </div>
          </Segment>
        )}
      </div>
    </>
  )
}
