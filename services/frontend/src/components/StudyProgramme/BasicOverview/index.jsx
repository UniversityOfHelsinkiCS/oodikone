import React, { useState } from 'react'
import { Divider, Loader, Message } from 'semantic-ui-react'

import { useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery } from 'redux/studyProgramme'
import LineGraph from './LineGraph'
import StackedBarChart from './StackedBarChart'
import BarChart from './BarChart'
import MedianTimeBarChart from '../MedianTimeBarChart'
import BreakdownBarChart from '../BreakdownBarChart'
import DataTable from './DataTable'
import Toggle from '../Toggle'
import InfoBox from '../../Info/InfoBox'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const isNewProgramme = code => code.includes('KH') || code.includes('MH') || /^(T)[0-9]{6}$/.test(code)
const getGraduatedText = code => {
  if (code.slice(0, 1) === 'T' || code.slice(0, 3) === 'LIS') {
    return 'Graduated of the programme'
  }
  return 'Graduated and thesis writers of the programme'
}
const getTitle = code => {
  if (code.includes('KH')) return 'Bachelor studyright'
  if (['MH90_001', 'MH30_001', 'MH30_003'].includes(code)) return 'Licentiate studyright'
  if (code.includes('MH')) return 'Master studyright'
  return 'Doctoral studyright'
}

const Overview = ({
  studyprogramme,
  combinedProgramme,
  specialGroups,
  setSpecialGroups,
  academicYear,
  setAcademicYear,
}) => {
  const [showMedian, setShowMedian] = useState(false)
  const toolTips = InfotoolTips.Studyprogramme
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const basics = useGetBasicStatsQuery({ id: studyprogramme, combinedProgramme, yearType, specialGroups: special })
  const credits = useGetCreditStatsQuery({ id: studyprogramme, combinedProgramme, yearType, specialGroups: special })
  const graduations = useGetGraduationStatsQuery({
    id: studyprogramme,
    combinedProgramme,
    yearType,
    specialGroups: special,
  })
  const doCombo = graduations?.data?.doCombo
  const timesData = graduations?.data?.graduationTimes
  const timesDataSecondProgramme = graduations?.data?.graduationTimesSecondProgramme
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
          title={studyprogramme === 'MH90_001' ? 'Bachelor + Licentiate studyright' : 'Bachelor + Master studyright'}
          byStartYear={false}
        />
      )}
      {studyprogramme !== 'MH90_001' && (
        <MedianTimeBarChart
          data={timesData?.medians}
          goal={graduations?.data.graduationTimes?.goal}
          title={getTitle(studyprogramme)}
          byStartYear={false}
        />
      )}
      {combinedProgramme && (
        <MedianTimeBarChart
          data={timesDataSecondProgramme?.medians}
          goal={graduations?.data.graduationTimesSecondProgramme?.goal}
          title={combinedProgramme === 'MH90_001' ? 'Bachelor + Licentiate studyright' : 'Bachelor + Master studyright'}
          byStartYear={false}
        />
      )}
    </>
  )

  const displayBreakdown = () => (
    <>
      {doCombo && (
        <BreakdownBarChart
          data={graduations?.data?.comboTimes?.medians}
          title={studyprogramme === 'MH90_001' ? 'Bachelor + Licentiate studyright' : 'Bachelor + Master studyright'}
        />
      )}
      {studyprogramme !== 'MH90_001' && (
        <BreakdownBarChart data={timesData?.medians} title={getTitle(studyprogramme)} />
      )}
      {combinedProgramme && (
        <BreakdownBarChart
          data={timesDataSecondProgramme?.medians}
          title={combinedProgramme === 'MH90_001' ? 'Bachelor + Licentiate studyright' : 'Bachelor + Master studyright'}
        />
      )}
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
              {combinedProgramme && credits?.data?.graphStatsSecondProg?.length > 0 && (
                <>
                  <h4>
                    {combinedProgramme === 'MH90_001'
                      ? 'Credits produced by the licentiate programme'
                      : 'Credits produced by the master programme'}
                  </h4>
                  <div className="section-container">
                    <StackedBarChart
                      cypress="CreditsProducedByTheSecondProg"
                      data={credits?.data?.graphStatsSecondProg}
                      labels={credits?.data?.years}
                    />
                    <DataTable
                      cypress="CreditsProducedByTheSecondProg"
                      data={credits?.data?.tableStatsSecondProg}
                      titles={credits?.data?.titles}
                    />
                  </div>
                </>
              )}
            </>
          )}
          {graduations.isSuccess && graduations.data && (
            <>
              {getDivider(getGraduatedText(studyprogramme), 'GraduatedAndThesisWritersOfTheProgramme')}
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
                  firstLabel="Breakdown"
                  secondLabel="Median time"
                  value={showMedian}
                  setValue={setShowMedian}
                />
              </div>
              <div className={`section-container${doCombo ? '' : '-centered'}`}>
                {showMedian ? displayMedian() : displayBreakdown()}
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
