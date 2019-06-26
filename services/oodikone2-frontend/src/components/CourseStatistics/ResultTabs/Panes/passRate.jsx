/* eslint-disable quotes */
import React from 'react'
import { Grid } from 'semantic-ui-react'
import { bool } from 'prop-types'
import StackedBarChart from '../../../StackedBarChart'
import { passRateCumGraphOptions, passRateStudGraphOptions } from '../../../../constants'
import {
  viewModeNames,
  getDataObject,
  getMaxValueOfSeries,
  dataSeriesType,
  viewModeType,
  absoluteToRelative
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

  return {
    absolute: [
      getDataObject(`all`, all, 'a'),
      getDataObject(`passed`, passed, 'b'),
      getDataObject(`failed`, failed, 'c')
    ],
    relative: [
      // eslint-disable-next-line no-unused-vars
      getDataObject(`passed`, passed.map(absoluteToRelative(all)), 'b'),
      getDataObject(`failed`, failed.map(absoluteToRelative(all)), 'c')
    ]
  }
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

  return {
    absolute: [
      getDataObject(`all`, all, 'a'),
      getDataObject(` passed on first try`, passedFirst, 'b'),
      getDataObject(`passed after retry`, passedRetry, 'b'),
      getDataObject(`failed on first try`, failedFirst, 'c'),
      getDataObject(`failed after retry`, failedRetry, 'c')
    ],
    relative: [
      // eslint-disable-next-line no-unused-vars
      getDataObject(` passed on first try`, passedFirst.map(absoluteToRelative(all)), 'b'),
      getDataObject(`passed after retry`, passedRetry.map(absoluteToRelative(all)), 'b'),
      getDataObject(`failed on first try`, failedFirst.map(absoluteToRelative(all)), 'c'),
      getDataObject(`failed after retry`, failedRetry.map(absoluteToRelative(all)), 'c')
    ]
  }
}

const PassRate = ({ primary, comparison, viewMode, isRelative = false }) => {
  const isCumulativeMode = viewMode === viewModeNames.CUMULATIVE

  const primaryStats = primary.stats
  const statYears = primaryStats.map(year => year.name)
  const comparisonStats = comparison ? comparison.stats : []
  const passGraphSerieFn = isCumulativeMode ? getPassRateCumSeriesFromStats : getPassRateStudSeriesFromStats

  const passGraphSerie = passGraphSerieFn(primaryStats)
  const comparisonGraphSerie = passGraphSerieFn(comparisonStats)

  const maxPassRateVal = isRelative ? 1 : getMaxValueOfSeries(passGraphSerie.absolute)
  const graphOptionsFn = isCumulativeMode ? passRateCumGraphOptions : passRateStudGraphOptions
  const primaryGraphOptions = comparison ? graphOptionsFn(statYears, maxPassRateVal, 'Primary pass rate chart', isRelative) : graphOptionsFn(statYears, maxPassRateVal, 'Pass rate chart', isRelative)
  const comparisonGraphOptions = graphOptionsFn(statYears, maxPassRateVal, 'Comparison pass rate chart', isRelative)

  return (
    <>
      <Grid.Row>
        <Grid.Column>
          <StackedBarChart
            options={primaryGraphOptions}
            series={isRelative ? passGraphSerie.relative : passGraphSerie.absolute}
          />
        </Grid.Column>
      </Grid.Row>
      {
        comparison &&
        <Grid.Row>
          <Grid.Column>
            <StackedBarChart
              options={comparisonGraphOptions}
              series={isRelative ? comparisonGraphSerie.relative : comparisonGraphSerie.absolute}
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
  viewMode: viewModeType.isRequired,
  isRelative: bool
}

PassRate.defaultProps = {
  comparison: undefined,
  isRelative: false
}

export default PassRate
