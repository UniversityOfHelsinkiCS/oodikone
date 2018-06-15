import React from 'react'
import PropTypes from 'prop-types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Header, Button } from 'semantic-ui-react'

import CourseStatisticsTable from '../CourseStatisticsTable'
import sharedStyles from '../../styles/shared'
import styles from './coursePassRateChart.css'

import { chartblue, chartdarkg, chartlgreen, chartdarkred, chartlred } from '../../styles/variables/colors'

const { array, shape, string, func, arrayOf } = PropTypes


const StackedBarChart = ({ stats, altCodes, removeCourseStatistics }) => {
  const data = stats.stats.map(year => (
    {
      name: year.time,
      studentsThatPassedThisYear: year.studentsThatPassedThisYear,
      studentsThatFailedThisYear: year.studentsThatFailedThisYear,
      passedStudentsThatFailedBefore: year.passedStudentsThatFailedBefore,
      passedStudentsOnFirstTry: year.passedStudentsOnFirstTry,
      failedStudentsThatFailedBefore: year.failedStudentsThatFailedBefore,
      failedStudentsOnFirstTry: year.failedStudentsOnFirstTry,
      all: year.studentsThatPassedThisYear + year.studentsThatFailedThisYear
    }))
  const { name, code, start, end, separate } = stats
  const query = { code, start, end, separate }
  const alternativeCodeText = altCodes.length > 0 ? `Combined code(s): [${altCodes}]` : ''
  if (data.length > 0) {
    return (
      <div>
        <Header className={sharedStyles.segmentTitle} size="large">{name}, {code}
          <Header.Subheader>{alternativeCodeText}</Header.Subheader>
        </Header>
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
            <Bar dataKey="all" stackId="a" fill={chartblue} name="all" />
            <Bar dataKey="passedStudentsOnFirstTry" stackId="b" fill={chartdarkg} name="students that passed on their first try" />
            <Bar dataKey="passedStudentsThatFailedBefore" stackId="b" fill={chartlgreen} name="students that passed re-examination" />
            <Bar dataKey="failedStudentsOnFirstTry" stackId="c" fill={chartdarkred} name="students that failed on their first try" />
            <Bar dataKey="failedStudentsThatFailedBefore" stackId="c" fill={chartlred} name="students that failed their re-examination" />


          </BarChart>
          <CourseStatisticsTable stats={stats.stats} />
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
