/* eslint-disable camelcase */
import React, { useState, useRef, useMemo } from 'react'
import { renderToString } from 'react-dom/server'
import moment from 'moment'
import { useHistory } from 'react-router-dom'
import Highcharts from 'highcharts/highstock'
import { Button, Radio } from 'semantic-ui-react'
import boostcanvas from 'highcharts/modules/boost-canvas'
import _ from 'lodash'
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
  transfers,
  studyRightStartLine,
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
      plotLines: graduations
        .map(graduation => ({
          value: graduation.value,
          color: '#a333c8',
          width: 2,
          dashStyle: 'dash',
          label: {
            text: `Graduation ${graduation.studyright}`,
            fontSize: 30,
          },
        }))
        .concat(
          studyRightStartLine.map(start => ({
            value: start.value,
            color: 'red',
            width: 3,
            dashStyle: 'dash',
            label: {
              text: `Population study start ${start.studyright}`,
              fontSize: 30,
            },
          }))
        )
        .concat(
          transfers.map(transfer => ({
            value: transfer.value,
            color: '#cbd128',
            width: 2,
            dashStyle: 'dash',
            label: {
              text: `Transfer ${transfer.studyright}`,
              fontSize: 30,
            },
          }))
        ),
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

const filterCourses = (
  student,
  singleStudent,
  byStudyPlanOfCode,
  cutStudyPlanCredits,
  startDate,
  customStudyStartYear,
  studyrightid
) => {
  if (byStudyPlanOfCode && cutStudyPlanCredits)
    return filterCoursesByDate(
      filterCoursesByStudyPlan(
        student.studyplans.find(p => p.programme_code === byStudyPlanOfCode && p.studyrightid === studyrightid),
        student.courses
      ),
      customStudyStartYear || student.studyrightStart
    )
  if (byStudyPlanOfCode)
    return filterCoursesByStudyPlan(
      student.studyplans.find(p => p.programme_code === byStudyPlanOfCode && p.studyrightid === studyrightid),
      student.courses
    )
  if (singleStudent) return student.courses
  return filterCoursesByDate(student.courses, startDate)
}

const reduceCreditsToPoints = ({ credits, points, singleStudent }, course) => {
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
    singleStudent,
  }
}

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

  const getColor = (i, type, statutoryAbsence) => {
    if (i % 2 === 0) return '#96d7c3'
    if (statutoryAbsence) return '#8e24aa'
    if (type === 2) return '#ffb300'
    if (type === -1) return '#e0e0e0'
    return '#e53935'
  }

  let totalAbsenceMonths = 0
  let previousTargetCreditsBeforeAbsence = 0
  const absencePoints = absences
    .filter(a => a.startdate >= starting || (a.startdate <= starting && a.enddate >= starting))
    .reduce((res, { startdate, enddate, enrollmenttype, statutoryAbsence }) => {
      const targetCreditsBeforeAbsence =
        (Math.abs(moment(startdate).diff(moment(starting), 'months')) - totalAbsenceMonths) * (60 / 12)
      const newCredits =
        targetCreditsBeforeAbsence - previousTargetCreditsBeforeAbsence > 5 // Snap to previous credits when absent type changes
          ? targetCreditsBeforeAbsence
          : previousTargetCreditsBeforeAbsence
      previousTargetCreditsBeforeAbsence = newCredits
      res.push([startdate, newCredits, enrollmenttype, statutoryAbsence])
      res.push([enddate, newCredits, enrollmenttype, statutoryAbsence])
      totalAbsenceMonths += Math.abs(moment(enddate).diff(moment(startdate), 'months'))
      return res
    }, [])

  const zoneStart = absencePoints.length ? [absencePoints[0][0]] : []
  const zones = absencePoints.reduce((acc, [start, , enrollmenttype, statutoryAbsence], i) => {
    return [...acc, { value: start, color: getColor(i, enrollmenttype, statutoryAbsence) }]
  }, zoneStart)

  const lastCredits = (lastMonth - totalAbsenceMonths) * (60 / 12)
  const endingCredits = absences.some(a => moment(ending).isBetween(moment(a.startdate), moment(a.enddate)))
    ? absencePoints[absencePoints.length - 1][1]
    : lastCredits
  const data = [...[[starting, 0], ...absencePoints, [ending, endingCredits]].sort((a, b) => a[0] - b[0])].filter(
    r => r[0] <= ending
  )
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

const resolveStudyRightElement = ({ studyright_elements }) => {
  if (!studyright_elements || !studyright_elements.length) return {}
  return (
    studyright_elements
      .filter(e => e.element_detail.type === 20)
      .sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0] || {}
  )
}

const createStudentCreditLines = (
  students,
  singleStudent,
  selectedStartDate,
  studyRightId,
  studyPlanFilterIsActive,
  cutStudyPlanCredits,
  programmeCode,
  customStudyStartYear
) =>
  students.map(student => {
    const { studyrightStart } = student

    const startDate = singleStudent ? selectedStartDate : studyrightStart
    const { code } = resolveStudyRightElement(
      student.studyrights.find(({ studyrightid }) => studyrightid === studyRightId) || {}
    )
    const studyPlanProgrammeCode = singleStudent ? code : studyPlanFilterIsActive && programmeCode

    const { points } = _.flow(
      () =>
        filterCourses(
          student,
          singleStudent,
          studyPlanProgrammeCode,
          cutStudyPlanCredits,
          startDate,
          customStudyStartYear,
          studyRightId
        ),
      courses => [...courses].filter(({ date }) => new Date(date) <= new Date()),
      sortCoursesByDate,
      courses => courses.reduce(reduceCreditsToPoints, { credits: 0, points: [], singleStudent })
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
    return graduated.map(({ enddate, studyright_elements }) => {
      const studyrightElem = studyright_elements
        ? studyright_elements.filter(ele => ele.element_detail?.type === 20)
        : []
      let elemName = ''
      if (studyrightElem.length > 0) {
        elemName = getTextIn(studyrightElem[0].element_detail?.name)
      }
      return {
        value: new Date(enddate).getTime(),
        studyright: elemName,
      }
    })
  const selectedGraduation = graduated.find(({ studyrightid }) => studyrightid === selectedStudyRight.studyrightid)
  if (!selectedGraduation) return []
  const element = selectedGraduation.studyright_elements
    ? selectedGraduation.studyright_elements.filter(ele => ele.element_detail?.type === 20)
    : []
  return [
    {
      value: new Date(selectedGraduation.enddate).getTime(),
      studyright: element.lenght > 0 ? getTextIn(element[0].element_detail?.name) : '',
    },
  ]
}

const filterTransfers = student => {
  const transferTimes = student.transfers.map(transfer => ({
    value: new Date(transfer.transferdate).getTime(),
    studyright: `From ${transfer.sourcecode} to ${transfer.targetcode}`,
  }))
  const removeOverlapping = transferTimes.filter((transfer, i, a) => a.indexOf(transfer) === i)
  return removeOverlapping
}

const CreditAccumulationGraphHighCharts = ({
  students,
  singleStudent,
  absences,
  startDate,
  endDate,
  studyRightId,
  programmeCode,
  customPopulation = false,
  studyPlanFilterIsActive,
  customStudyStartYear,
}) => {
  const history = useHistory()
  const chartRef = useRef()
  const language = useLanguage()

  const [graphHeight, setGraphHeight] = useState(700)
  const [cutStudyPlanCredits, setCutStudyPlanCredits] = useState(false)
  const selectedStudyRight =
    singleStudent && studyRightId
      ? students[0].studyrights.find(({ studyrightid }) => studyrightid === studyRightId)
      : null

  const seriesData = useMemo(
    () =>
      createStudentCreditLines(
        students,
        singleStudent,
        startDate,
        studyRightId,
        studyPlanFilterIsActive,
        cutStudyPlanCredits,
        programmeCode,
        customStudyStartYear
      ),
    [
      students,
      singleStudent,
      startDate,
      studyRightId,
      studyPlanFilterIsActive,
      programmeCode,
      cutStudyPlanCredits,
      customStudyStartYear,
      language,
    ]
  )

  if (singleStudent) {
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
    const filteredAbsences = selectedStudyRight
      ? absences.filter(({ startdate, enddate }) => startdate >= starting && enddate <= ending)
      : absences

    seriesData.push(createGoalSeries(starting, ending, filteredAbsences))
  }
  const getStudyRightStart = () => {
    if (customStudyStartYear) return new Date(customStudyStartYear).getTime()
    const studyRightStartFromStudent = new Date(students[0]?.studyrightStart ?? new Date(null))
    if (studyRightStartFromStudent.getFullYear() < 2000)
      return Math.min(..._.flatten(students.map(({ courses }) => courses.map(({ date }) => new Date(date).getTime()))))
    return studyRightStartFromStudent.getTime()
  }

  const getGraphStart = () => {
    if (startDate) return new Date(startDate).getTime()
    if (customPopulation)
      return Math.min(
        ..._.flatten(
          students.map(({ courses }) => {
            return courses.map(({ date }) => new Date(date).getTime())
          })
        )
      )
    const studyRightStart = getStudyRightStart()
    if (studyPlanFilterIsActive && cutStudyPlanCredits) return studyRightStart
    if (studyPlanFilterIsActive)
      return Math.min(..._.flatten(students.map(({ courses }) => courses.map(({ date }) => new Date(date).getTime()))))
    return studyRightStart
  }

  const graduations = singleStudent ? filterGraduations(students[0], selectedStudyRight) : []
  const transfers = singleStudent ? filterTransfers(students[0]) : []
  const studyRightStartLine =
    !singleStudent && studyPlanFilterIsActive
      ? [{ value: new Date(customStudyStartYear || students[0].studyrightStart).getTime(), studyright: '' }]
      : []

  const options = createGraphOptions({
    singleStudent,
    seriesData,
    graphHeight,
    startDate: getGraphStart(),
    endDate,
    tooltipFormatter: point => singleStudent && singleStudentTooltipFormatter(point, students[0], language),
    onPointClicked: point => {
      if (!singleStudent) {
        history.push(`/students/${point.series.name}`)
      }
    },
    graduations,
    transfers,
    studyRightStartLine,
  })

  const makeGraphSizeButton = (height, label) => (
    <Button active={graphHeight === height} onClick={() => setGraphHeight(height)} content={label} />
  )

  return (
    <div className="graphContainer">
      <div className="graph-options">
        <div>
          {!singleStudent && studyPlanFilterIsActive ? (
            <Radio
              checked={cutStudyPlanCredits}
              onChange={() => setCutStudyPlanCredits(!cutStudyPlanCredits)}
              label="Display credits from study right start"
              toggle
            />
          ) : null}
        </div>

        <div>
          {makeGraphSizeButton(400, 'Small')}
          {makeGraphSizeButton(600, 'Medium')}
          {makeGraphSizeButton(1000, 'Large')}
        </div>
      </div>

      <ReactHighstock highcharts={Highcharts} ref={chartRef} constructorType="stockChart" config={options} />
    </div>
  )
}

export default CreditAccumulationGraphHighCharts
