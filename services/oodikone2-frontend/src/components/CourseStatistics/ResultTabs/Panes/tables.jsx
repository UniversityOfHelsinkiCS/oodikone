import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Grid } from 'semantic-ui-react'
import { string, arrayOf } from 'prop-types'
import { dataSeriesType, viewModeNames, viewModeType } from './util'
import CumulativeTable from './Tables/cumulative'
import StudentTable from './Tables/student'
import GradesTable from './Tables/grades'

const Tables = ({ primary, comparison, viewMode, alternatives }) => {
  const getViewMode = (name, stats) => {
    switch (viewMode) {
      case viewModeNames.CUMULATIVE:
        return <CumulativeTable name={name} stats={stats} alternatives={alternatives} />
      case viewModeNames.STUDENT:
        return <StudentTable name={name} stats={stats} alternatives={alternatives} />
      case viewModeNames.GRADES:
        return <GradesTable name={name} stats={stats} alternatives={alternatives} />
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
  alternatives: arrayOf(string).isRequired
}

Tables.defaultProps = {
  comparison: null
}

const mapStateToProps = state => {
  const { selectedCourse } = state.singleCourseStats

  return {
    alternatives: state.courseStats.data[selectedCourse].alternatives
  }
}

export default connect(mapStateToProps)(Tables)
