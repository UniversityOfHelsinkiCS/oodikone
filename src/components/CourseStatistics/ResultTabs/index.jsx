import React, { Component } from 'react'
import { Tab, Grid, Radio, Form } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf, func, bool } from 'prop-types'

import StackedBarChart from '../../StackedBarChart'
import { passRateCumGraphOptions, passRateStudGraphOptions, gradeGraphOptions } from '../../../constants'
import CumulativeTable from './CumulativeTable'
import StudentTable from './StudentTable'

const getDataObject = (name, data, stack) => ({ name, data, stack })

const getPassRateCumSeriesFromStats = (stats, multiplier = 1, name = '') => {
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

const getPassRateStudSeriesFromStats = (stats, multiplier = 1, name = '') => {
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

const getGradeSeries = (series, multiplier, name) => {
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
    acc[0].push(failed)
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

const getGradeCumSeriesFromStats = (stats, multiplier = 1, name = '') => {
  const series = stats.flatMap(s => s.cumulative.grades)
  return getGradeSeries(series, multiplier, name)
}

const getGradeStudSeriesFromStats = (stats, multiplier = 1, name = '') => {
  const series = stats.flatMap(s => s.students.grades)
  return getGradeSeries(series, multiplier, name)
}

const getMaxValueOfSeries = series => Object.values(series).reduce((acc, cur) => {
  const curMax = Math.max(...cur.data.map(Math.abs))
  return curMax >= acc ? curMax : acc
}, 0)

class ResultTabs extends Component {
  state = {}

  render() {
    const { primary, comparison, changeMode, cumMode } = this.props

    const primaryName = 'primary'
    const comparisonName = 'comparison'
    const primaryMultiplier = 1
    const comparisonMultiplier = -1
    const primaryStats = primary.stats
    const comparisonStats = comparison ? comparison.stats : []
    const passGraphSerieFn = cumMode ? getPassRateCumSeriesFromStats : getPassRateStudSeriesFromStats
    const graphOptionsFn = cumMode ? passRateCumGraphOptions : passRateStudGraphOptions
    const gradeGraphSerieFn = cumMode ? getGradeCumSeriesFromStats : getGradeStudSeriesFromStats

    const passGraphSerie = [
      ...passGraphSerieFn(primaryStats, primaryMultiplier, primaryName),
      ...passGraphSerieFn(comparisonStats, comparisonMultiplier, comparisonName)
    ]

    const maxPassRateVal = getMaxValueOfSeries(passGraphSerie)

    const graphOptions = graphOptionsFn(primaryStats.map(year => year.name), maxPassRateVal)

    const gradeGraphSerie = [
      ...gradeGraphSerieFn(primaryStats, primaryMultiplier, primaryName),
      ...gradeGraphSerieFn(comparisonStats, comparisonMultiplier, comparisonName)
    ]
    const maxGradeValue = getMaxValueOfSeries(gradeGraphSerie)

    const panes = [
      {
        menuItem: { key: 'Table', icon: 'table', content: 'Table' },
        render: () => (
          <Grid padded="vertically" columns="equal">
            <Grid.Row>
              {primary && (
                <Grid.Column>
                  {cumMode
                    ? <CumulativeTable name={primary.name} stats={primary.stats} />
                    : <StudentTable name={primary.name} stats={primary.stats} />
                  }
                </Grid.Column>
              )}
              {
                comparison && (
                  <Grid.Column>
                    {cumMode
                      ? <CumulativeTable name={comparison.name} stats={comparison.stats} />
                      : <StudentTable name={comparison.name} stats={comparison.stats} />
                    }
                  </Grid.Column>
                )
              }
            </Grid.Row>
          </Grid>
        )
      },
      {
        menuItem: { key: 'pass', icon: 'balance', content: 'Pass rate chart' },
        render: () => (
          <Grid padded="vertically" columns="equal">
            <Grid.Row>
              {primary && (
                <Grid.Column>
                  <StackedBarChart
                    options={graphOptions}
                    series={passGraphSerie}
                  />
                </Grid.Column>
              )}
            </Grid.Row>
          </Grid>
        )
      },
      {
        menuItem: { key: 'grade', icon: 'chart bar', content: 'Grade distribution chart' },
        render: () => (
          <Grid padded="vertically" columns="equal">
            <Grid.Row>
              {primary && (
                <Grid.Column>
                  <StackedBarChart
                    options={gradeGraphOptions(primary.stats.map(year => year.name), maxGradeValue)}
                    series={gradeGraphSerie}
                  />
                </Grid.Column>
              )}
            </Grid.Row>
          </Grid>
        )
      }
    ]

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
