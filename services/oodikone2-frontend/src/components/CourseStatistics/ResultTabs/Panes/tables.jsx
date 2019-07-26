import React, { Fragment } from 'react'
import { Grid } from 'semantic-ui-react'
import { shape, string } from 'prop-types'
import { dataSeriesType, viewModeNames, viewModeType } from './util'
import CumulativeTable from './Tables/cumulative'
import StudentTable from './Tables/student'
import GradesTable from './Tables/grades'

const Tables = ({ primary, comparison, viewMode, coursecode, history }) => {
  const getViewMode = (name, stats) => {
    switch (viewMode) {
      case viewModeNames.CUMULATIVE:
        return <CumulativeTable name={name} stats={stats} coursecode={coursecode} history={history} />
      case viewModeNames.STUDENT:
        return <StudentTable name={name} stats={stats} coursecode={coursecode} history={history} />
      case viewModeNames.GRADES:
        return <GradesTable name={name} stats={stats} coursecode={coursecode} history={history} />
      default:
        return null
    }
  }

  const getTables = (series) => {
    const { name, stats } = series
    return (
      <Grid.Column>
        {getViewMode(name, stats)}
      </Grid.Column>
    )
  }

  return (
    <Fragment>
      {primary && getTables(primary)}
      {comparison && getTables(comparison)}
    </Fragment>
  )
}

Tables.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType,
  viewMode: viewModeType.isRequired,
  coursecode: string.isRequired,
  history: shape({}).isRequired
}

Tables.defaultProps = {
  comparison: null
}

export default Tables
