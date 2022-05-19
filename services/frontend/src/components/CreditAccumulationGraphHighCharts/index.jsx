import React, { useState, useRef, useMemo } from 'react'
import { renderToString } from 'react-dom/server'
import moment from 'moment'
import { useHistory } from 'react-router-dom'
import Highcharts from 'highcharts/highstock'
import { Button } from 'semantic-ui-react'
import boostcanvas from 'highcharts/modules/boost-canvas'
import _ from 'lodash/fp'
import boost from 'highcharts/modules/boost'
import ReactHighstock from 'react-highcharts/ReactHighstock'
import './creditAccumulationGraphHC.css'
import CreditGraphTooltip from '../CreditGraphTooltip'
import { reformatDate, getTextIn, getStudyRightElementTargetDates } from '../../common'
import useLanguage from '../LanguagePicker/useLanguage'
import { DISPLAY_DATE_FORMAT, API_DATE_FORMAT } from '../../constants'

// boost canvas needed because tests break with large population
// https://www.highcharts.com/errors/26/
boostcanvas(Highcharts)
boost(Highcharts)

const SINGLE_GRAPH_GOAL_SERIES_NAME = 'Goal'

const createGraphOptions = ({
  singleStudent,
  seriesData,
  graphHeight,
  tooltipFormatter,
  onPointClicked,
  startDate,
  endDate,
  graduations,
}) => {
  const tooltip = {
    shared: false,
    split: false,
  }

  if (singleStudent) {
    Object.assign(tooltip, {
      formatter() {
        return tooltipFormatter(this)
      },
      useHTML: true,
      style: {
        all: 'unset',
        display: 'none',
      },
    })
  }

  return {
    plotOptions: {
      series: {
        findNearestPointBy: 'xy',
        point: {
          events: {
            click() {
              onPointClicked(this)
            },
            mouseOver() {
              if (this.series.halo) {
                this.series.halo
                  .attr({
                    class: 'highcharts-tracker',
                  })
                  .toFront()
              }
            },
            hover: {
              halo: {
                size: 9,
                attributes: {
                  fill: Highcharts.getOptions().colors[2],
                  'stroke-width': 2,
                  stroke: Highcharts.getOptions().colors[1],
                },
              },
            },
          },
          cursor: 'pointer',
        },
      },
    },
    yAxis: {
      title: { text: 'Credits' },
      min: 0,
      max: undefined,
    },
    xAxis: {
      ordinal: false,
      min: startDate,
      max: endDate,
      plotLines: graduations.map(({ value }) => ({
        value,
        color: '#a333c8',
        width: 2,
        dashStyle: 'dash',
        label: {
          text: `Graduation`,
        },
      })),
    },
    series: seriesData,
    chart: {
      height: graphHeight,
    },
    tooltip,
  }
}

const sortCoursesByDate = courses =>
  [...courses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

const filterCoursesByStudyPlan = (plan, courses) =>
  // eslint-disable-next-line camelcase
  !plan ? courses : courses.filter(({ course_code }) => plan.included_courses.includes(course_code))

const filterCoursesByDate = (courses, date) => courses.filter(c => moment(c.date).isSameOrAfter(moment(date)))

const getXAxisMonth = (date, startDate) =>
  Math.max(moment(date, API_DATE_FORMAT).diff(moment(startDate, API_DATE_FORMAT), 'days') / 30, 0)

const singleStudentTooltipFormatter = (point, student, language) => {
  if (point.series.name === SINGLE_GRAPH_GOAL_SERIES_NAME) {
    return null
  }

  const targetCourse = sortCoursesByDate(student.courses).find(
    ({ course_code: courseCode, date }) => point.key === courseCode && point.x === new Date(date).getTime()
  )

  if (!targetCourse.course) {
    return null
  }

  const payload = [
    {
      name: student.studentNumber,
      payload: {
        ...targetCourse,
        date: reformatDate(targetCourse.date, DISPLAY_DATE_FORMAT),
        title: getTextIn(targetCourse.course.name, language),
      },
    },
  ]

  return renderToString(<CreditGraphTooltip payload={payload} />)
}

const createGoalSeries = (starting, ending, absences) => {
  const lastMonth = Math.ceil(getXAxisMonth(moment(ending), moment(starting)))

  let totalAbsenceMonths = 0
  const absencePoints = absences
    .filter(a => a.startdate >= starting || (a.startdate <= starting && a.enddate >= starting))
    .reduce((res, { startdate, enddate }) => {
      const targetCreditsBeforeAbsence =
        (Math.ceil(getXAxisMonth(moment(startdate), moment(starting))) - totalAbsenceMonths) * (60 / 12)
      if (enddate < ending) {
        res.push([startdate, targetCreditsBeforeAbsence])
        res.push([enddate, targetCreditsBeforeAbsence])
        totalAbsenceMonths += moment(enddate).diff(moment(startdate), 'months')
      }
      return res
    }, [])

  const zoneStart = absencePoints.length ? [absencePoints[0][0]] : []
  const zones = absencePoints.reduce(
    (acc, [start], i) => [...acc, { value: start, color: i % 2 === 0 ? '#96d7c3' : 'red' }],
    zoneStart
  )

  const lastCredits = (lastMonth - totalAbsenceMonths) * (60 / 12)
  const data = [...[[starting, 0], ...absencePoints, [ending, lastCredits]].sort((a, b) => a[0] - b[0])]

  return {
    name: SINGLE_GRAPH_GOAL_SERIES_NAME,
    data,
    seriesThreshold: 150,
    color: '#96d7c3',
    marker: {
      enabled: false,
    },
    zones,
    zoneAxis: 'x',
  }
}

// eslint-disable-next-line camelcase
const resolveStudyRightElement = ({ studyright_elements }) => {
  // eslint-disable-next-line camelcase
  if (!studyright_elements || !studyright_elements.length) return {}
  return (
    studyright_elements
      .filter(e => e.element_detail.type === 20)
      .sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0] || {}
  )
}

const createStudentCreditLines = (students, singleStudent, selectedStartDate, studyRightId) =>
  students.map(student => {
    const { studyrightStart } = student

    const startDate = singleStudent ? selectedStartDate : studyrightStart
    const { code } = resolveStudyRightElement(
      student.studyrights.find(({ studyrightid }) => studyrightid === studyRightId) || {}
    )

    const { points } = _.flow(
      sortCoursesByDate,
      courses =>
        filterCoursesByStudyPlan(
          student.studyplans.find(p => p.programme_code === code),
          courses
        ),
      courses => filterCoursesByDate(courses, startDate),
      _.reduce(
        ({ credits, points }, course) => {
          const gainedCredits = course.passed && !course.isStudyModuleCredit ? course.credits : 0

          const point = {
            x: new Date(course.date).getTime(),
            y: credits + gainedCredits,
          }

          if (singleStudent) {
            Object.assign(point, {
              name: course.course_code,
            })
          }

          return {
            points: [...points, point],
            credits: credits + gainedCredits,
          }
        },
        { credits: 0, points: [] }
      )
    )(student.courses)

    return {
      name: student.studentNumber,
      data: points,
      seriesThreshold: 150,
      marker: {
        enabled: !!singleStudent,
        radius: 4,
      },
    }
  })

const filterGraduations = (student, selectedStudyRight) => {
  const graduated = student.studyrights.filter(({ graduated }) => graduated)
  // eslint-disable-next-line camelcase
  if (!selectedStudyRight)
    return graduated.map(({ enddate }) => ({
      value: new Date(enddate).getTime(),
    }))
  const selectedGraduation = graduated.find(({ id }) => id === selectedStudyRight.id)
  if (!selectedGraduation) return []
  return [{ value: new Date(selectedGraduation.enddate).getTime() }]
}

const CreditAccumulationGraphHighCharts = ({ students, singleStudent, absences, startDate, endDate, studyRightId }) => {
  const history = useHistory()
  const chartRef = useRef()
  const language = useLanguage()
  const [graphHeight, setGraphHeight] = useState(600)
  const selectedStudyRight =
    singleStudent && studyRightId
      ? students[0].studyrights.find(({ studyrightid }) => studyrightid === studyRightId)
      : null

  const seriesData = useMemo(
    () => createStudentCreditLines(students, singleStudent, startDate, studyRightId),
    [students, singleStudent, startDate, studyRightId]
  )

  if (singleStudent) {
    const filteredAbsences = selectedStudyRight
      ? absences.filter(({ startdate }) => startdate >= new Date(selectedStudyRight.startdate).getTime())
      : absences
    const startDate = selectedStudyRight
      ? selectedStudyRight.studyright_elements
          // eslint-disable-next-line camelcase
          .filter(({ element_detail }) => element_detail.type === 20)
          .sort((a, b) => new Date(a.startdate) - new Date(b.startdate))[0].startdate
      : _.chain(students[0].studyrights || students[0].courses)
          .map(elem => new Date(elem.startdate || elem.date))
          .sortBy()
          .head()
          .defaultTo(new Date())
          .value()
          .getTime()
    const [, studyRightTargetEnd] = getStudyRightElementTargetDates(selectedStudyRight, absences)
    const ending = selectedStudyRight
      ? new Date(studyRightTargetEnd).getTime()
      : new Date(endDate || new Date()).getTime()
    const starting = new Date(startDate).getTime()

    seriesData.push(createGoalSeries(starting, ending, filteredAbsences))
  }

  const graduations = singleStudent ? filterGraduations(students[0], selectedStudyRight) : []

  const options = createGraphOptions({
    singleStudent,
    seriesData,
    graphHeight,
    startDate: startDate ? new Date(startDate).getTime() : undefined,
    endDate,
    tooltipFormatter: point => singleStudent && singleStudentTooltipFormatter(point, students[0], language),
    onPointClicked: point => {
      if (!singleStudent) {
        history.push(`/students/${point.series.name}`)
      }
    },
    graduations,
  })

  const makeGraphSizeButton = (height, label) => (
    <Button active={graphHeight === height} onClick={() => setGraphHeight(height)} content={label} />
  )

  return (
    <div className="graphContainer">
      <div className="graphOptions">
        {makeGraphSizeButton(400, 'Small')}
        {makeGraphSizeButton(600, 'Medium')}
        {makeGraphSizeButton(1000, 'Large')}
      </div>

      <ReactHighstock highcharts={Highcharts} ref={chartRef} constructorType="stockChart" config={options} />
    </div>
  )
}

export default CreditAccumulationGraphHighCharts
