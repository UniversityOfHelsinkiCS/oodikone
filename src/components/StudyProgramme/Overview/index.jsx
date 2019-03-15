import React, { Component } from 'react'
import { string, func, shape, arrayOf, bool } from 'prop-types'
import { connect } from 'react-redux'
import ProductivityTable from '../ProductivityTable'
import ThroughputTable from '../ThroughputTable'
import { getProductivity, clearProductivity } from '../../../redux/productivity'
import { getThroughput, clearThroughput } from '../../../redux/throughput'

class Overview extends Component {
  componentDidMount() {
    const { studyprogramme } = this.props
    this.props.dispatchClearProductivity()
    this.props.dispatchClearThroughput()
    this.props.dispatchGetProductivity(studyprogramme)
    this.props.dispatchGetThroughput(studyprogramme)
  }

  render() {
    const { productivity, throughput } = this.props
    return (
      <React.Fragment>
        <ProductivityTable
          productivity={productivity.data}
          loading={productivity.pending}
          error={productivity.error}
        />
        <ThroughputTable
          throughput={throughput.data}
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
  dispatchClearThroughput: func.isRequired,
  dispatchClearProductivity: func.isRequired,
  productivity: shape({
    error: bool,
    pending: bool,
    data: arrayOf(shape({}))
  }).isRequired, // eslint-disable-line
  throughput: shape({
    error: bool,
    pending: bool,
    data: arrayOf(shape({}))
  }).isRequired // eslint-disable-line
}

const mapDispatchToProps = dispatch => ({
  dispatchGetProductivity: studyprogrammeId =>
    dispatch(getProductivity(studyprogrammeId)),
  dispatchGetThroughput: studyprogrammeId =>
    dispatch(getThroughput(studyprogrammeId)),
  dispatchClearProductivity: () =>
    dispatch(clearProductivity()),
  dispatchClearThroughput: () =>
    dispatch(clearThroughput())
})

const mapStateToProps = ({ studyProgrammeProductivity, studyProgrammeThroughput }) => ({
  productivity: studyProgrammeProductivity,
  throughput: studyProgrammeThroughput
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
