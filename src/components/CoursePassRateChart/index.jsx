import React from 'react'
import PropTypes from 'prop-types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Header, Button } from 'semantic-ui-react'

import sharedStyles from '../../styles/shared'

const { array, shape, string, func } = PropTypes


const StackedBarChart = ({ stats, removeCourseStatistics }) => {
  const data = stats.stats.map(year => (
    { name: year.time, passed: year.passed, failed: year.failed }))
  const { name, code, start, end, separate } = stats
  const query = { code, start, end, separate }
  return (
    <div className={sharedStyles.container}>
      <Button onClick={removeCourseStatistics(query)}>Remove</Button>
      <Header className={sharedStyles.segmentTitle} size="large">{name}, {code}</Header>
      <BarChart
        width={800}
        height={500}
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="passed" stackId="a" fill="#8884d8" />
        <Bar dataKey="failed" stackId="a" fill="#82ca9d" />
      </BarChart >
    </div>
  )
}

StackedBarChart.propTypes = {
  removeCourseStatistics: func.isRequired,
  stats: shape({
    code: string.isRequired,
    stats: array.isRequired
  }).isRequired
}

export default StackedBarChart
