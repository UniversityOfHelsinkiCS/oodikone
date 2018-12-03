import React, { Component, Fragment } from 'react'
import { Tab, Grid, Radio, Form } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf, func, bool } from 'prop-types'

import StackedBarChart from '../../StackedBarChart'
import { passRateCumGraphOptions, passRateStudGraphOptions, gradeGraphOptions } from '../../../constants'
import CumulativeTable from './CumulativeTable'
import StudentTable from './StudentTable'


const graphSeriesTypes = {
  PRIMARY: { name: 'primary', multiplier: 1 },
  COMPARISON: { name: 'comparison', multiplier: -1 }
}

const getDataObject = (name, data, stack) => ({ name, data, stack })

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

const getMaxValueOfSeries = series => Object.values(series).reduce((acc, cur) => {
  const curMax = Math.max(...cur.data.map(Math.abs))
  return curMax >= acc ? curMax : acc
}, 0)

class ResultTabs extends Component {
  state = {}

  getTablePane = () => {
    const { primary, comparison, cumMode } = this.props

    const getTables = ({ name, stats }) => (
      <Grid.Column>
        {cumMode
            ? <CumulativeTable name={name} stats={stats} />
            : <StudentTable name={name} stats={stats} />
          }
      </Grid.Column>
    )

    return (
      <Fragment>
        {primary && getTables(primary)}
        {comparison && getTables(comparison)}
      </Fragment>
    )
  }

  getPassRatePane = () => {
    const { primary, comparison, cumMode } = this.props

    const primaryStats = primary.stats
    const statYears = primaryStats.map(year => year.name)
    const comparisonStats = comparison ? comparison.stats : []
    const passGraphSerieFn = cumMode ? getPassRateCumSeriesFromStats : getPassRateStudSeriesFromStats

    const passGraphSerie = [
      ...passGraphSerieFn(primaryStats, graphSeriesTypes.PRIMARY),
      ...passGraphSerieFn(comparisonStats, graphSeriesTypes.COMPARISON)
    ]

    const maxPassRateVal = getMaxValueOfSeries(passGraphSerie)
    const graphOptionsFn = cumMode ? passRateCumGraphOptions : passRateStudGraphOptions
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

  getDistributionPane = () => {
    const { primary, comparison, cumMode } = this.props

    const primaryStats = primary.stats
    const statYears = primaryStats.map(year => year.name)
    const comparisonStats = comparison ? comparison.stats : []

    const gradeGraphSerieFn = cumMode ? getGradeCumSeriesFromStats : getGradeStudSeriesFromStats


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

  getPanes = () => {
    const paneMenuItems = [
      { menuItem: { key: 'Table', icon: 'table', content: 'Table' },
        renderFn: this.getTablePane },
      { menuItem: { key: 'pass', icon: 'balance', content: 'Pass rate chart' },
        renderFn: this.getPassRatePane },
      { menuItem: { key: 'grade', icon: 'chart bar', content: 'Grade distribution chart' },
        renderFn: this.getDistributionPane }
    ]

    return paneMenuItems.map((p) => {
      const { menuItem, renderFn } = p
      return {
        menuItem,
        render: () => (
          <Grid padded="vertically" columns="equal">
            <Grid.Row>
              {renderFn()}
            </Grid.Row>
          </Grid>
        )
      }
    })
  }


  render() {
    const { changeMode } = this.props
    const panes = this.getPanes()

    return (
      <div>
        <Form>
          <Form.Group inline >
            <Form.Field>
              <label>Cumulative</label>
            </Form.Field>
            <Form.Field>
              <Radio
                toggle
                onChange={changeMode}
              />
            </Form.Field>
            <Form.Field>
              <label>Student</label>
            </Form.Field>
          </Form.Group>
        </Form>
        <Tab
          panes={panes}
        />
      </div>)
  }
}

ResultTabs.propTypes = {
  primary: shape({
    name: string,
    code: oneOfType([string, number]),
    stats: arrayOf(shape({}))
  }).isRequired,
  comparison: shape({
    name: string,
    code: oneOfType([string, number]),
    stats: arrayOf(shape({}))
  }),
  changeMode: func.isRequired,
  cumMode: bool.isRequired
}

ResultTabs.defaultProps = {
  comparison: undefined
}

export default ResultTabs
