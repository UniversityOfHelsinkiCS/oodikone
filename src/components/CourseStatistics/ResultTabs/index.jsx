import React, { Component } from 'react'
import { Tab, Table, Grid, Header } from 'semantic-ui-react'
import { shape, string, number, oneOfType, arrayOf } from 'prop-types'

import _ from 'lodash'
import StackedBarChart from '../../StackedBarChart'
import { passRateGraphOptions, gradeGraphOptions } from '../../../constants'

const StatsTable = ({ stats, name }) => (
  <div>
    <Header as="h3" content={name} textAlign="center" />
    <Table
      headerRow={['Time', 'Passed', 'Failed']}
      tableData={stats}
      renderBodyRow={stat => ({
        key: stat.code,
        cells: [stat.name, stat.cumulative.categories.passed, stat.cumulative.categories.failed]
      })}
    />
  </div>
)

StatsTable.propTypes = {
  stats: arrayOf(shape({})).isRequired,
  name: oneOfType([number, string]).isRequired
}

const getPassRateSeriesFromStats = (stats, multiplier = 1, name = '') => {
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
const getGradeSeriesFromStats = (stats, multiplier = 1, name = '') => {
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

class ResultTabs extends Component {
  state = {}
  render() {
    const { max, primary, comparison } = this.props
    const { maxPassRateVal, maxGradeVal } = max
    return (
      <Tab
        panes={[
          {
            menuItem: 'Table',
            render: () => (
              <Grid padded="vertically" columns="equal">
                <Grid.Row>
                  {primary && (
                    <Grid.Column>
                      <StatsTable name={primary.name} stats={primary.stats} />
                    </Grid.Column>
                  )}
                  {
                    comparison && (
                      <Grid.Column>
                        <StatsTable name={comparison.name} stats={comparison.stats} />
                      </Grid.Column>
                    )
                  }
                </Grid.Row>
              </Grid>
            )
          },
          {
            menuItem: 'Pass rate chart',
            render: () => (
              <Grid padded="vertically" columns="equal">
                <Grid.Row>
                  {primary && (
                    <Grid.Column>
                      <StackedBarChart
                        options={passRateGraphOptions(primary.stats.map(year =>
                          year.name), maxPassRateVal)}
                        series={getPassRateSeriesFromStats(primary.stats, 1, 'primary').concat(getPassRateSeriesFromStats(comparison ? comparison.stats : [], -1, 'comparison'))}
                      />
                    </Grid.Column>
                  )}
                </Grid.Row>
              </Grid>
            )
          },
          {
            menuItem: 'Grade distribution chart',
            render: () => (
              <Grid padded="vertically" columns="equal">
                <Grid.Row>
                  {primary && (
                    <Grid.Column>
                      <StackedBarChart
                        options={gradeGraphOptions(primary.stats.map(year =>
                          year.name), maxGradeVal)}
                        series={getGradeSeriesFromStats(primary.stats, 1, 'primary').concat(getGradeSeriesFromStats(comparison ? comparison.stats : [], -1, 'comparison'))}
                      />
                    </Grid.Column>
                  )}
                </Grid.Row>
              </Grid>
            )
          }
        ]}
      />)
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
  }).isRequired
}

ResultTabs.defaultProps = {
  comparison: undefined
}

export default ResultTabs

