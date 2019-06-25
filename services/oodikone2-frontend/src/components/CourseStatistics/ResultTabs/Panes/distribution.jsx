/* eslint-disable quotes */
import React from 'react'
import { Grid } from 'semantic-ui-react'
import { gradeGraphOptions } from '../../../../constants'
import {
  viewModeNames,
  getDataObject,
  getMaxValueOfSeries,
  dataSeriesType,
  viewModeType,
  getGradeSpread,
  getThesisGradeSpread,
  isThesisSeries
} from './util'
import StackedBarChart from '../../../StackedBarChart'

const getGradeSeries = (series) => {
  const isGradeSeries = !isThesisSeries(series)
  const newSeries = isGradeSeries ?
    getGradeSpread(series)
    : getThesisGradeSpread(series)
  return isGradeSeries
    ? [
      getDataObject('0', newSeries[0], 'a'),
      getDataObject('1', newSeries[1], 'b'),
      getDataObject('2', newSeries[2], 'c'),
      getDataObject('3', newSeries[3], 'd'),
      getDataObject('4', newSeries[4], 'e'),
      getDataObject('5', newSeries[5], 'f'),
      getDataObject('Hyv.', newSeries['Hyv.'], 'g')
    ]
    : [
      getDataObject(' I', newSeries.I, 'a'),
      getDataObject('A', newSeries.A, 'b'),
      getDataObject('NSLA', newSeries.NSLA, 'c'),
      getDataObject('LUB', newSeries.LUB, 'd'),
      getDataObject('CL', newSeries.CL, 'e'),
      getDataObject('MCLA', newSeries.MCLA, 'f'),
      getDataObject('ECLA', newSeries.ECLA, 'g'),
      getDataObject('L', newSeries.L, 'h')
    ]
}

const getGradeCumSeriesFromStats = (stats) => {
  const series = stats.flatMap(s => s.cumulative.grades)
  return getGradeSeries(series)
}

const getGradeStudSeriesFromStats = (stats) => {
  const series = stats.flatMap(s => s.students.grades)
  return getGradeSeries(series)
}

const Distribution = ({ primary, comparison, viewMode }) => {
  const isCumulativeMode = viewMode === viewModeNames.CUMULATIVE
  const primaryStats = primary.stats
  const statYears = primaryStats.map(year => year.name)
  const comparisonStats = comparison ? comparison.stats : []

  const gradeGraphSerieFn = isCumulativeMode ? getGradeCumSeriesFromStats : getGradeStudSeriesFromStats

  const gradeGraphSerie = [
    ...gradeGraphSerieFn(primaryStats)
  ]
  const comparisonGraphSerie = [
    ...gradeGraphSerieFn(comparisonStats)
  ]

  const maxGradeValue = getMaxValueOfSeries(gradeGraphSerie)

  const primaryDistributionOptions = comparison ? gradeGraphOptions(statYears, maxGradeValue, 'Primary Grades') : gradeGraphOptions(statYears, maxGradeValue, 'Grades')
  const comparisonDistributionOptions = gradeGraphOptions(statYears, maxGradeValue, 'Comparison Grades')

  return (
    <>
      <Grid.Row>
        <Grid.Column>
          <StackedBarChart
            options={primaryDistributionOptions}
            series={gradeGraphSerie}
          />
        </Grid.Column>
      </Grid.Row>
      {comparison &&
        <Grid.Row>
          <Grid.Column>
            <StackedBarChart
              options={comparisonDistributionOptions}
              series={comparisonGraphSerie}
            />
          </Grid.Column>
        </Grid.Row>
      }

    </>
  )
}

Distribution.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType,
  viewMode: viewModeType.isRequired
}

Distribution.defaultProps = {
  comparison: undefined
}

export default Distribution
