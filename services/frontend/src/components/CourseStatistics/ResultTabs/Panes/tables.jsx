import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Grid } from 'semantic-ui-react'
import { string, arrayOf, bool } from 'prop-types'
import { dataSeriesType, viewModeNames, viewModeType } from './util'
import StudentTable from './Tables/student'
import AttemptsTable from './Tables/attempts'

const Tables = ({
  primary,
  comparison,
  viewMode,
  alternatives,
  separate,
  isRelative,
  showGrades,
  userHasAccessToAllStats
}) => {
  const getViewMode = statistics => {
    const { name, stats } = statistics
    const headerVisible = !!comparison

    switch (viewMode) {
      case viewModeNames.ATTEMPTS:
        return (
          <AttemptsTable
            separate={separate}
            name={name}
            stats={stats}
            alternatives={alternatives}
            isRelative={isRelative}
            userHasAccessToAllStats={userHasAccessToAllStats}
            headerVisible={headerVisible}
            showGrades={showGrades}
          />
        )
      case viewModeNames.STUDENT:
        return (
          <StudentTable
            separate={separate}
            name={name}
            stats={stats}
            alternatives={alternatives}
            userHasAccessToAllStats={userHasAccessToAllStats}
            headerVisible={headerVisible}
          />
        )
      default:
        return null
    }
  }

  return (
    <Fragment>
      <Grid.Column id="PrimaryDataTable">{getViewMode(primary)}</Grid.Column>
      {comparison && <Grid.Column id="ComparisonDataTable">{getViewMode(comparison)}</Grid.Column>}
    </Fragment>
  )
}

Tables.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType,
  viewMode: viewModeType.isRequired,
  alternatives: arrayOf(string).isRequired,
  separate: bool,
  isRelative: bool.isRequired,
  showGrades: bool.isRequired,
  userHasAccessToAllStats: bool.isRequired
}

Tables.defaultProps = {
  comparison: null,
  separate: false
}

const mapStateToProps = state => {
  const { selectedCourse } = state.singleCourseStats

  return {
    alternatives: state.courseStats.data[selectedCourse].alternatives
  }
}

export default connect(mapStateToProps)(Tables)
