import React, { Component } from 'react'
import { string, func, shape, arrayOf, bool } from 'prop-types'
import { connect } from 'react-redux'
import ProductivityTable from '../ProductivityTable'
import { getProductivity } from '../../../redux/productivity'

class Overview extends Component {
  componentDidMount() {
    const { studyprogramme } = this.props
    this.props.dispatchGetProductivity(studyprogramme)
  }

  render() {
    const { productivity } = this.props
    return (
      <React.Fragment>
        <ProductivityTable
          productivity={productivity.data}
          loading={productivity.pending}
          error={productivity.error}
        />
      </React.Fragment>
    )
  }
}

Overview.propTypes = {
  studyprogramme: string.isRequired,
  dispatchGetProductivity: func.isRequired,
  productivity: shape({
    error: bool,
    pending: bool,
    data: arrayOf(shape({}))
  }).isRequired // eslint-disable-line
}

const mapDispatchToProps = dispatch => ({
  dispatchGetProductivity: studyprogrammeId =>
    dispatch(getProductivity(studyprogrammeId))
})

const mapStateToProps = ({ studyProgrammeProductivity }) => ({
  productivity: studyProgrammeProductivity
})

export default connect(mapStateToProps, mapDispatchToProps)(Overview)
