import React from 'react'
import PropTypes from 'prop-types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Header, Button } from 'semantic-ui-react'

import sharedStyles from '../../styles/shared'
import styles from './coursePassRateChart.css'

import { red, green, turquoise } from '../../styles/variables/colors'

const { array, shape, string, func, arrayOf } = PropTypes


const StackedBarChart = ({ stats, altCodes, removeCourseStatistics }) => {
  const data = stats.stats.map(year => (
    { name: year.time, passed: year.passed, failed: year.failed, all: year.failed + year.passed }))
  const { name, code, start, end, separate } = stats
  const query = { code, start, end, separate }
  const alternativeCodeText = altCodes.length > 0 ? `combined code(s): [${altCodes}]` : ''
  if (data.length > 0) {
    return (
      <div>
        <Header className={sharedStyles.segmentTitle} size="large">{name}, {code}</Header>
        <Header color="grey" sub>{alternativeCodeText}</Header>
        <div className={styles.chartContainer}>
          <BarChart
            height={700}
            width={1200}
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="all" stackId="a" fill={turquoise} />
            <Bar dataKey="passed" stackId="b" fill={green} />
            <Bar dataKey="failed" stackId="c" fill={red} />
          </BarChart>
          <Button className={styles.remove} onClick={removeCourseStatistics(query)}>Remove</Button>
        </div>
      </div>
    )
  }
  return (
    <div className={sharedStyles.container}>
      <Header className={sharedStyles.segmentTitle} size="large">
        No statistics for course {name}, {code} during time {start}-{end}
      </Header>
      <Button onClick={removeCourseStatistics(query)}>Remove</Button>
    </div>
  )
}

StackedBarChart.propTypes = {
  removeCourseStatistics: func.isRequired,
  altCodes: arrayOf(string).isRequired,
  stats: shape({
    code: string.isRequired,
    stats: array.isRequired
  }).isRequired
}

export default StackedBarChart
