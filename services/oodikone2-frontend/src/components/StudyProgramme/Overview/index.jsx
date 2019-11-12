import React, { useEffect } from 'react'
import { string, func, shape, bool } from 'prop-types'
import { connect } from 'react-redux'
import ProductivityTable from '../ProductivityTable'
import ThroughputTable from '../ThroughputTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { isNewHYStudyProgramme } from '../../../common'

const Overview = props => {
  const { productivity, throughput, studyprogramme, dispatchGetProductivity, dispatchGetThroughput, history } = props

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
  }, [])
  return (
    <React.Fragment>
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
    </React.Fragment>
  )
}

Overview.propTypes = {
  studyprogramme: string.isRequired,
  dispatchGetProductivity: func.isRequired,
  dispatchGetThroughput: func.isRequired,
  history: shape({}).isRequired,
  productivity: shape({
    error: bool,
    pending: bool,
    data: shape({})
  }).isRequired, // eslint-disable-line
  throughput: shape({
    error: bool,
    pending: bool,
    data: shape({})
  }).isRequired // eslint-disable-line
}

const mapStateToProps = ({ studyProgrammeProductivity, studyProgrammeThroughput }) => ({
  productivity: studyProgrammeProductivity,
  throughput: studyProgrammeThroughput
})

export default connect(
  mapStateToProps,
  {
    dispatchGetProductivity: getProductivity,
    dispatchGetThroughput: getThroughput
  }
)(Overview)
