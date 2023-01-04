import React, { useState } from 'react'
import { Divider, Loader, Message } from 'semantic-ui-react'

import { useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery } from 'redux/studyProgramme'
import LineGraph from './LineGraph'
import StackedBarChart from './StackedBarChart'
import BarChart from './BarChart'
import TimeBarChart from '../MedianTimeBarChart'
import BreakdownBarChart from '../BreakdownBarChart'
import DataTable from './DataTable'
import Toggle from '../Toggle'
import InfoBox from '../../Info/InfoBox'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const isNewProgramme = code => code.includes('KH') || code.includes('MH') || /^(T)[0-9]{6}$/.test(code)

const Overview = ({ studyprogramme, specialGroups, setSpecialGroups, academicYear, setAcademicYear }) => {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const toolTips = InfotoolTips.Studyprogramme
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const basics = useGetBasicStatsQuery({ id: studyprogramme, yearType, specialGroups: special })
  const credits = useGetCreditStatsQuery({ id: studyprogramme, yearType, specialGroups: special })
  const graduations = useGetGraduationStatsQuery({ id: studyprogramme, yearType, specialGroups: special })
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
        <TimeBarChart
          data={graduations?.data?.comboTimes?.medians}
          goal={graduations?.data?.comboTimes?.goal}
          showMeanTime={showBreakdown}
          title="Bachelor + Master studyright"
          byStartYear={false}
        />
      )}
      <TimeBarChart
        data={timesData?.medians}
        goal={graduations?.data.graduationTimes?.goal}
        showMeanTime={showBreakdown}
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

  const isFetchingOrLoading =
    basics.isLoading ||
    credits.isLoading ||
    graduations.isLoading ||
    basics.isFetching ||
    credits.isFetching ||
    graduations.isFetching

  const isError =
    (basics.isError && credits.isError && graduations.isError) ||
    (basics.isSuccess &&
      !basics.data &&
      credits.isSuccess &&
      !credits.data &&
      graduations.isSuccess &&
      !graduations.data)

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  return (
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
        <Toggle
          cypress="StudentToggle"
          toolTips={toolTips.StudentToggle}
          firstLabel="All studyrights"
          secondLabel="Special studyrights excluded"
          value={specialGroups}
          setValue={setSpecialGroups}
        />
      </div>

      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '10em' }} />
      ) : (
        <>
          {!isNewProgramme(studyprogramme) && (
            <Message>
              Please note, that the data is complete only for current Bachelor, Masters and Doctoral programmes
            </Message>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider('Students of the studyprogramme', 'StudentsOfTheStudyprogramme')}
              <div className="section-container">
                <LineGraph cypress="StudentsOfTheStudyprogramme" data={basics?.data} />
                <DataTable
                  cypress="StudentsOfTheStudyprogramme"
                  data={basics?.data?.tableStats}
                  titles={basics?.data?.titles}
                />
              </div>
            </>
          )}
          {credits.isSuccess && credits.data && (
            <>
              {getDivider('Credits produced by the studyprogramme', 'CreditsProducedByTheStudyprogramme')}
              <div className="section-container">
                <StackedBarChart
                  cypress="CreditsProducedByTheStudyprogramme"
                  data={credits?.data?.graphStats}
                  labels={credits?.data?.years}
                />
                <DataTable
                  cypress="CreditsProducedByTheStudyprogramme"
                  data={credits?.data?.tableStats}
                  titles={credits?.data?.titles}
                />
              </div>
            </>
          )}
          {graduations.isSuccess && graduations.data && (
            <>
              {getDivider('Graduated and thesis writers of the programme', 'GraduatedAndThesisWritersOfTheProgramme')}
              <div className="section-container">
                <BarChart cypress="GraduatedAndThesisWritersOfTheProgramme" data={graduations?.data} />
                <DataTable
                  cypress="GraduatedAndThesisWritersOfTheProgramme"
                  data={graduations?.data?.tableStats}
                  titles={graduations?.data?.titles}
                />
              </div>
              {getDivider('Average graduation times', 'AverageGraduationTimes')}
              <div className="toggle-container">
                <Toggle
                  cypress="GraduationTimeToggle"
                  firstLabel="Show: Median time"
                  secondLabel="Breakdown"
                  value={showBreakdown}
                  setValue={setShowBreakdown}
                />
              </div>
              <div className={`section-container${doCombo ? '' : '-centered'}`}>
                {showBreakdown ? displayBreakdown() : displayMedian()}
              </div>
              {graduations?.data?.programmesBeforeOrAfterGraphStats && (
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
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Overview
