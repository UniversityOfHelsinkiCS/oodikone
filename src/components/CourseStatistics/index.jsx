import React from 'react'
import { Grid, Table, Header } from 'semantic-ui-react'
import PropTypes from 'prop-types'

import MulticolorBarChart from '../MulticolorBarChart'

const { shape, object, string } = PropTypes

const createChartData = data => (data !== undefined ?
  (Object.keys(data).map(key => ({ text: key, value: data[key] }))) : [])

const sortByValue = (a, b) => (a.value - b.value)
const idFromTwoIds = (a, b) => ((1 / 2) * (a + b) * (a + b + 1)) + b

const tableRow = (title, values) => (
  <Table.Row>
    <Table.Cell>{title}</Table.Cell>
    {values.map((val, index) => (
      <Table.Cell key={`${title}-${idFromTwoIds(val, index)}`}>
        {val}
      </Table.Cell>
    ))}
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

const parseInformationFromData = (data) => {
  const information = {
    n: data.length,
    min: 0,
    max: 0,
    median: 0,
    ave: 0,
    std: 0,
    data: []
  }
  if (information.n > 0) {
    const sortedData = data.sort(sortByValue)
    information.min = sortedData[0].value
    information.max = sortedData[sortedData.length - 1].value
    information.median = sortedData[Math.floor(sortedData.length / 2)].value
    information.ave = calculateAve(sortedData)
    information.std = calculateStd(information.ave, sortedData)
    information.data = sortedData
  }
  return information
}
const CourseStatistics = ({ stats, courseName, instanceDate }) => {
  if (stats !== undefined) {
    const dataAll = parseInformationFromData(createChartData(stats.all))
    const dataPass = parseInformationFromData(createChartData(stats.pass))
    const dataFail = parseInformationFromData(createChartData(stats.fail))
    const mins = [dataAll.min, dataPass.min, dataFail.min]
    const maxs = [dataAll.max, dataPass.max, dataFail.max]
    const aves = [dataAll.ave, dataPass.ave, dataFail.ave]
    const medians = [dataAll.median, dataPass.median, dataFail.median]
    const stds = [dataAll.std, dataPass.std, dataFail.std]
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
                    All (n={dataAll.n})
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    Passed (n={dataPass.n}, {((dataPass.n / dataAll.n) * 100).toFixed(1)}%)
                  </Table.HeaderCell>
                  <Table.HeaderCell>
                    Failed (n={dataFail.n}, {((dataFail.n / dataAll.n) * 100).toFixed(1)}%)
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
            <MulticolorBarChart chartTitle="All" chartData={dataAll.data} />
          </Grid.Column>
          <Grid.Column key="2">
            <MulticolorBarChart chartTitle="Passed" chartData={dataPass.data} />
          </Grid.Column>
          <Grid.Column key="3">
            <MulticolorBarChart chartTitle="Failed" chartData={dataFail.data} />
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
