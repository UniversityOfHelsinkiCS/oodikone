/* eslint-disable quotes */
import React from 'react'
import { Grid } from 'semantic-ui-react'
import { bool } from 'prop-types'
import StackedBarChart from '../../../StackedBarChart'
import { passRateAttemptGraphOptions, passRateStudGraphOptions } from '../../../../constants'
import {
  viewModeNames,
  getDataObject,
  getMaxValueOfSeries,
  dataSeriesType,
  viewModeType,
  absoluteToRelative,
} from './util'

const getPassRateAttemptSeriesFromStats = stats => {
  const all = []
  const passed = []
  const failed = []

  stats.forEach(year => {
    const { passed: p, failed: f } = year.attempts.categories
    all.push(p + f)
    passed.push(p)
    failed.push(f)
  })

  return {
    absolute: [
      getDataObject(`all`, all, 'a'),
      getDataObject(`passed`, passed, 'b'),
      getDataObject(`failed`, failed, 'c'),
    ],
    relative: [
      // eslint-disable-next-line no-unused-vars
      getDataObject(`passed`, passed.map(absoluteToRelative(all)), 'b'),
      getDataObject(`failed`, failed.map(absoluteToRelative(all)), 'c'),
    ],
  }
}

const getPassRateStudSeriesFromStats = stats => {
  const all = []
  const passedFirst = []
  const passedEventually = []
  const neverPassed = []

  stats.forEach(year => {
    const { passedFirst: pf, passedEventually: pe, neverPassed: np } = year.students.categories

    all.push((pf || 0) + (pe || 0) + (np || 0))
    passedFirst.push(pf || 0)
    passedEventually.push(pe || 0)
    neverPassed.push(np || 0)
  })

  return {
    absolute: [
      getDataObject(`all`, all, 'a'),
      getDataObject(` passed on first try`, passedFirst, 'b'),
      getDataObject(`passed eventually`, passedEventually, 'b'),
      getDataObject(`never passed`, neverPassed, 'c'),
    ],
    relative: [
      // eslint-disable-next-line no-unused-vars
      getDataObject(` passed on first try`, passedFirst.map(absoluteToRelative(all)), 'b'),
      getDataObject(`passed eventually`, passedEventually.map(absoluteToRelative(all)), 'b'),
      getDataObject(`never passed`, neverPassed.map(absoluteToRelative(all)), 'c'),
    ],
  }
}

const PassRate = ({ primary, comparison, viewMode, isRelative = false, userHasAccessToAllStats }) => {
  const isAttemptsMode = viewMode === viewModeNames.ATTEMPTS

  const primaryStats = primary.stats.filter(stat => stat.name !== 'Total')
  const statYears = primaryStats.map(year => year.name)
  const comparisonStats = comparison ? comparison.stats : []
  const passGraphSerieFn = isAttemptsMode ? getPassRateAttemptSeriesFromStats : getPassRateStudSeriesFromStats

  const passGraphSerie = passGraphSerieFn(primaryStats)
  const comparisonGraphSerie = passGraphSerieFn(comparisonStats)

  const maxPassRateVal = isRelative ? 1 : getMaxValueOfSeries(passGraphSerie.absolute)
  const graphOptionsFn = isAttemptsMode ? passRateAttemptGraphOptions : passRateStudGraphOptions
  const primaryGraphOptions = comparison
    ? graphOptionsFn(statYears, maxPassRateVal, 'Primary pass rate chart', isRelative)
    : graphOptionsFn(statYears, maxPassRateVal, 'Pass rate chart', isRelative)
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
      {comparison && (
        <Grid.Row>
          <Grid.Column>
            <StackedBarChart
              options={comparisonGraphOptions}
              series={isRelative ? comparisonGraphSerie.relative : comparisonGraphSerie.absolute}
            />
          </Grid.Column>
        </Grid.Row>
      )}
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are shown as 0 in the chart</span>
      )}
    </>
  )
}

PassRate.propTypes = {
  primary: dataSeriesType.isRequired,
  comparison: dataSeriesType,
  viewMode: viewModeType.isRequired,
  isRelative: bool,
  userHasAccessToAllStats: bool.isRequired,
}

PassRate.defaultProps = {
  comparison: undefined,
  isRelative: false,
}

export default PassRate
