import React from 'react'
import { Divider } from 'semantic-ui-react'

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
const creditsTitles = ['', 'Major students credits', 'Non major students credits', 'Transferred credits']
const graduationsTitles = ['', 'Graduated', 'Wrote thesis']

const Overview = ({ studyprogramme }) => {
  const toolTips = InfotoolTips.Studyprogramme
  const basics = useGetBasicStatsQuery({ id: studyprogramme })
  const credits = useGetCreditStatsQuery({ id: studyprogramme })
  const graduations = useGetGraduationStatsQuery({ id: studyprogramme })

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
      {getDivider('Students of the studyprogramme', 'StudentsOfTheStudyprogramme')}
      <div className="section-container">
        <LineGraph data={basics?.data} />
        <DataTable titles={basicsTitles} data={basics?.data?.tableStats} />
      </div>
      {getDivider('Credits produced by the studyprogramme')}
      <div className="section-container">
        <StackedBarChart data={credits?.data} />
        <DataTable titles={creditsTitles} data={credits?.data?.tableStats} />
      </div>
      {getDivider('Graduated and thesis writers of the programme')}
      <div className="section-container">
        <BarChart data={graduations?.data} />
        <DataTable titles={graduationsTitles} data={graduations?.data?.tableStats} />
      </div>
      {getDivider('Graduation median time')}
      <div className="section-container">
        {graduations?.data?.years.map(year => (
          <GaugeChart
            year={year}
            data={graduations?.data?.graduationMedianTime[year]}
            amount={graduations?.data?.graduationAmounts[year]}
            studyprogramme={studyprogramme}
          />
        ))}
      </div>
      {getDivider('Graduation mean time')}
      <div className="section-container">
        {graduations?.data?.years.map(year => (
          <GaugeChart
            year={year}
            data={graduations?.data?.graduationMeanTime[year]}
            amount={graduations?.data?.graduationAmounts[year]}
            studyprogramme={studyprogramme}
          />
        ))}
      </div>
    </div>
  )
}

export default Overview
