import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import ProductivityTable from '../ProductivityTable'
import ThroughputTable from '../ThroughputTable'
import BachelorsTable from '../BachelorsTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { getBachelors } from '../../../redux/studyProgrammeBachelors'
import { isNewHYStudyProgramme } from '../../../common'

const Overview = props => {
  const {
    productivity,
    throughput,
    bachelors,
    studyprogramme,
    dispatchGetProductivity,
    dispatchGetThroughput,
    dispatchGetBachelors,
    history,
  } = props

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
    dispatchGetBachelors(studyprogramme)
  }, [])
  return (
    <>
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

const mapStateToProps = ({ studyProgrammeProductivity, studyProgrammeThroughput, studyProgrammeBachelors }) => ({
  productivity: studyProgrammeProductivity,
  throughput: studyProgrammeThroughput,
  bachelors: studyProgrammeBachelors,
})

export default connect(mapStateToProps, {
  dispatchGetProductivity: getProductivity,
  dispatchGetThroughput: getThroughput,
  dispatchGetBachelors: getBachelors,
})(Overview)
