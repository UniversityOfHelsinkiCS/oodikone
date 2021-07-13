import React, { useEffect } from 'react'
import { string, func, shape, bool, oneOfType, array } from 'prop-types'
import { connect } from 'react-redux'
import ProductivityTable from '../ProductivityTable'
import ThroughputTable from '../ThroughputTable'
import BachelorsTable from '../BachelorsTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'
import { getBachelors } from '../../../redux/studyProgrammeBachelors'
import { isNewHYStudyProgramme } from '../../../common'
import { useIsAdmin } from '../../../common/hooks'

const Overview = props => {
  const {
    productivity,
    throughput,
    bachelors,
    studyprogramme,
    dispatchGetProductivity,
    dispatchGetThroughput,
    dispatchGetBachelors,
    history
  } = props

  const isAdmin = useIsAdmin()

  useEffect(() => {
    dispatchGetProductivity(studyprogramme)
    dispatchGetThroughput(studyprogramme)
    if (isAdmin) dispatchGetBachelors(studyprogramme)
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
      <BachelorsTable bachelors={bachelors.data} loading={throughput.pending} />
    </React.Fragment>
  )
}

Overview.propTypes = {
  studyprogramme: string.isRequired,
  dispatchGetProductivity: func.isRequired,
  dispatchGetThroughput: func.isRequired,
  dispatchGetBachelors: func.isRequired,
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
  }).isRequired, // eslint-disable-line
  bachelors: shape({
    error: bool,
    pending: bool,
    data: oneOfType([shape({}), array])
  }).isRequired // eslint-disable-line
}

const mapStateToProps = ({ studyProgrammeProductivity, studyProgrammeThroughput, studyProgrammeBachelors }) => ({
  productivity: studyProgrammeProductivity,
  throughput: studyProgrammeThroughput,
  bachelors: studyProgrammeBachelors
})

export default connect(mapStateToProps, {
  dispatchGetProductivity: getProductivity,
  dispatchGetThroughput: getThroughput,
  dispatchGetBachelors: getBachelors
})(Overview)
