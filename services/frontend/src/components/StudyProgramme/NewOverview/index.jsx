import React, { useState } from 'react'
import { Divider, Loader, Radio } from 'semantic-ui-react'

import { useGetBasicStatsQuery, useGetCreditStatsQuery, useGetGraduationStatsQuery } from 'redux/studyProgramme'
import LineGraph from './LineGraph'
import StackedBarChart from './StackedBarChart'
import BarChart from './BarChart'
import GaugeChart from './GaugeChart'
import DataTable from './DataTable'
import InfoBox from '../../Info/InfoBox'

import InfotoolTips from '../../../common/InfoToolTips'
import '../studyprogramme.css'

const basicsTitles = ['', 'Started', 'Graduated', 'Cancelled', 'Transferred away', 'Transferred to']
const creditsTitles = ['', 'Total', 'Major students credits', 'Non major students credits', 'Transferred credits']
const graduationsTitles = ['', 'Enrolled for both semesters', 'Graduated', 'Wrote thesis']

const getRadioButton = (firstLabel, secondLabel, value, setValue) => (
  <div className="year-toggle">
    <label className="toggle-label">{firstLabel}</label>
    <Radio toggle checked={value} onChange={() => setValue(!value)} />
    <label className="toggle-label">{secondLabel}</label>
  </div>
)

const Overview = ({ studyprogramme }) => {
  const [academicYear, setAcademicYear] = useState(false)
  const toolTips = InfotoolTips.Studyprogramme
  const yearType = academicYear ? 'ACADEMIC_YEAR' : 'CALENDAR_YEAR'
  const basics = useGetBasicStatsQuery({ id: studyprogramme, yearType })
  const credits = useGetCreditStatsQuery({ id: studyprogramme, yearType })
  const graduations = useGetGraduationStatsQuery({ id: studyprogramme, yearType })

  const getDivider = (title, toolTipText) => (
    <>
      <div className="divider">
        <Divider horizontal>{title}</Divider>
      </div>
      <InfoBox content={toolTips[toolTipText]} />
    </>
  )

  return (
    <div className="studyprogramme-overview">
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px' }}>
        <p style={{ color: 'red' }}>
          Please note that this view is still very much a work in progress. This view is only visible to some admins.
        </p>
      </div>
      {getRadioButton('kalenterivuosi', 'lukuvuosi', academicYear, setAcademicYear)}
      {basics.isLoading || credits.isLoading || graduations.isLoading ? (
        <Loader active={basics.isLoading || credits.isLoading || graduations.isLoading} />
      ) : (
        <>
          {getDivider('Students of the studyprogramme', 'StudentsOfTheStudyprogramme')}
          <div className="section-container">
            <LineGraph data={basics?.data} />
            <DataTable titles={basicsTitles} data={basics?.data?.tableStats} />
          </div>
          {getDivider('Credits produced by the studyprogramme', 'CreditsProducedByTheStudyprogramme')}
          <div className="section-container">
            <StackedBarChart data={credits?.data} />
            <DataTable titles={creditsTitles} data={credits?.data?.tableStats} />
          </div>
          {getDivider('Graduated and thesis writers of the programme', 'GraduatedAndThesisWritersOfTheProgramme')}
          <div className="section-container">
            <BarChart data={graduations?.data} />
            <DataTable titles={graduationsTitles} data={graduations?.data?.tableStats} />
          </div>
          {getDivider('Graduation median time', 'GraduationMedianTime')}
          <div className="section-container">
            {graduations?.data?.years.map(year => (
              <GaugeChart
                key={year}
                year={year}
                data={graduations?.data?.graduationMedianTime[year]}
                amount={graduations?.data?.graduationAmounts[year]}
                studyprogramme={studyprogramme}
              />
            ))}
          </div>
          {getDivider('Graduation mean time', 'GraduationMeanTime')}
          <div className="section-container">
            {graduations?.data?.years.map(year => (
              <GaugeChart
                key={year}
                year={year}
                data={graduations?.data?.graduationMeanTime[year]}
                amount={graduations?.data?.graduationAmounts[year]}
                studyprogramme={studyprogramme}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Overview
