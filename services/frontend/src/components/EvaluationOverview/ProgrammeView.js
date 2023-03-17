import React, { useState } from 'react'
import { Divider, Header, Loader, Segment } from 'semantic-ui-react'
// import { useSelector } from 'react-redux'

// import { getTextIn } from '../../common'
// import useLanguage from '../LanguagePicker/useLanguage'
import { useGetGraduationStatsQuery, useGetStudytrackStatsQuery } from 'redux/studyProgramme'
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
  // const { language } = useLanguage()
  const [showMedian, setShowMedian] = useState(false)
  const [academicYear, setAcademicYear] = useState(false)
  const [graduated, setGraduated] = useState(false)

  const toolTips = InfotoolTips.Studyprogramme
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const grad = graduated ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'

  const stats = useGetStudytrackStatsQuery({
    id: studyprogramme,
    specialGroups: 'SPECIAL_EXCLUDED',
    graduated: grad,
  })

  const graduations = useGetGraduationStatsQuery({ id: studyprogramme, yearType, specialGroups: 'SPECIAL_EXCLUDED' })
  const doCombo = graduations?.data?.doCombo
  const timesData = graduations?.data?.graduationTimes

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
          data={graduations?.data?.comboTimes?.medians}
          goal={graduations?.data?.comboTimes?.goal}
          title="Bachelor + Master studyright"
          byStartYear={false}
        />
      )}
      <MedianTimeBarChart
        data={timesData?.medians}
        goal={graduations?.data.graduationTimes?.goal}
        title={doCombo ? 'Master studyright' : ' '}
        byStartYear={false}
      />
    </>
  )

  const displayBreakdown = () => (
    <>
      {doCombo && (
        <BreakdownBarChart data={graduations?.data?.comboTimes?.medians} title="Bachelor + Master studyright" />
      )}
      <BreakdownBarChart data={timesData?.medians} title={doCombo ? 'Master studyright' : ' '} />
    </>
  )

  const isFetchingOrLoading = graduations.isLoading || graduations.isFetching || stats.isLoading || stats.isFetching

  const isError =
    (graduations.isError && stats.isError) ||
    (graduations.isSuccess && !graduations.data && stats.isSuccess && !stats.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
    <>
      <div align="center" style={{ padding: '30px' }}>
        <Header textAlign="center">{studyprogramme}</Header>
        {/* <Header textAlign="center">{programmeName}</Header>
        <span>
          {programmeLetterId ? `${programmeLetterId} - ` : ''} {studyProgrammeId}
        </span> */}
      </div>
      <div className="studyprogramme-overview">
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
                <BarChart cypress="StudytrackProgress" data={stats?.data} track={studyprogramme} />
                <BasicDataTable
                  cypress="StudytrackProgress"
                  data={stats?.data?.creditTableStats}
                  track={studyprogramme}
                  titles={stats?.data?.creditTableTitles}
                />
              </div>
              {graduations?.data?.programmesBeforeOrAfterGraphStats && (
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
                      data={graduations?.data?.programmesBeforeOrAfterGraphStats}
                      labels={graduations?.data?.years}
                    />
                    <DataTable
                      wideTable
                      data={graduations?.data?.programmesBeforeOrAfterTableStats}
                      titles={graduations?.data?.programmesBeforeOrAfterTitles}
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
