import React, { useState } from 'react'
import { Divider, Header, Loader, Segment } from 'semantic-ui-react'
import { useGetEvaluationStatsQuery } from 'redux/studyProgramme'
import { getTextIn } from '../../common'
import useLanguage from '../LanguagePicker/useLanguage'
import Toggle from '../StudyProgramme/Toggle'
import InfoBox from '../Info/InfoBox'
import MedianTimeBarChart from '../StudyProgramme/MedianTimeBarChart'
import BreakdownBarChart from '../StudyProgramme/BreakdownBarChart'
import StackedBarChart from '../StudyProgramme/BasicOverview/StackedBarChart'
import BarChart from '../StudyProgramme/StudytrackOverview/BarChart'
import BasicDataTable from '../StudyProgramme/StudytrackOverview/BasicDataTable'
import DataTable from '../StudyProgramme/BasicOverview/DataTable'
import InfotoolTips from '../../common/InfoToolTips'
import '../StudyProgramme/studyprogramme.css'

const ProgrammeView = ({ studyprogramme }) => {
  const { language } = useLanguage()
  const [showMedian, setShowMedian] = useState(false)
  const [academicYear, setAcademicYear] = useState(false)
  const [graduated, setGraduated] = useState(false)

  const toolTips = InfotoolTips.Studyprogramme
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const grad = graduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'

  const statistics = useGetEvaluationStatsQuery({
    id: studyprogramme,
    yearType,
    specialGroups: 'SPECIAL_EXCLUDED',
    graduated: grad,
  })

  const programmeName = statistics?.data?.programmeName && getTextIn(statistics?.data?.programmeName, language)

  const graduationData = statistics?.data?.graduations
  const progressData = statistics?.data?.progress

  const doCombo = graduationData?.doCombo
  const timesData = graduationData?.graduationTimes

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider data-cy={`Section-${toolTipText}`} horizontal>
          {title}
        </Divider>
      </div>
      <InfoBox content={toolTips[toolTipText]} />
    </>
  )

  const displayMedian = () => (
    <>
      {doCombo && (
        <MedianTimeBarChart
          data={graduationData?.comboTimes?.medians}
          goal={graduationData?.comboTimes?.goal}
          title="Bachelor + Master studyright"
          byStartYear={false}
        />
      )}
      <MedianTimeBarChart
        data={graduationData?.graduationTimes?.medians}
        goal={graduationData?.graduationTimes?.goal}
        title={doCombo ? 'Master studyright' : ' '}
        byStartYear={false}
      />
    </>
  )

  const displayBreakdown = () => (
    <>
      {doCombo && <BreakdownBarChart data={graduationData?.comboTimes?.medians} title="Bachelor + Master studyright" />}
      <BreakdownBarChart data={timesData?.medians} title={doCombo ? 'Master studyright' : ' '} />
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
            <div>
              {getDivider(`Progress of students of the studyprogramme by starting year`, 'StudytrackProgress')}
              <Toggle
                cypress="GraduatedToggle"
                toolTips={toolTips.GraduatedToggle}
                firstLabel="Graduated included"
                secondLabel="Graduated excluded"
                value={graduated}
                setValue={setGraduated}
              />
              <div className="section-container">
                <BarChart cypress="StudytrackProgress" data={progressData?.graphData} track={studyprogramme} />
                <BasicDataTable
                  cypress="StudytrackProgress"
                  data={progressData?.creditTableStats}
                  track={studyprogramme}
                  titles={progressData?.creditTableTitles}
                />
              </div>
              {graduationData?.programmesBeforeOrAfterGraphStats && (
                <>
                  {getDivider('Graduation times', 'AverageGraduationTimes')}
                  <div className="toggle-container">
                    <Toggle
                      cypress="GraduationTimeToggle"
                      firstLabel="Breakdown"
                      secondLabel="Median time"
                      value={showMedian}
                      setValue={setShowMedian}
                    />
                    <div className="toggle-container">
                      <Toggle
                        cypress="YearToggle"
                        toolTips={toolTips.YearToggle}
                        firstLabel="Calendar year"
                        secondLabel="Academic year"
                        value={academicYear}
                        setValue={setAcademicYear}
                      />
                    </div>
                  </div>
                  <div className={`section-container${doCombo ? '' : '-centered'}`}>
                    {showMedian ? displayMedian() : displayBreakdown()}
                  </div>
                  {getDivider(
                    studyprogramme.includes('KH')
                      ? 'Primary master programme studies after this programme'
                      : 'Primary bachelor programme studies before this programme',
                    'ProgrammesBeforeOrAfter'
                  )}
                  <div className="section-container">
                    <StackedBarChart
                      cypress="ProgrammesBeforeOrAfter"
                      wideTable
                      data={graduationData?.programmesBeforeOrAfterGraphStats}
                      labels={graduationData?.years}
                    />
                    <DataTable
                      wideTable
                      data={graduationData?.programmesBeforeOrAfterTableStats}
                      titles={graduationData?.programmesBeforeOrAfterTitles}
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

export default ProgrammeView
