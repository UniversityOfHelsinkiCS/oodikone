import React from 'react'
import ReactHighcharts from 'react-highcharts'
import { passRateAttemptGraphOptions, passRateStudGraphOptions } from '../../../../constants'
import { absoluteToRelative, getDataObject, getMaxValueOfSeries } from './util'

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
      getDataObject('all', all, 'a'),
      getDataObject('passed', passed, 'b'),
      getDataObject('failed', failed, 'c'),
    ],
    relative: [
      getDataObject('passed', passed.map(absoluteToRelative(all)), 'b'),
      getDataObject('failed', failed.map(absoluteToRelative(all)), 'c'),
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
      getDataObject('all', all, 'a'),
      getDataObject('passed on first try', passedFirst, 'b'),
      getDataObject('passed eventually', passedEventually, 'b'),
      getDataObject('never passed', neverPassed, 'c'),
    ],
    relative: [
      getDataObject('passed on first try', passedFirst.map(absoluteToRelative(all)), 'b'),
      getDataObject('passed eventually', passedEventually.map(absoluteToRelative(all)), 'b'),
      getDataObject('never passed', neverPassed.map(absoluteToRelative(all)), 'c'),
    ],
  }
}

export const PassRateContent = ({ data, settings: { viewMode, isRelative }, userHasAccessToAllStats }) => {
  const isAttemptsMode = viewMode === 'ATTEMPTS'

  const stats = data.stats.filter(stat => stat.name !== 'Total')
  const statYears = stats.map(year => year.name)
  const passGraphSerieFn = isAttemptsMode ? getPassRateAttemptSeriesFromStats : getPassRateStudSeriesFromStats

  const passGraphSerie = passGraphSerieFn(stats)

  const maxPassRateVal = isRelative ? 100 : getMaxValueOfSeries(passGraphSerie.absolute)
  const graphOptionsFn = isAttemptsMode ? passRateAttemptGraphOptions : passRateStudGraphOptions
  const primaryGraphOptions = graphOptionsFn(isRelative, statYears, maxPassRateVal, 'Pass rate chart', isRelative)

  return (
    <div>
      <ReactHighcharts
        config={{ ...primaryGraphOptions, series: isRelative ? passGraphSerie.relative : passGraphSerie.absolute }}
      />
      {!userHasAccessToAllStats && (
        <span className="totalsDisclaimer">* Years with 5 students or less are shown as 0 in the chart</span>
      )}
    </div>
  )
}
