/* eslint-disable quotes */
import React from 'react'
import { Grid } from 'semantic-ui-react'
import StackedBarChart from '../../../StackedBarChart'
import { passRateCumGraphOptions, passRateStudGraphOptions } from '../../../../constants'
import {
  viewModeNames,
  getDataObject,
  getMaxValueOfSeries,
  dataSeriesType,
  viewModeType
} from './util'

const getPassRateCumSeriesFromStats = (stats) => {
  const all = []
  const passed = []
  const failed = []

  stats.forEach((year) => {
    const { passed: p, failed: f } = year.cumulative.categories
    all.push(p + f)
    passed.push(p)
    failed.push(f)
  })

  return [
    getDataObject(`all`, all, 'a'),
    getDataObject(`passed`, passed, 'b'),
    getDataObject(`failed`, failed, 'c')
  ]
}

const getPassRateStudSeriesFromStats = (stats) => {
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

    all.push((ff || 0) + (fr || 0) + (pf || 0) + (pr || 0))
    failedFirst.push(ff || 0)
    failedRetry.push(fr || 0)
    passedFirst.push(pf || 0)
    passedRetry.push(pr || 0)
  })

  return [
    getDataObject(`all`, all, 'a'),
    getDataObject(` passed on first try`, passedFirst, 'b'),
    getDataObject(`passed after retry`, passedRetry, 'b'),
    getDataObject(`failed on first try`, failedFirst, 'c'),
    getDataObject(`failed after retry`, failedRetry, 'c')
  ]
}

const PassRate = ({ primary, comparison, viewMode }) => {
  const isCumulativeMode = viewMode === viewModeNames.CUMULATIVE

  const primaryStats = primary.stats
  const statYears = primaryStats.map(year => year.name)
  const comparisonStats = comparison ? comparison.stats : []
  const passGraphSerieFn = isCumulativeMode ? getPassRateCumSeriesFromStats : getPassRateStudSeriesFromStats

  const passGraphSerie = [
    ...passGraphSerieFn(primaryStats)
  ]
  const comparisonGraphSerie = [
    ...passGraphSerieFn(comparisonStats)
  ]

  const maxPassRateVal = getMaxValueOfSeries(passGraphSerie)
  const graphOptionsFn = isCumulativeMode ? passRateCumGraphOptions : passRateStudGraphOptions
  const primaryGraphOptions = comparison ? graphOptionsFn(statYears, maxPassRateVal, 'Primary pass rate chart') : graphOptionsFn(statYears, maxPassRateVal, 'Pass rate chart')
  const comparisonGraphOptions = graphOptionsFn(statYears, maxPassRateVal, 'Comparison pass rate chart')

  return (
    <>
      <Grid.Row>
        <Grid.Column>
          <StackedBarChart
            options={primaryGraphOptions}
            series={passGraphSerie}
          />
        </Grid.Column>
      </Grid.Row>
      {
        comparison &&
        <Grid.Row>
          <Grid.Column>
            <StackedBarChart
              options={comparisonGraphOptions}
              series={comparisonGraphSerie}
            />
          </Grid.Column>
        </Grid.Row>
      }
    </>
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
