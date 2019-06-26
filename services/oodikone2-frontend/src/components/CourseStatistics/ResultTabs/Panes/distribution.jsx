/* eslint-disable quotes */
import React from 'react'
import { Grid } from 'semantic-ui-react'
import { bool } from 'prop-types'
import { gradeGraphOptions } from '../../../../constants'
import {
  viewModeNames,
  getDataObject,
  getMaxValueOfSeries,
  dataSeriesType,
  viewModeType,
  getGradeSpread,
  getThesisGradeSpread,
  isThesisSeries,
  absoluteToRelative
} from './util'
import StackedBarChart from '../../../StackedBarChart'

const getGradeSeries = (series) => {
  const isGradeSeries = !isThesisSeries(series)
  const newSeries = isGradeSeries ?
    getGradeSpread(series)
    : getThesisGradeSpread(series)
  const sumAll = Object.values(newSeries)[0].map((_, idx) => Object.values(newSeries).map(serie => serie[idx]).reduce((a, b) => a + b, 0))
  return isGradeSeries
    ? {
      absolute: [
        getDataObject('0', newSeries[0], 'a'),
        getDataObject('1', newSeries[1], 'b'),
        getDataObject('2', newSeries[2], 'c'),
        getDataObject('3', newSeries[3], 'd'),
        getDataObject('4', newSeries[4], 'e'),
        getDataObject('5', newSeries[5], 'f'),
        getDataObject('Hyv.', newSeries['Hyv.'], 'g')
      ],
      relative: [
        getDataObject('0', newSeries[0].map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('1', newSeries[1].map(absoluteToRelative(sumAll)), 'b'),
        getDataObject('2', newSeries[2].map(absoluteToRelative(sumAll)), 'c'),
        getDataObject('3', newSeries[3].map(absoluteToRelative(sumAll)), 'd'),
        getDataObject('4', newSeries[4].map(absoluteToRelative(sumAll)), 'e'),
        getDataObject('5', newSeries[5].map(absoluteToRelative(sumAll)), 'f'),
        getDataObject('Hyv.', newSeries['Hyv.'].map(absoluteToRelative(sumAll)), 'g')
      ]
    }
    : {
      absolute: [
        getDataObject(' I', newSeries.I, 'a'),
        getDataObject('A', newSeries.A, 'b'),
        getDataObject('NSLA', newSeries.NSLA, 'c'),
        getDataObject('LUB', newSeries.LUB, 'd'),
        getDataObject('CL', newSeries.CL, 'e'),
        getDataObject('MCLA', newSeries.MCLA, 'f'),
        getDataObject('ECLA', newSeries.ECLA, 'g'),
        getDataObject('L', newSeries.L, 'h')
      ],
      relative: [
        getDataObject(' I', newSeries.I.map(absoluteToRelative(sumAll)), 'a'),
        getDataObject('A', newSeries.A.map(absoluteToRelative(sumAll)), 'b'),
        getDataObject('NSLA', newSeries.NSLA.map(absoluteToRelative(sumAll)), 'c'),
        getDataObject('LUB', newSeries.LUB.map(absoluteToRelative(sumAll)), 'd'),
        getDataObject('CL', newSeries.CL.map(absoluteToRelative(sumAll)), 'e'),
        getDataObject('MCLA', newSeries.MCLA.map(absoluteToRelative(sumAll)), 'f'),
        getDataObject('ECLA', newSeries.ECLA.map(absoluteToRelative(sumAll)), 'g'),
        getDataObject('L', newSeries.L.map(absoluteToRelative(sumAll)), 'h')
      ]
    }
}

const getGradeCumSeriesFromStats = (stats) => {
  const series = stats.flatMap(s => s.cumulative.grades)
  return getGradeSeries(series)
}

const getGradeStudSeriesFromStats = (stats) => {
  const series = stats.flatMap(s => s.students.grades)
  return getGradeSeries(series)
}

const Distribution = ({ primary, comparison, viewMode, isRelative }) => {
  const isCumulativeMode = viewMode === viewModeNames.CUMULATIVE
  const primaryStats = primary.stats
  const statYears = primaryStats.map(year => year.name)
  const comparisonStats = comparison ? comparison.stats : []

  const gradeGraphSerieFn = isCumulativeMode ? getGradeCumSeriesFromStats : getGradeStudSeriesFromStats

  const gradeGraphSerie = gradeGraphSerieFn(primaryStats)
  const comparisonGraphSerie = gradeGraphSerieFn(comparisonStats)

  const maxGradeValue = isRelative ? 1 : getMaxValueOfSeries(gradeGraphSerie.absolute)

  const primaryDistributionOptions = comparison ? gradeGraphOptions(statYears, maxGradeValue, 'Primary Grades') : gradeGraphOptions(statYears, maxGradeValue, 'Grades')
  const comparisonDistributionOptions = gradeGraphOptions(statYears, maxGradeValue, 'Comparison Grades')

  return (
    <>
      <Grid.Row>
        <Grid.Column>
          <StackedBarChart
            options={primaryDistributionOptions}
            series={isRelative ? gradeGraphSerie.relative : gradeGraphSerie.absolute}
          />
        </Grid.Column>
      </Grid.Row>
      {comparison &&
        <Grid.Row>
          <Grid.Column>
            <StackedBarChart
              options={comparisonDistributionOptions}
              series={isRelative ? comparisonGraphSerie.relative : comparisonGraphSerie.absolute}
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
  viewMode: viewModeType.isRequired,
  isRelative: bool
}

Distribution.defaultProps = {
  comparison: undefined,
  isRelative: false
}

export default Distribution
