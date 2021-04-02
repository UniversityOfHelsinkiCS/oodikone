import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Grid } from 'semantic-ui-react'
import { string, arrayOf, bool } from 'prop-types'
import { dataSeriesType, viewModeNames, viewModeType } from './util'
import AttemptsTable from './Tables/attempts'
import StudentTable from './Tables/student'
import GradesTable from './Tables/grades'

const Tables = ({ primary, comparison, viewMode, alternatives, separate, isRelative }) => {
  const getViewMode = (name, stats) => {
    const populationsShouldBeVisible = stats[0].userHasAccessToAllStats
    switch (viewMode) {
      case viewModeNames.ATTEMPTS:
        return (
          <AttemptsTable
            separate={separate}
            name={name}
            stats={stats}
            alternatives={alternatives}
            populationsShouldBeVisible={populationsShouldBeVisible}
          />
        )
      case viewModeNames.GRADES:
        return (
          <GradesTable
            separate={separate}
            name={name}
            stats={stats}
            alternatives={alternatives}
            isRelative={isRelative}
            populationsShouldBeVisible={populationsShouldBeVisible}
          />
        )
      case viewModeNames.STUDENT:
        return (
          <StudentTable
            separate={separate}
            name={name}
            stats={stats}
            alternatives={alternatives}
            populationsShouldBeVisible={populationsShouldBeVisible}
          />
        )
      default:
        return null
    }
  }

  const getTables = (series, isPrimary) => {
    const { name, stats } = series

    return (
      <Grid.Column id={isPrimary ? 'PrimaryDataTable' : 'ComparisonDataTable'}>{getViewMode(name, stats)}</Grid.Column>
    )
  }
  return (
    <Fragment>
      {primary && getTables(primary, true)}
      {comparison && getTables(comparison, false)}
    </Fragment>
  )
}

Tables.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType,
  viewMode: viewModeType.isRequired,
  alternatives: arrayOf(string).isRequired,
  separate: bool,
  isRelative: bool.isRequired
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
