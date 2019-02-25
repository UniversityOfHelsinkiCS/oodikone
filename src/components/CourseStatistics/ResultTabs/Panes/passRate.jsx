import React from 'react'
import { Grid } from 'semantic-ui-react'
import StackedBarChart from '../../../StackedBarChart'
import { passRateCumGraphOptions, passRateStudGraphOptions } from '../../../../constants'
import {
  viewModeNames,
  graphSeriesTypes,
  getDataObject,
  getMaxValueOfSeries,
  dataSeriesType,
  viewModeType
} from './util'

const getPassRateCumSeriesFromStats = (stats, seriesType) => {
  const { name, multiplier } = seriesType
  const all = []
  const passed = []
  const failed = []

  stats.forEach((year) => {
    const { passed: p, failed: f } = year.cumulative.categories
    all.push((p * multiplier) + (f * multiplier))
    passed.push(p * multiplier)
    failed.push(f * multiplier)
  })

  return [
    getDataObject(`${name} all`, all, 'a'),
    getDataObject(`${name} passed`, passed, 'b'),
    getDataObject(`${name} failed`, failed, 'c')
  ]
}

const getPassRateStudSeriesFromStats = (stats, seriesType) => {
  const { name, multiplier } = seriesType

  const all = []
  const failedFirst = []
  const failedRetry = []
  const passedFirst = []
  const passedRetry = []

  stats.forEach((year) => {
    const {
      failedFirst: ff,
      failedRetry: fr,
      passedFirst: pf,
      passedRetry: pr
    } = year.students.categories

    all.push((ff * multiplier) + (fr * multiplier) + (pf * multiplier) + (pr * multiplier))
    failedFirst.push(ff * multiplier)
    failedRetry.push(fr * multiplier)
    passedFirst.push(pf * multiplier)
    passedRetry.push(pr * multiplier)
  })

  return [
    getDataObject(`${name} all`, all, 'a'),
    getDataObject(`${name} passed on first try`, passedFirst, 'b'),
    getDataObject(`${name} passed after retry`, passedRetry, 'b'),
    getDataObject(`${name} failed on first try`, failedFirst, 'c'),
    getDataObject(`${name} failed after retry`, failedRetry, 'c')
  ]
}

const PassRate = ({ primary, comparison, viewMode }) => {
  const isCumulativeMode = viewMode === viewModeNames.CUMULATIVE

  const primaryStats = primary.stats
  const statYears = primaryStats.map(year => year.name)
  const comparisonStats = comparison ? comparison.stats : []
  const passGraphSerieFn = isCumulativeMode ? getPassRateCumSeriesFromStats : getPassRateStudSeriesFromStats

  const passGraphSerie = [
    ...passGraphSerieFn(primaryStats, graphSeriesTypes.PRIMARY),
    ...passGraphSerieFn(comparisonStats, graphSeriesTypes.COMPARISON)
  ]

  const maxPassRateVal = getMaxValueOfSeries(passGraphSerie)
  const graphOptionsFn = isCumulativeMode ? passRateCumGraphOptions : passRateStudGraphOptions
  const graphOptions = graphOptionsFn(statYears, maxPassRateVal)

  return (
    <Grid.Column>
      <StackedBarChart
        options={graphOptions}
        series={passGraphSerie}
      />
    </Grid.Column>
  )
}

PassRate.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType,
  viewMode: viewModeType.isRequired
}

PassRate.defaultProps = {
  comparison: undefined
}

export default PassRate
