import React, { Component } from 'react'
import { Grid, Table, Header } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import MulticolorBarChart from '../MulticolorBarChart'

const { shape, object, string } = PropTypes

const createChartData = data => (data !== undefined ?
  (Object.keys(data).map(key => ({ text: key, value: data[key] }))) : [])

const sortByValue = (a, b) => (a.value - b.value)

const tableRow = (title, values) => (
  <Table.Row>
    <Table.Cell>{title}</Table.Cell>
    {values.map(val => <Table.Cell>{val}</Table.Cell>)}
  </Table.Row>)

const calculateAve = (data) => {
  let sum = 0
  data.forEach((item) => { sum += item.value })
  return sum / data.length
}

const calculateStd = (ave, data) => {
  let variation = 0
  data.forEach((item) => { variation += (ave - item.value) ** 2 })
  variation /= data.length
  return Math.sqrt(variation)
}

class CourseStatistics extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const { stats, courseName, instanceDate } = this.props
    if (stats !== undefined) {
      const dataAll = createChartData(stats.all).sort(sortByValue)
      const dataPassed = createChartData(stats.pass).sort(sortByValue)
      const dataFailed = createChartData(stats.fail).sort(sortByValue)
      const allN = dataAll.length
      const passN = dataPassed.length
      const failN = dataFailed.length
      const mins = [dataAll[0].value,
        dataPassed[0].value,
        dataFailed[0].value]
      const maxs = [dataAll[dataAll.length - 1].value,
        dataPassed[dataPassed.length - 1].value,
        dataFailed[dataFailed.length - 1].value]
      const medians = [dataAll[Math.floor(dataAll.length / 2)].value,
        dataPassed[Math.floor(dataPassed.length / 2)].value,
        dataFailed[Math.floor(dataFailed.length / 2)].value]
      const aves = [calculateAve(dataAll),
        calculateAve(dataPassed),
        calculateAve(dataFailed)]
      const stds = [calculateStd(aves[0], dataAll),
        calculateStd(aves[1], dataPassed),
        calculateStd(aves[2], dataFailed)]
      return (
        <Grid columns="equal">
          <Grid.Row>
            <Header textAlign="center">{courseName} ({instanceDate})</Header>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell />
                    <Table.HeaderCell>
                      All (n={allN})
                    </Table.HeaderCell>
                    <Table.HeaderCell>
                      Passed (n={passN}, {((passN / allN) * 100).toFixed(1)}%)
                    </Table.HeaderCell>
                    <Table.HeaderCell>
                      Failed (n={failN}, {((failN / allN) * 100).toFixed(1)}%)
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {tableRow('minimum', mins)}
                  {tableRow('maximum', maxs)}
                  {tableRow('average', aves)}
                  {tableRow('median', medians)}
                  {tableRow('standard deviations', stds)}
                </Table.Body>
              </Table>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column key="1">
              <MulticolorBarChart chartTitle="All" chartData={dataAll} />
            </Grid.Column>
            <Grid.Column key="2">
              <MulticolorBarChart chartTitle="Passed" chartData={dataPassed} />
            </Grid.Column>
            <Grid.Column key="3">
              <MulticolorBarChart chartTitle="Failed" chartData={dataFailed} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      )
    }
    return (
      <div>
        <pre>{JSON.stringify(courseName)}</pre>
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      </div>
    )
  }
}

CourseStatistics.propTypes = {
  stats: shape({
    all: object.isRequired,
    pass: object.isRequired,
    fail: object.isRequired,
    startYear: object.isRequired
  }).isRequired,
  courseName: string.isRequired,
  instanceDate: string.isRequired
}

export default CourseStatistics
