import React, { useState } from 'react'
import { Divider, Loader, Message, Radio } from 'semantic-ui-react'

import { useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery } from 'redux/studyProgramme'
import WithHelpTooltip from '../../Info/InfoWithHelpTooltip'
import LineGraph from './LineGraph'
import StackedBarChart from './StackedBarChart'
import BarChart from './BarChart'
import GaugeChart from './GaugeChart'
import DataTable from './DataTable'
import InfoBox from '../../Info/InfoBox'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const getRadioButton = (toolTip, firstLabel, secondLabel, value, setValue) => (
  <div className="radio-toggle">
    <label className="toggle-label">{firstLabel}</label>
    <Radio toggle checked={value} onChange={() => setValue(!value)} />
    {toolTip ? (
      <WithHelpTooltip tooltip={{ short: toolTip }}>
        <label className="toggle-label">{secondLabel}</label>
      </WithHelpTooltip>
    ) : (
      <label className="toggle-label">{secondLabel}</label>
    )}
  </div>
)

const Overview = ({ studyprogramme }) => {
  const [academicYear, setAcademicYear] = useState(false)
  const [specialGroups, setSpecialGroups] = useState(false)
  const [showMeanTime, setShowMeanTime] = useState(true)
  const toolTips = InfotoolTips.Studyprogramme
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const special = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const basics = useGetBasicStatsQuery({ id: studyprogramme, yearType, specialGroups: special })
  const credits = useGetCreditStatsQuery({ id: studyprogramme, yearType, specialGroups: special })
  const graduations = useGetGraduationStatsQuery({ id: studyprogramme, yearType, specialGroups: special })

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider horizontal>{title}</Divider>
      </div>
      <InfoBox content={toolTips[toolTipText]} />
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
        {getRadioButton(toolTips.YearToggle, 'Calendar year ', 'Academic year', academicYear, setAcademicYear)}
        {getRadioButton(
          toolTips.StudentToggle,
          'All studyrights included',
          'Special studyrights excluded',
          specialGroups,
          setSpecialGroups
        )}
      </div>

      {isFetchingOrLoading ? (
        <Loader active style={{ marginTop: '10em' }} />
      ) : (
        <>
          {!studyprogramme.includes('KH') && !studyprogramme.includes('MH') && (
            <Message>
              Please note, that the data is not complete only for current Master's and Bachelor's programmes
            </Message>
          )}
          {basics.isSuccess && basics.data && (
            <>
              {getDivider('Students of the studyprogramme', 'StudentsOfTheStudyprogramme')}
              <div className="section-container">
                <LineGraph data={basics?.data} />
                <DataTable data={basics?.data?.tableStats} titles={basics?.data?.titles} />
              </div>
            </>
          )}
          {credits.isSuccess && credits.data && (
            <>
              {getDivider('Credits produced by the studyprogramme', 'CreditsProducedByTheStudyprogramme')}
              <div className="section-container">
                <StackedBarChart data={credits?.data?.graphStats} labels={credits?.data?.years} />
                <DataTable data={credits?.data?.tableStats} titles={credits?.data?.titles} />
              </div>
            </>
          )}
          {graduations.isSuccess && graduations.data && (
            <>
              {getDivider('Graduated and thesis writers of the programme', 'GraduatedAndThesisWritersOfTheProgramme')}
              <div className="section-container">
                <BarChart data={graduations?.data} />
                <DataTable data={graduations?.data?.tableStats} titles={graduations?.data?.titles} />
              </div>
              {getDivider('Average graduation times', 'AverageGraduationTimes')}
              {getRadioButton(null, 'Mean time', 'Median time', showMeanTime, setShowMeanTime)}
              <div className="section-container-centered">
                {graduations?.data?.years.map(year => (
                  <GaugeChart
                    key={year}
                    year={year}
                    data={
                      showMeanTime
                        ? graduations?.data?.graduationMeanTime[year]
                        : graduations?.data?.graduationMedianTime[year]
                    }
                    graduationAmount={graduations?.data?.graduationAmounts[year]}
                    totalAmount={graduations?.data?.totalAmounts[year]}
                    studyprogramme={studyprogramme}
                  />
                ))}
              </div>
              {studyprogramme.includes('KH') && (
                <>
                  {getDivider('Primary master programme studies after this programme', 'ProgrammesAfterGraduation')}
                  <div className="section-container">
                    <StackedBarChart
                      wideTable
                      data={graduations?.data?.programmesAfterGraphStats}
                      labels={graduations?.data?.years}
                    />
                    <DataTable
                      wideTable
                      data={graduations?.data?.programmesAfterTableStats}
                      titles={graduations?.data?.programmesAfterTitles}
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
