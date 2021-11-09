import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { Divider } from 'semantic-ui-react'

import LineGraph from './LineGraph'
import DataTable from './DataTable'
import ProductivityTable from '../ProductivityTable'
import ThroughputTable from '../ThroughputTable'
import BachelorsTable from '../BachelorsTable'
import InfoBox from '../../InfoBox'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { getBasicStats } from '../../../redux/studyProgramme'
import { getBachelors } from '../../../redux/studyProgrammeBachelors'
import { isNewHYStudyProgramme } from '../../../common'
import { useIsAdmin } from '../../../common/hooks'
import '../studyprogramme.css'

const basicStatsTitles = ['', 'Started', 'Graduated', 'Cancelled', 'Transferred away', 'Transferred to']

const Overview = props => {
  const {
    productivity,
    throughput,
    bachelors,
    studyprogramme,
    basicStats,
    dispatchGetProductivity,
    dispatchGetThroughput,
    dispatchGetBachelors,
    dispatchGetBasicStats,
    history,
  } = props

  const isAdmin = useIsAdmin()

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
    dispatchGetBasicStats(studyprogramme)
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
        <LineGraph categories={basicStats?.data?.years} data={basicStats?.data?.graphStats} />
        <DataTable titles={basicStatsTitles} data={basicStats?.data?.tableStats} />
      </div>
      <ThroughputTable
        throughput={throughput.data[studyprogramme]}
        thesis={throughput.data.thesis}
        loading={throughput.pending}
        error={throughput.error}
        studyprogramme={studyprogramme}
        history={history}
        newProgramme={isNewHYStudyProgramme(studyprogramme)}
      />
      <ProductivityTable
        productivity={productivity.data[studyprogramme]}
        thesis={throughput.data.thesis}
        loading={productivity.pending}
        error={productivity.error}
        showCredits={isNewHYStudyProgramme(studyprogramme)}
        newProgramme={isNewHYStudyProgramme(studyprogramme)}
      />
      <BachelorsTable bachelors={bachelors.data} loading={throughput.pending} />
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
  basicStats: studyProgramme?.data,
})

export default connect(mapStateToProps, {
  dispatchGetProductivity: getProductivity,
  dispatchGetThroughput: getThroughput,
  dispatchGetBachelors: getBachelors,
  dispatchGetBasicStats: getBasicStats,
})(Overview)
