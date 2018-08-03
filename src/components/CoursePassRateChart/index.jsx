import React from 'react'

import { PropTypes, number } from 'prop-types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Header, Button, Container, Segment } from 'semantic-ui-react'
import _ from 'lodash'

import CourseStatisticsTable from '../CourseStatisticsTable'
import sharedStyles from '../../styles/shared'
import styles from './coursePassRateChart.css'

import { chartblue, chartdarkg, chartlgreen, chartdarkred, chartlred, turquoise, red, green } from '../../styles/variables/colors'

const { string, func, arrayOf, bool, object } = PropTypes

const CustomizedLabel = (props) => {
  CustomizedLabel.propTypes = {
    x: number.isRequired,
    y: number.isRequired,
    label: string.isRequired,
    width: number.isRequired

  }
  const { x, y, label, width } = props

  return (
    <text
      x={x}
      y={y}
      dy={-5}
      dx={width / 2}
      fontSize={width / 1.3}
      fontFamily="sans-serif"
      textAnchor="middle"
    >
      {label}
    </text>
  )
}

const StackedBarChart = ({
  stats,
  altCodes,
  removeCourseStatistics,
  courseLevel,
  courseLevelSwitch,
  max,
  programmeOptions,
  dropdown
}) => {
  const data = stats.stats.map(year => (
    {
      name: year.time,
      studentsThatPassedThisYear: year.studentsThatPassedThisYear.length,
      studentsThatFailedThisYear: year.studentsThatFailedThisYear.length,
      passedStudentsThatFailedBefore: year.passedStudentsThatFailedBefore.length,
      passedStudentsOnFirstTry: year.passedStudentsOnFirstTry.length,
      failedStudentsThatFailedBefore: year.failedStudentsThatFailedBefore.length,
      failedStudentsOnFirstTry: year.failedStudentsOnFirstTry.length,
      all: year.studentsThatPassedThisYear.length + year.studentsThatFailedThisYear.length,
      courseLevelPassed: year.courseLevelPassed.length,
      courseLevelFailed: year.courseLevelFailed.length,
      courseLevelAll: year.courseLevelPassed.length + year.courseLevelFailed.length,
      gradeDistribution: year.gradeDistribution
    }))
  const { name, code, start, end, separate } = stats
  const query = { code, start, end, separate }
  let statisticsTableStats = data.map(year => ({
    passed: year.studentsThatPassedThisYear,
    failed: year.studentsThatFailedThisYear,
    time: year.name
  }))
  if (courseLevel) {
    statisticsTableStats = data.map(year => ({
      passed: year.courseLevelPassed,
      failed: year.courseLevelFailed,
      time: year.name
    }))
  }
  const alternativeCodeText = altCodes.length > 0 ? `Combined code(s): [${altCodes}]` : ''
  if (data.length > 0) {
    return (
      <div>
        <Header className={sharedStyles.segmentTitle} size="large">{name}, {code}
          <Header.Subheader>{alternativeCodeText}</Header.Subheader>
        </Header>
        <div className={styles.chartContainer}>
          {!courseLevel ?
            <Container>
              <Segment.Group
                horizontal
              >
                <Segment>
                  <Button onClick={courseLevelSwitch()} label="switch to course level view" labelPosition="left" compact />
                </Segment>
                <Segment>
                  <label> Programme: </label>
                  {dropdown(programmeOptions)}
                </Segment>
              </Segment.Group>
              <BarChart
                height={700}
                width={1200}
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis type="number" domain={[0, max]} />
                <Tooltip />
                <Bar dataKey="all" stackId="a" fill={chartblue} name="all" />
                <Bar dataKey="passedStudentsOnFirstTry" stackId="b" fill={chartdarkg} name="students that passed on their first try" />
                <Bar dataKey="passedStudentsThatFailedBefore" stackId="b" fill={chartlgreen} name="students that passed re-examination" />
                <Bar dataKey="failedStudentsOnFirstTry" stackId="c" fill={chartdarkred} name="students that failed on their first try" />
                <Bar dataKey="failedStudentsThatFailedBefore" stackId="c" fill={chartlred} name="students that failed their re-examination" />
                <Legend layout="horizontal" horizontalAlign="left" align="left" wrapperStyle={{ left: 100 }} />
              </BarChart>
            </Container>
            :
            <Container>
              <Segment.Group
                horizontal
              >
                <Segment>
                  <Button onClick={courseLevelSwitch()} label="switch to student level view" labelPosition="left" compact />
                </Segment>
                <Segment>
                  <label> Programme: </label>
                  {dropdown(programmeOptions)}
                </Segment>
              </Segment.Group>
              <BarChart
                height={700}
                width={1200}
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis type="number" domain={[0, max]} />
                <Tooltip />
                <Bar dataKey="courseLevelAll" stackId="a" fill={turquoise} name="all" />
                <Bar dataKey="courseLevelPassed" stackId="b" fill={green} name="passed" />
                <Bar dataKey="courseLevelFailed" stackId="c" fill={red} name="failed" />
                <Legend layout="horizontal" horizontalAlign="left" align="left" wrapperStyle={{ left: 100 }} />

              </BarChart>
            </Container>
          }

          <Container>
            <BarChart
              height={700}
              width={1200}
              data={data.map(c =>
                ({ name: c.name, gradeDistribution: c.gradeDistribution })).map(a =>
                  ({ name: a.name, ..._.mapValues(a.gradeDistribution, b => b.length) }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis type="number" domain={[0, max]} />
              <Tooltip />
              <Bar dataKey="1" stackId="a" fill="grey" label={<CustomizedLabel label="1" />} />
              <Bar dataKey="2" stackId="b" fill="grey" label={<CustomizedLabel label="2" />} />
              <Bar dataKey="3" stackId="c" fill="grey" label={<CustomizedLabel label="3" />} />
              <Bar dataKey="4" stackId="d" fill="grey" label={<CustomizedLabel label="4" />} />
              <Bar dataKey="5" stackId="e" fill="grey" label={<CustomizedLabel label="5" />} />
              <Bar dataKey="0" stackId="f" fill={red} name="failed" />
              <Bar dataKey="Eisa" stackId="f" fill={red} name="Eisa" />
              <Bar dataKey="Hyl." stackId="f" fill={red} name="Hyl." />
              <Bar dataKey="Luop" stackId="f" fill={red} name="Luop" label={<CustomizedLabel label="f" />} />
            </BarChart>
          </Container>
          <CourseStatisticsTable stats={statisticsTableStats} />
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
  courseLevelSwitch: func.isRequired,
  altCodes: arrayOf(string).isRequired,
  stats: arrayOf(object).isRequired,
  courseLevel: bool.isRequired,
  max: number.isRequired,
  dropdown: func.isRequired,
  programmeOptions: arrayOf(object).isRequired


}

export default StackedBarChart
