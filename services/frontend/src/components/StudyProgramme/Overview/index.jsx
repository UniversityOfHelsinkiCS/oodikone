import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import ProductivityTable from '../ProductivityTable'
import ThroughputTable from '../ThroughputTable'
import BachelorsTable from '../BachelorsTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { getBasicStats } from '../../../redux/studyProgramme'
import { getBachelors } from '../../../redux/studyProgrammeBachelors'
import { isNewHYStudyProgramme } from '../../../common'
import { useIsAdmin } from '../../../common/hooks'
import LineGraph from './LineGraph'

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
  return (
    <>
      <LineGraph categories={basicStats?.data?.years} data={basicStats?.data?.graphStats} />
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
    </>
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
