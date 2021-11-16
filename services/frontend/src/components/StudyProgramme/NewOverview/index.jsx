import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Divider } from 'semantic-ui-react'

import LineGraph from './LineGraph'
import BarChart from './BarChart'
import DataTable from './DataTable'
import InfoBox from '../../InfoBox'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { getBasicStats, getCreditStats } from '../../../redux/studyProgramme'
import { getBachelors } from '../../../redux/studyProgrammeBachelors'
import { useIsAdmin } from '../../../common/hooks'
import '../studyprogramme.css'

const basicStatsTitles = ['', 'Started', 'Graduated', 'Cancelled', 'Transferred away', 'Transferred to']

const Overview = props => {
  const {
    studyprogramme,
    basicStats,
    creditStats,
    dispatchGetProductivity,
    dispatchGetThroughput,
    dispatchGetBachelors,
    dispatchGetBasicStats,
    dispatchGetCreditStats,
  } = props

  const isAdmin = useIsAdmin()

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
    dispatchGetBasicStats(studyprogramme)
    dispatchGetCreditStats(studyprogramme)
    if (isAdmin) dispatchGetBachelors(studyprogramme)
  }, [])

  const getDivider = title => (
    <>
      <div className="divider">
        <Divider horizontal>{title}</Divider>
      </div>
      <InfoBox content="testi" />
    </>
  )

  return (
    <div className="studyprogramme-overview">
      {getDivider('Students of the studyprogramme')}
      <div className="section-container">
        <LineGraph categories={basicStats?.data?.years} data={basicStats?.data?.graphStats} />
        <DataTable titles={basicStatsTitles} data={basicStats?.data?.tableStats} />
      </div>
      {getDivider('Credits produced by the studyprogramme')}
      <div className="section-container">
        <BarChart categories={basicStats?.data?.years} data={creditStats?.data?.graphStats} />
        <DataTable titles={basicStatsTitles} data={basicStats?.data?.tableStats} />
      </div>
    </div>
  )
}

const mapStateToProps = ({
  studyProgrammeProductivity,
  studyProgrammeThroughput,
  studyProgrammeBachelors,
  studyProgramme,
}) => ({
  productivity: studyProgrammeProductivity,
  throughput: studyProgrammeThroughput,
  bachelors: studyProgrammeBachelors,
  basicStats: studyProgramme?.basicStats,
  creditStats: studyProgramme?.creditStats,
})

export default connect(mapStateToProps, {
  dispatchGetProductivity: getProductivity,
  dispatchGetThroughput: getThroughput,
  dispatchGetBachelors: getBachelors,
  dispatchGetBasicStats: getBasicStats,
  dispatchGetCreditStats: getCreditStats,
})(Overview)
