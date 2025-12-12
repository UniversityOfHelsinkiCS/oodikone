// @ts-check
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import dayjs from 'dayjs'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import { chain, flatten } from 'lodash'
import { useRef, useState } from 'react'
import { renderToString } from 'react-dom/server'
import ReactHighstock from 'react-highcharts/ReactHighstock'

import { getStudyRightElementTargetDates } from '@/common'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import { useDeepMemo } from '@/hooks/deepMemo'
import { reformatDate } from '@/util/timeAndDate'
import { CreditGraphTooltip } from './CreditGraphTooltip'

exporting(ReactHighstock.Highcharts)
exportData(ReactHighstock.Highcharts)

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
          studyRightStartLine.map(value => ({
            value,
            color: 'red',
            width: 3,
            dashStyle: 'dash',
            label: {
              text: 'Population study start',
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
    rangeSelector: {
      selected: 5, // Set default zoom to 'All'
    },
    series: seriesData,
    chart: {
      height: graphHeight,
    },
    tooltip,
    accessibility: {
      // Accessibility module doesn't seem to work with Highstock, at least for large amounts of data
      enabled: false,
    },
  }
}

const filterCoursesByStudyPlan = (plan, courses) => {
  if (!plan) {
    return courses
  }
  return courses.filter(({ course, course_code }) => {
    if (!course?.code && !course_code) {
      return false
    }
    return plan.included_courses.includes(course_code ?? course.code)
  })
}

const filterCoursesByDate = (courses, date) => courses.filter(course => dayjs(course.date).isSameOrAfter(dayjs(date)))

const filterCourses = (student, singleStudent, byStudyPlanOfCode, cutStudyPlanCredits, startDate, studyrightid) => {
  if (byStudyPlanOfCode && cutStudyPlanCredits)
    return filterCoursesByDate(
      filterCoursesByStudyPlan(
        student.studyplans.find(
          plan => plan.programme_code === byStudyPlanOfCode && plan.sis_study_right_id === studyrightid
        ),
        student.courses
      ),
      student.studyrightStart
    )
  if (byStudyPlanOfCode)
    return filterCoursesByStudyPlan(
      student.studyplans.find(
        plan => plan.programme_code === byStudyPlanOfCode && plan.sis_study_right_id === studyrightid
      ),
      student.courses
    )
  if (singleStudent) return student.courses
  return filterCoursesByDate(student.courses, startDate)
}

const singleStudentTooltipFormatter = (point, student, getTextIn) => {
  const targetCourse = student.courses.find(
    ({ course, date }) => point.key === course.code && point.x === new Date(date).getTime()
  )

  if (!targetCourse.course) return null

  const payload = {
    ...targetCourse,
    courseCode: targetCourse.course.code,
    courseName: getTextIn(targetCourse.course.name),
    date: reformatDate(targetCourse.date, DateFormat.DISPLAY_DATE),
  }

  return renderToString(<CreditGraphTooltip {...payload} />)
}

const createGoalSeries = (graphStartDate, graphEndDate, absences) => {
  const getColor = type => {
    if (type === 2) return '#ffb300'
    if (type === 3) return '#e53935'
    return '#96d7c3'
  }

  const absenceIsBetweenGraphDates = (startDate, endDate) =>
    (graphStartDate <= startDate && startDate <= graphEndDate) || (graphStartDate <= endDate && endDate <= graphEndDate)

  let totalAbsenceYears = 0
  const absencePoints = absences
    .filter(a =>
      a.enrollmenttype === 3
        ? absenceIsBetweenGraphDates(a.startDate, a.endDate) && a.startDate <= new Date()
        : absenceIsBetweenGraphDates(a.startDate, a.endDate)
    )
    .reduce((res, { startDate, endDate, enrollmenttype, statutoryAbsence }) => {
      const targetCreditsBeforeAbsence =
        (dayjs(startDate).diff(dayjs(graphStartDate), 'years', true) - totalAbsenceYears) * 60

      const absenceInYears = dayjs(endDate).diff(dayjs(startDate), 'years', true)
      totalAbsenceYears += absenceInYears

      res.push([startDate.getTime(), targetCreditsBeforeAbsence, null, null])
      res.push([endDate.getTime(), targetCreditsBeforeAbsence, enrollmenttype, statutoryAbsence])
      return res
    }, [])

  const zones = []
  for (const [start, , enrollmenttype, statutoryAbsence] of absencePoints) {
    zones.push({
      value: start,
      color: getColor(enrollmenttype),
      dashStyle: statutoryAbsence ? 'Dash' : 'Solid',
    })
  }
  zones.push({ color: '#96d7c3' })

  const yearsFromStart = dayjs(graphEndDate).diff(dayjs(graphStartDate), 'years', true)
  const endingCredits = (yearsFromStart - totalAbsenceYears) * 60
  const data = [[graphStartDate, 0], ...absencePoints, [graphEndDate, endingCredits]].sort((a, b) => a[0] - b[0])

  return {
    name: SINGLE_GRAPH_GOAL_SERIES_NAME,
    data,
    enableMouseTracking: false,
    zones,
    zoneAxis: 'x',
  }
}

const filterGraduations = (student, selectedStudyRight, getTextIn) => {
  const graduations = student.studyRights
    .flatMap(studyRight => studyRight.studyRightElements)
    .filter(element => element.graduated)
  if (!selectedStudyRight)
    return graduations.map(({ endDate, name }) => ({
      value: new Date(endDate).getTime(),
      studyright: getTextIn(name),
    }))
  const selectedGraduation = graduations.filter(({ studyRightId }) => studyRightId === selectedStudyRight.id)
  if (selectedGraduation.length === 0) return []
  return selectedGraduation.map(({ endDate, name }) => ({
    value: new Date(endDate).getTime(),
    studyright: getTextIn(name),
  }))
}

const addGraduation = (points, graduationDate, notFirst) => {
  const index = points.findIndex(point => point.x > graduationDate)
  let graduationY
  if (index <= 0) {
    graduationY = graduationDate > points[0].x ? points[points.length - 1].y : points[0].y
  } else {
    const yBefore = points[index - 1].y
    const yAfter = points[index].y
    graduationY = Math.round((yBefore + yAfter) / 2)
  }

  const marker = {
    radius: 10,
    symbol: 'diamond',
    enabled: true,
  }

  const masterMarker = {
    radius: 12,
    symbol: 'circle',
    lineWidth: 2,
    lineColor: '#ffffff',
    enabled: true,
  }

  points.push({
    x: graduationDate,
    y: graduationY,
    marker: notFirst ? masterMarker : marker,
  })
  points.sort((a, b) => a.x - b.x)
}

const findGraduationsByCodes = (student, programmeCodes, showBachelorAndMaster) => {
  if (showBachelorAndMaster) {
    return (
      student.studyRights
        .find(studyRight => studyRight.studyRightElements.some(element => programmeCodes.includes(element.code)))
        ?.studyRightElements.filter(({ graduated }) => graduated === true) ?? []
    )
      .map(({ endDate }) => new Date(endDate).getTime())
      .sort((a, b) => a - b)
  }

  return student.studyRights
    .flatMap(studyRight => studyRight.studyRightElements)
    .filter(({ graduated, code }) => graduated === true && programmeCodes.includes(code))
    .map(({ endDate }) => new Date(endDate).getTime())
    .sort((a, b) => a - b)
}

const createStudentCreditLines = (
  students,
  singleStudent,
  studyRightId,
  studyPlanFilterIsActive,
  cutStudyPlanCredits,
  programmeCodes,
  selectedStudyPlan,
  showBachelorAndMaster
) =>
  students.map(student => {
    const { studyrightStart } = student
    const code = selectedStudyPlan?.programme_code
    const studyPlanProgrammeCode = singleStudent
      ? code
      : studyPlanFilterIsActive && programmeCodes?.length > 0 && programmeCodes[0]

    const { points } = filterCourses(
      student,
      singleStudent,
      studyPlanProgrammeCode,
      cutStudyPlanCredits,
      studyrightStart,
      studyRightId
    )
      .filter(({ date }) => new Date(date) <= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .reduce(
        (acc, course) => {
          // Only include passed and transferred courses
          if (![4, 9].includes(course.credittypecode)) return acc

          const gainedCredits = !course.isStudyModuleCredit ? course.credits : 0

          const point = {
            x: new Date(course.date).getTime(),
            y: acc.credits + gainedCredits,
          }

          if (singleStudent) point.name = course.course.code

          acc.points.push(point)

          return {
            ...acc,
            credits: acc.credits + gainedCredits,
          }
        },
        { credits: 0, points: [] }
      )

    const graduationDates = programmeCodes ? findGraduationsByCodes(student, programmeCodes, showBachelorAndMaster) : []

    if (points?.length > 0) {
      if (!singleStudent && points[0].y !== 0 && students.length < 100) {
        const xMinusTwoMonths = dayjs(new Date(points[0].x)).subtract(2, 'months').toDate().getTime()
        points.unshift({
          x: studyPlanFilterIsActive ? xMinusTwoMonths : Math.max(new Date(studyrightStart).getTime(), xMinusTwoMonths),
          y: 0,
        })
      }
      graduationDates.forEach((graduationDate, index) => addGraduation(points, graduationDate, index > 0))
    }

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

const filterTransfers = (student, getTextIn) =>
  student.studyRights.reduce((transfers, studyRight) => {
    const phase1Programmes = studyRight.studyRightElements.filter(element => element.phase === 1)
    const phase2Programmes = studyRight.studyRightElements.filter(element => element.phase === 2)
    for (const programmes of [phase1Programmes, phase2Programmes]) {
      // The oldest study right element is ignored, as there can be no transfer to it
      for (const element of programmes.toSpliced(-1)) {
        transfers.push({
          value: new Date(element.startDate),
          studyright: `to ${getTextIn(element.name)}`,
        })
      }
    }
    return transfers
  }, [])

export const CreditAccumulationGraphHighCharts = ({
  students,
  singleStudent,
  absences,
  startDate,
  endDate,
  studyRightId,
  programmeCodes,
  customPopulation = false,
  studyPlanFilterIsActive,
  selectedStudyPlan,
  showBachelorAndMaster,
  infoBoxContent = '',
}) => {
  const chartRef = useRef()
  const { getTextIn } = useLanguage()
  const [graphHeight, setGraphHeight] = useState(700)
  const [cutStudyPlanCredits, setCutStudyPlanCredits] = useState(false)
  const selectedStudyRight =
    singleStudent && studyRightId ? students[0].studyRights.find(({ id }) => id === studyRightId) : null

  const seriesData = useDeepMemo(
    () =>
      createStudentCreditLines(
        students,
        singleStudent,
        studyRightId,
        studyPlanFilterIsActive,
        cutStudyPlanCredits,
        programmeCodes,
        selectedStudyPlan,
        showBachelorAndMaster
      ),
    [
      students,
      singleStudent,
      studyRightId,
      studyPlanFilterIsActive,
      cutStudyPlanCredits,
      programmeCodes,
      selectedStudyPlan,
      showBachelorAndMaster,
    ]
  )

  if (singleStudent) {
    const studyPlanProgrammeCode = selectedStudyPlan ? selectedStudyPlan.programme_code : null
    const correctStudyRightElement = selectedStudyRight?.studyRightElements.find(
      element => element.code === studyPlanProgrammeCode
    )
    const startDate = selectedStudyRight
      ? selectedStudyRight.studyRightElements
          .filter(element => element.phase === correctStudyRightElement.phase)
          .sort(({ startDate: a }, { startDate: b }) => new Date(a).getTime() - new Date(b).getTime())
          .at(0)?.startDate
      : chain(students[0].studyRights ?? students[0].courses)
          .map(element => new Date(element.startDate ?? element.date))
          .sortBy()
          .head()
          .defaultTo(new Date())
          .value()
          .getTime()
    const [, studyRightTargetEnd] = getStudyRightElementTargetDates(
      selectedStudyRight?.studyRightElements
        .filter(element => element.phase === correctStudyRightElement.phase)
        .sort(({ startDate: a }, { startDate: b }) => new Date(a).getTime() - new Date(b).getTime())
        .at(0),
      absences
    )
    const ending = selectedStudyRight ? new Date(studyRightTargetEnd) : new Date(endDate ?? new Date())
    const starting = new Date(startDate)
    const filteredAbsences = selectedStudyRight
      ? absences.filter(({ startDate, endDate }) => startDate >= starting && endDate <= ending)
      : absences

    seriesData.push(createGoalSeries(starting.getTime(), ending.getTime(), filteredAbsences))
  }
  const getStudyRightStart = () => {
    const studyRightStartFromStudent = new Date(students[0]?.studyrightStart ?? new Date())
    if (studyRightStartFromStudent.getFullYear() < 2000)
      return Math.min(...flatten(students.map(({ courses }) => courses.map(({ date }) => new Date(date).getTime()))))
    return studyRightStartFromStudent.getTime()
  }

  const getGraphStart = () => {
    if (startDate) return new Date(startDate).getTime()
    if (customPopulation)
      return Math.min(
        ...flatten(
          students.map(({ courses }) => {
            return courses.map(({ date }) => new Date(date).getTime())
          })
        )
      )
    const studyRightStart = getStudyRightStart()
    if (studyPlanFilterIsActive && cutStudyPlanCredits) return studyRightStart
    if (studyPlanFilterIsActive) {
      // math.min may return a infinite value, if beginning of course credits is selected and student's courses are filtered accordingly.
      const startPoint = Math.min(
        ...flatten(students.map(({ courses }) => courses.map(({ date }) => new Date(date).getTime())))
      )
      return startPoint !== Infinity ? startPoint : studyRightStart
    }
    return studyRightStart
  }

  const graduations = singleStudent ? filterGraduations(students[0], selectedStudyRight, getTextIn) : []
  const transfers = singleStudent ? filterTransfers(students[0], getTextIn) : []
  const studyRightStartLine =
    !singleStudent && studyPlanFilterIsActive && students[0]?.studyrightStart
      ? [new Date(students[0].studyrightStart).getTime()]
      : []

  const options = createGraphOptions({
    singleStudent,
    seriesData,
    graphHeight,
    startDate: getGraphStart(),
    endDate,
    tooltipFormatter: point => singleStudent && singleStudentTooltipFormatter(point, students[0], getTextIn),
    onPointClicked: point => {
      if (!singleStudent) {
        if (point.series.name.length > 10) return
        window.open(`/students/${point.series.name}`, '_blank')
      }
    },
    graduations,
    transfers,
    studyRightStartLine,
  })

  const makeGraphSizeButton = (height, label) => (
    <Button
      color="primary"
      onClick={() => setGraphHeight(height)}
      variant={graphHeight === height ? 'contained' : 'outlined'}
    >
      {label}
    </Button>
  )

  return (
    <div style={{ minWidth: '400px', marginBottom: '15px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexDirection: 'row-reverse',
          alignItems: 'center',
          margin: '1rem 0',
        }}
      >
        {!!infoBoxContent && <InfoBox content={infoBoxContent} />}
        <div>
          {!singleStudent && studyPlanFilterIsActive ? (
            <FormControlLabel
              control={<Switch />}
              label="Display credits from study right start"
              onClick={() => setCutStudyPlanCredits(!cutStudyPlanCredits)}
            />
          ) : null}
        </div>

        <div>
          {makeGraphSizeButton(400, 'Small')}
          {makeGraphSizeButton(700, 'Medium')}
          {makeGraphSizeButton(1000, 'Large')}
        </div>
      </div>

      <ReactHighstock config={options} ref={chartRef} />
    </div>
  )
}
