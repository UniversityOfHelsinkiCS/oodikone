import React from 'react'

import { PropTypes, number } from 'prop-types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts'
import { Header, Button, Container, Segment } from 'semantic-ui-react'
import _ from 'lodash'

import DefaultTooltipContent from 'recharts/lib/component/DefaultTooltipContent'
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
const CustomTooltip = (props) => {
  if (props.payload[0] != null) { //eslint-disable-line
    let compared = []
    let acualPayload = props.payload.reduce((newPayload, value) => { //eslint-disable-line
      const newValue = { ...value, name: value.name.replace('c_', ''), index: newPayload.length, value: value.value < 0 ? -value.value : value.value }
      if (value.dataKey.match(/^c_/)) {
        compared = compared.concat(value.value)
      }
      if (value.name === 'c_1' || value.dataKey === 'c_courseLevelAll' || value.dataKey === 'c_all') {
        return [...newPayload, { ...value, name: 'Compared values', value: '', dataKey: 'asd', index: newPayload.length, color: 'black' }, { ...newValue, index: newPayload.length + 1 }]
      }
      return [...newPayload, newValue]
    }, [])
    if (compared.every(v => v === 0)) {
      acualPayload = acualPayload.slice(0, acualPayload.length - compared.length - 1)
    }
    return <DefaultTooltipContent {...props} payload={acualPayload} itemSorter={(a, b) => (a.index < b.index ? -1 : 1)} /> //eslint-disable-line
  }

  return <DefaultTooltipContent {...props} />
}

const StackedBarChart = ({
  stats,
  altCodes,
  removeCourseStatistics,
  courseLevel,
  courseLevelSwitch,
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
      gradeDistribution: year.gradeDistribution,

      c_studentsThatPassedThisYear: -year.c_studentsThatPassedThisYear.length,
      c_studentsThatFailedThisYear: -year.c_studentsThatFailedThisYear.length,
      c_passedStudentsThatFailedBefore: -year.c_passedStudentsThatFailedBefore.length,
      c_passedStudentsOnFirstTry: -year.c_passedStudentsOnFirstTry.length,
      c_failedStudentsThatFailedBefore: -year.c_failedStudentsThatFailedBefore.length,
      c_failedStudentsOnFirstTry: -year.c_failedStudentsOnFirstTry.length,
      c_all: -year.c_studentsThatPassedThisYear.length + -year.c_studentsThatFailedThisYear.length,
      c_courseLevelPassed: -year.c_courseLevelPassed.length,
      c_courseLevelFailed: -year.c_courseLevelFailed.length,
      c_courseLevelAll: -year.c_courseLevelPassed.length + -year.c_courseLevelFailed.length,
      c_gradeDistribution: year.c_gradeDistribution
    }))

  const { name, code, start, end, separate } = stats
  const query = { code, start, end, separate }
  const absValues = _.flattenDeep(data.map(a => Object.values(_.omit(a, 'name', 'gradeDistribution', 'c_gradeDistribution')).map(b => Math.abs(b))))
  const values = _.flattenDeep(data.map(a => Object.values(_.omit(a, 'name', 'gradeDistribution', 'c_gradeDistribution'))))
  const max = Math.max(...absValues) + 25
  let min = Math.min(...values)
  if (min <= -0.0000001) {
    min = -max
  }

  let statisticsTableStats = data.map(year => ({
    passed: year.studentsThatPassedThisYear,
    failed: year.studentsThatFailedThisYear,
    c_passed: -year.c_studentsThatPassedThisYear,
    c_failed: -year.c_studentsThatFailedThisYear,
    time: year.name
  }))
  if (courseLevel) {
    statisticsTableStats = data.map(year => ({
      passed: year.courseLevelPassed,
      failed: year.courseLevelFailed,
      c_passed: -year.c_courseLevelPassed,
      c_failed: -year.c_courseLevelFailed,
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
                  <Button onClick={courseLevelSwitch()} label="Student view" labelPosition="left" compact />
                </Segment>
                <Segment>
                  <p> Programme: </p>
                  {dropdown(programmeOptions, false)}
                </Segment>
                <Segment>
                  <p> Compare: </p>
                  {dropdown(programmeOptions, true)}
                </Segment>
              </Segment.Group>
              <Header textAlign="center">Pass rate</Header>
              <BarChart
                height={700}
                width={1200}
                data={data}
                stackOffset="sign"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis type="number" domain={[min, max]} ticks={[min, min / 2, 0, max / 2, max]} tickFormatter={val => (val < 0 ? -val : val)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="all" stackId="a" fill={chartblue} name="all" />
                <Bar dataKey="passedStudentsOnFirstTry" stackId="b" fill={chartdarkg} name="students that passed on their first try" />
                <Bar dataKey="passedStudentsThatFailedBefore" stackId="b" fill={chartlgreen} name="students that passed re-examination" />
                <Bar dataKey="failedStudentsOnFirstTry" stackId="c" fill={chartdarkred} name="students that failed on their first try" />
                <Bar dataKey="failedStudentsThatFailedBefore" stackId="c" fill={chartlred} name="students that failed their re-examination" />
                <Bar dataKey="c_all" stackId="a" fill={chartblue} name="all" />
                <Bar dataKey="c_passedStudentsOnFirstTry" stackId="b" fill={chartdarkg} name="students that passed on their first try" />
                <Bar dataKey="c_passedStudentsThatFailedBefore" stackId="b" fill={chartlgreen} name="students that passed re-examination" />
                <Bar dataKey="c_failedStudentsOnFirstTry" stackId="c" fill={chartdarkred} name="students that failed on their first try" />
                <Bar dataKey="c_failedStudentsThatFailedBefore" stackId="c" fill={chartlred} name="students that failed their re-examination" />
                <ReferenceLine y={0} stroke="#000" />
              </BarChart>
            </Container>
            :
            <Container>
              <Segment.Group
                horizontal
              >
                <Segment>
                  <Button onClick={courseLevelSwitch()} label="Course view" labelPosition="left" compact />
                </Segment>
                <Segment>
                  <p> Programme: </p>
                  {dropdown(programmeOptions, false)}
                </Segment>
                <Segment>
                  <p> Compare: </p>
                  {dropdown(programmeOptions, true)}
                </Segment>
              </Segment.Group>
              <Header textAlign="center">Pass rate</Header>
              <BarChart
                height={700}
                width={1200}
                data={data}
                stackOffset="sign"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis type="number" ticks={[min, min / 2, 0, max / 2, max]} tickFormatter={val => (val < 0 ? -val : val)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="courseLevelAll" stackId="a" fill={turquoise} name="all" />
                <Bar dataKey="courseLevelPassed" stackId="b" fill={green} name="passed" />
                <Bar dataKey="courseLevelFailed" stackId="c" fill={red} name="failed" />
                <Bar dataKey="c_courseLevelAll" stackId="a" fill={turquoise} name="all" />
                <Bar dataKey="c_courseLevelPassed" stackId="b" fill={green} name="passed" />
                <Bar dataKey="c_courseLevelFailed" stackId="c" fill={red} name="failed" />
                <ReferenceLine y={0} stroke="#000" />

              </BarChart>
            </Container>
          }
          <Header textAlign="center">Grade distribution</Header>
          <Container>
            <BarChart
              height={700}
              width={1200}
              stackOffset="sign"
              data={data.map(c =>
                ({
                  name: c.name,
                  gradeDistribution: c.gradeDistribution,
                  c_gradeDistribution: c.c_gradeDistribution
                })).map(a => ({
                  name: a.name,
                  ..._.mapValues(a.gradeDistribution, b => b.length),
                  ...Object.entries(a.c_gradeDistribution)
                    .reduce((distribution, [gradeName, students]) =>
                      ({
                        ...distribution,
                        [`c_${gradeName}`]: -students.length
                      }), {})
                }))}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis type="number" domain={[min, max]} ticks={[min, min / 2, 0, max / 2, max]} tickFormatter={val => (val < 0 ? -val : val)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="1" stackId="a" fill="grey" label={<CustomizedLabel label="1" />} />
              <Bar dataKey="2" stackId="b" fill="grey" label={<CustomizedLabel label="2" />} />
              <Bar dataKey="3" stackId="c" fill="grey" label={<CustomizedLabel label="3" />} />
              <Bar dataKey="4" stackId="d" fill="grey" label={<CustomizedLabel label="4" />} />
              <Bar dataKey="5" stackId="e" fill="grey" label={<CustomizedLabel label="5" />} />
              <Bar dataKey="0" stackId="f" fill={red} name="failed" />
              <Bar dataKey="Eisa" stackId="f" fill={red} name="Eisa" />
              <Bar dataKey="Hyl." stackId="f" fill={red} name="Hyl." />
              <Bar dataKey="Luop" stackId="f" fill={red} name="Luop" label={<CustomizedLabel label="f" />} />
              <Bar dataKey="c_1" stackId="a" fill="grey" />
              <Bar dataKey="c_2" stackId="b" fill="grey" />
              <Bar dataKey="c_3" stackId="c" fill="grey" />
              <Bar dataKey="c_4" stackId="d" fill="grey" />
              <Bar dataKey="c_5" stackId="e" fill="grey" />
              <Bar dataKey="c_0" stackId="f" fill={red} name="failed" />
              <Bar dataKey="c_Eisa" stackId="f" fill={red} name="Eisa" />
              <Bar dataKey="c_Hyl." stackId="f" fill={red} name="Hyl." />
              <Bar dataKey="c_Luop" stackId="f" fill={red} name="Luop" />
              <ReferenceLine y={0} stroke="#000" />
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
  dropdown: func.isRequired,
  programmeOptions: arrayOf(object).isRequired


}

export default StackedBarChart
