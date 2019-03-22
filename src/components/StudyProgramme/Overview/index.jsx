import React, { Component } from 'react'
import { string, func, shape, bool } from 'prop-types'
import { connect } from 'react-redux'
import ProductivityTable from '../ProductivityTable'
import ThroughputTable from '../ThroughputTable'
import { getProductivity } from '../../../redux/productivity'
import { getThroughput } from '../../../redux/throughput'

class Overview extends Component {
  componentDidMount() {
    const { studyprogramme, productivity, throughput } = this.props
    if (!productivity.data[studyprogramme]) this.props.dispatchGetProductivity(studyprogramme)
    if (!throughput.data[studyprogramme]) this.props.dispatchGetThroughput(studyprogramme)
  }

  render() {
    const { productivity, throughput, studyprogramme } = this.props
    return (
      <React.Fragment>
        <ProductivityTable
          productivity={productivity.data[studyprogramme]}
          loading={productivity.pending}
          error={productivity.error}
        />
        <ThroughputTable
          throughput={throughput.data[studyprogramme]}
          loading={throughput.pending}
          error={throughput.error}
        />
      </React.Fragment>
    )
  }
}

Overview.propTypes = {
  studyprogramme: string.isRequired,
  dispatchGetProductivity: func.isRequired,
  dispatchGetThroughput: func.isRequired,
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

const mapDispatchToProps = dispatch => ({
  dispatchGetProductivity: studyprogrammeId =>
    dispatch(getProductivity(studyprogrammeId)),
  dispatchGetThroughput: studyprogrammeId =>
    dispatch(getThroughput(studyprogrammeId))
})

const mapStateToProps = ({ studyProgrammeProductivity, studyProgrammeThroughput }) => ({
  productivity: studyProgrammeProductivity,
  throughput: studyProgrammeThroughput
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
