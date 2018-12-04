import React from 'react'
import { Grid } from 'semantic-ui-react'
import { gradeGraphOptions } from '../../../../constants'
import {
  viewModeNames,
  graphSeriesTypes,
  getDataObject,
  getMaxValueOfSeries,
  dataSeriesType,
  viewModeType
} from './util'
import StackedBarChart from '../../../StackedBarChart'


const getGradeSeries = (series, seriesType) => {
  const { name, multiplier } = seriesType
  const failedKeys = ['Eisa', 'Hyl.', '0', 'Luop']

  const baseAccumalator = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    'Hyv.': []
  }

  const newSeries = series.reduce((acc, cur, i) => {
    const currentEntries = Object.entries(cur)
    let failed = 0
    currentEntries.forEach(([k, v]) => {
      if (failedKeys.includes(k)) {
        failed += v
      } else {
        acc[k].push(v * multiplier)
      }
    })
    acc[0].push(failed * multiplier)
    Object.entries(acc).forEach(([k, v]) => {
      if (v.length < i + 1) {
        acc[k].push(0)
      }
    })

    return acc
  }, { ...baseAccumalator })

  return [
    getDataObject(`${name} 0`, newSeries[0], 'a'),
    getDataObject(`${name} 1`, newSeries[1], 'b'),
    getDataObject(`${name} 2`, newSeries[2], 'c'),
    getDataObject(`${name} 3`, newSeries[3], 'd'),
    getDataObject(`${name} 4`, newSeries[4], 'e'),
    getDataObject(`${name} 5`, newSeries[5], 'f'),
    getDataObject(`${name} Hyv.`, newSeries['Hyv.'], 'g')
  ]
}

const getGradeCumSeriesFromStats = (stats, seriesType) => {
  const series = stats.flatMap(s => s.cumulative.grades)
  return getGradeSeries(series, seriesType)
}

const getGradeStudSeriesFromStats = (stats, seriesType) => {
  const series = stats.flatMap(s => s.students.grades)
  return getGradeSeries(series, seriesType)
}

const Distribution = ({ primary, comparison, viewMode }) => {
  const isCumulativeMode = viewMode === viewModeNames.CUMULATIVE

  const primaryStats = primary.stats
  const statYears = primaryStats.map(year => year.name)
  const comparisonStats = comparison ? comparison.stats : []

  const gradeGraphSerieFn = isCumulativeMode ? getGradeCumSeriesFromStats : getGradeStudSeriesFromStats


  const gradeGraphSerie = [
    ...gradeGraphSerieFn(primaryStats, graphSeriesTypes.PRIMARY),
    ...gradeGraphSerieFn(comparisonStats, graphSeriesTypes.COMPARISON)
  ]

  const maxGradeValue = getMaxValueOfSeries(gradeGraphSerie)

  const distributionOptions = gradeGraphOptions(statYears, maxGradeValue)

  return (
    <Grid.Column>
      <StackedBarChart
        options={distributionOptions}
        series={gradeGraphSerie}
      />
    </Grid.Column>
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
