import React, { Component } from 'react'
import { Tab, Table, Grid, Header, Radio, Form } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf, func, bool } from 'prop-types'

import _ from 'lodash'
import StackedBarChart from '../../StackedBarChart'
import { passRateCumGraphOptions, passRateStudGraphOptions, gradeGraphOptions } from '../../../constants'

const StatsCumTable = ({ stats, name }) => (
  <div>
    <Header as="h3" content={name} textAlign="center" />
    <Table
      headerRow={['Time', 'Passed', 'Failed']}
      tableData={stats}
      renderBodyRow={stat => ({
        key: stat.code,
        cells: [
          stat.name,
          stat.cumulative.categories.passed,
          stat.cumulative.categories.failed
        ]
      })}
    />
  </div>
)

StatsCumTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired
}

const StatsStudTable = ({ stats, name }) => (
  <div>
    <Header as="h3" content={name} textAlign="center" />
    <Table
      headerRow={['Time', 'Passed on first try', 'Passed after retry', 'Failed on first try', 'Failed after retry']}
      tableData={stats}
      renderBodyRow={stat => ({
        key: stat.code,
        cells: [
          stat.name,
          stat.students.categories.passedFirst,
          stat.students.categories.passedRetry,
          stat.students.categories.failedFirst,
          stat.students.categories.failedRetry
        ]
      })}
    />
  </div>
)

StatsStudTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired
}

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
  const series = [
    {
      name: `${name} all`,
      data: all,
      stack: 'a'
    },
    {
      name: `${name} passed`,
      data: passed,
      stack: 'b'
    },
    {
      name: `${name} failed`,
      data: failed,
      stack: 'c'
    }
  ]
  return series
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
  const series = [
    {
      name: `${name} all`,
      data: all,
      stack: 'a'
    },
    {
      name: `${name} passed on first try`,
      data: passedFirst,
      stack: 'b'
    },
    {
      name: `${name} passed after retry`,
      data: passedRetry,
      stack: 'b'
    },
    {
      name: `${name} failed on first try`,
      data: failedFirst,
      stack: 'c'
    },
    {
      name: `${name} failed after retry`,
      data: failedRetry,
      stack: 'c'
    }
  ]
  return series
}
const getGradeCumSeriesFromStats = (stats, multiplier = 1, name = '') => {
  const zeros = []
  const grades = {}

  stats.forEach((year) => {
    const fails = []
    Object.entries(year.cumulative.grades).forEach(([key, value]) => {
      if (['Eisa', 'Hyl.', '0', 'Luop'].includes(key)) {
        fails.push(value)
      }
      if (!grades[key]) {
        grades[key] = []
      }
      grades[key].push(value * multiplier)
    })
    zeros.push(_.sum(fails) * multiplier)
  })
  const seriesData = { 0: zeros, ...grades }
  const series = [
    {
      name: `${name} 0`,
      data: seriesData['0'],
      stack: 'a'
    },
    {
      name: `${name} 1`,
      data: seriesData['1'],
      stack: 'b'
    },
    {
      name: `${name} 2`,
      data: seriesData['2'],
      stack: 'c'
    },
    {
      name: `${name} 3`,
      data: seriesData['3'],
      stack: 'd'
    },
    {
      name: `${name} 4`,
      data: seriesData['4'],
      stack: 'e'
    },
    {
      name: `${name} 5`,
      data: seriesData['5'],
      stack: 'f'
    },
    {
      name: `${name} Hyv.`,
      data: seriesData['Hyv.'],
      stack: 'g'
    }
  ]
  return series
}

const getGradeStudSeriesFromStats = (stats, multiplier = 1, name = '') => {
  const zeros = []
  const grades = {}

  stats.forEach((year) => {
    const fails = []
    Object.entries(year.students.grades).forEach(([key, value]) => {
      if (['Eisa', 'Hyl.', '0', 'Luop'].includes(key)) {
        fails.push(value)
      }
      if (!grades[key]) {
        grades[key] = []
      }
      grades[key].push(value * multiplier)
    })
    zeros.push(_.sum(fails) * multiplier)
  })
  const seriesData = { 0: zeros, ...grades }
  const series = [
    {
      name: `${name} 0`,
      data: seriesData['0'],
      stack: 'a'
    },
    {
      name: `${name} 1`,
      data: seriesData['1'],
      stack: 'b'
    },
    {
      name: `${name} 2`,
      data: seriesData['2'],
      stack: 'c'
    },
    {
      name: `${name} 3`,
      data: seriesData['3'],
      stack: 'd'
    },
    {
      name: `${name} 4`,
      data: seriesData['4'],
      stack: 'e'
    },
    {
      name: `${name} 5`,
      data: seriesData['5'],
      stack: 'f'
    },
    {
      name: `${name} Hyv.`,
      data: seriesData['Hyv.'],
      stack: 'g'
    }
  ]
  return series
}

class ResultTabs extends Component {
  state = {}
  render() {
    const { max, primary, comparison, changeMode, cumMode } = this.props
    const { maxPassRateVal, maxGradeVal } = max
    const passGraphSerie = cumMode ?
      getPassRateCumSeriesFromStats(primary.stats, 1, 'primary').concat(getPassRateCumSeriesFromStats(comparison ? comparison.stats : [], -1, 'comparison'))
      :
      getPassRateStudSeriesFromStats(primary.stats, 1, 'primary').concat(getPassRateStudSeriesFromStats(comparison ? comparison.stats : [], -1, 'comparison'))
    const graphOptions = cumMode ?
      passRateCumGraphOptions(primary.stats.map(year =>
        year.name), maxPassRateVal)
      :
      passRateStudGraphOptions(primary.stats.map(year =>
        year.name), maxPassRateVal)

    const gradeGraphSerie = cumMode ?
      getGradeCumSeriesFromStats(primary.stats, 1, 'primary').concat(getGradeCumSeriesFromStats(comparison ? comparison.stats : [], -1, 'comparison'))
      :
      getGradeStudSeriesFromStats(primary.stats, 1, 'primary').concat(getGradeCumSeriesFromStats(comparison ? comparison.stats : [], -1, 'comparison'))

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
          panes={[
            {
              menuItem: { key: 'Table', icon: 'table', content: 'Table' },
              render: () => (
                <Grid padded="vertically" columns="equal">
                  <Grid.Row>
                    {primary && (
                      <Grid.Column>
                        {cumMode ?
                          <StatsCumTable name={primary.name} stats={primary.stats} />
                          :
                          <StatsStudTable name={primary.name} stats={primary.stats} />
                        }
                      </Grid.Column>
                    )}
                    {
                      comparison && (
                        <Grid.Column>
                          {cumMode ?
                            <StatsCumTable name={primary.name} stats={primary.stats} />
                            :
                            <StatsStudTable name={primary.name} stats={primary.stats} />
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
                          options={gradeGraphOptions(primary.stats.map(year =>
                            year.name), maxGradeVal)}
                          series={gradeGraphSerie}
                        />
                      </Grid.Column>
                    )}
                  </Grid.Row>
                </Grid>
              )
            }
          ]}
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
  max: shape({
    maxPassRateVal: number,
    maxGradeVal: number
  }).isRequired,
  changeMode: func.isRequired,
  cumMode: bool.isRequired
}

ResultTabs.defaultProps = {
  comparison: undefined
}

export default ResultTabs

