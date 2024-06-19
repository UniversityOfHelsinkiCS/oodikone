import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import _ from 'lodash'
import { useMemo, useState } from 'react'
import ReactHighcharts from 'react-highcharts/ReactHighstock'
import { Input, Menu, Message, Tab } from 'semantic-ui-react'

import { getStudyRightElementTargetDates } from '@/common'
import { reformatDate } from '@/common/timeAndDate'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const getEarliestAttainmentDate = ({ courses }) => {
  if (!courses || !courses.length) return null
  // Courses are already sorted by date in the backend
  return courses[0].date
}

const getCoursesIncludedInStudyPlan = (student, selectedStudyRight) => {
  const studyPlan = student.studyplans.find(plan => plan.studyrightid === selectedStudyRight.studyrightid)
  if (!studyPlan) return []

  return student.courses.filter(({ course_code: courseCode }) => studyPlan.included_courses.includes(courseCode))
}

const resolveGraphStartDate = (student, graphYearStart, selectedStudyRight, studyRightTargetStart) => {
  const earliestAttainmentDate = getEarliestAttainmentDate(student)
  if (!selectedStudyRight)
    return Math.min(new Date(earliestAttainmentDate).getTime(), new Date(graphYearStart || new Date()).getTime())
  const filteredCourses = getCoursesIncludedInStudyPlan(student, selectedStudyRight)

  return Math.min(
    ..._.flattenDeep(filteredCourses.map(({ date }) => new Date(date).getTime())),
    new Date(studyRightTargetStart).getTime()
  )
}

const resolveGraphEndDate = (dates, selectedStudyRight, student, studyRightTargetEnd) => {
  if (!selectedStudyRight) return Math.max(...(dates || []), new Date().getTime())
  const filteredCourses = getCoursesIncludedInStudyPlan(student, selectedStudyRight)

  return Math.max(
    new Date(studyRightTargetEnd).getTime(),
    ..._.flattenDeep(filteredCourses.map(({ date }) => new Date(date).getTime()))
  )
}

const CreditsGraph = ({ graphYearStart, student, absences, studyRightId }) => {
  const selectedStudyRight = student.studyrights.find(({ studyrightid }) => studyrightid === studyRightId)
  const dates = _.flattenDeep(student.courses.map(({ date }) => new Date(date).getTime()))
  const [studyRightTargetStart, studyRightTargetEnd] = getStudyRightElementTargetDates(selectedStudyRight, absences)
  const selectedStart = new Date(
    resolveGraphStartDate(student, graphYearStart, selectedStudyRight, studyRightTargetStart)
  )
  const endDate = resolveGraphEndDate(dates, selectedStudyRight, student, studyRightTargetEnd)
  return (
    <CreditAccumulationGraphHighCharts
      absences={absences}
      endDate={endDate}
      singleStudent
      startDate={selectedStart}
      students={[student]}
      studyRightId={studyRightId}
    />
  )
}

const semesterChunkify = (courses, semesterenrollments, semesters, getTextIn) => {
  const semesterChunks = semesterenrollments
    .toSorted((a, b) => a.semestercode - b.semestercode)
    .reduce((acc, curr) => {
      const currSemester = semesters.semesters[curr.semestercode]
      const filteredcourses = courses.filter(
        course =>
          new Date(currSemester.startdate) <= new Date(course.date) &&
          new Date(course.date) < new Date(currSemester.enddate)
      )
      const grades = { data: filteredcourses, semester: currSemester.name }
      acc.push(grades)
      return acc
    }, [])

  const semesterMeans = semesterChunks.reduce((acc, curr) => {
    const gradeSum = curr.data.reduce((a, b) => a + b.grade * b.credits, 0)
    const creditSum = curr.data.reduce((a, b) => a + b.credits, 0)
    if (curr.data.length > 0)
      acc.push({
        name: getTextIn(curr.semester),
        y: gradeSum / creditSum,
        x: new Date(curr.data[curr.data.length - 1].date).getTime(),
      })
    return acc
  }, [])

  return semesterMeans
}

const gradeMeanSeries = (student, chunksize, semesters, getTextIn) => {
  const filteredCourses = student.courses.filter(
    course => !Number.isNaN(Number(course.grade)) && !course.isStudyModuleCredit && course.passed
  )

  const coursesGroupedByDate = _.groupBy(filteredCourses, 'date')

  const gradesAndMeans = Object.values(coursesGroupedByDate).reduce(
    (acc, courses) => {
      for (const course of courses) {
        acc.grades.push({
          grade: Number(course.grade),
          date: course.date,
          code: course.course_code,
          credits: course.credits,
        })
        // Weighted average: each grade is multiplied by the amount of credits the course is worth
        acc.totalGradeSum += Number(course.grade) * course.credits
        acc.totalCredits += course.credits
      }
      acc.mean.push({ y: acc.totalGradeSum / acc.totalCredits, x: new Date(courses[0].date).getTime() })
      return acc
    },
    { grades: [], mean: [], totalGradeSum: 0, totalCredits: 0 }
  )

  const size = Number(chunksize) ? chunksize : 3
  const chunks = _.chunk(gradesAndMeans.grades, size)

  const groupMeans = chunks.reduce((acc, curr) => {
    const gradeSum = curr.reduce((a, b) => a + b.grade * b.credits, 0)
    const creditSum = curr.reduce((a, b) => a + b.credits, 0)
    if (curr.length > 0)
      acc.push({
        name: `${curr.length} courses between ${reformatDate(curr[0].date, DISPLAY_DATE_FORMAT)} and ${reformatDate(curr[curr.length - 1].date, DISPLAY_DATE_FORMAT)}`,
        y: gradeSum / creditSum,
        x: new Date(curr[curr.length - 1].date).getTime(),
      })
    return acc
  }, [])

  const semesterMeans = semesterChunkify(gradesAndMeans.grades, student.semesterenrollments, semesters, getTextIn)

  return {
    totalMeans: [{ data: gradesAndMeans.mean }],
    groupMeans: [{ data: groupMeans }],
    semesterMeans: [{ data: semesterMeans }],
  }
}

const GradeGraph = ({ semesters, student }) => {
  const { getTextIn } = useLanguage()
  const [groupSize, setGroupSize] = useState(5)
  const [graphMode, setGraphMode] = useState('total')
  const series = useMemo(
    () => gradeMeanSeries(student, groupSize, semesters, getTextIn),
    [student, groupSize, semesters]
  )
  const { totalMeans, groupMeans, semesterMeans } = series

  const defaultOptions = {
    chart: {
      type: 'spline',
    },
    credits: {
      enabled: false,
    },
    title: {
      text: 'Grade plot',
    },
    tooltip: {
      pointFormat: '{point.y:.2f}',
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      min: 1,
      max: 5.1,
      endOnTick: false,
    },
  }

  const totalMeanOptions = { ...defaultOptions, series: totalMeans }
  const groupMeanOptions = { ...defaultOptions, series: groupMeans }
  const semesterMeanOptions = { ...defaultOptions, series: semesterMeans }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Message style={{ maxWidth: '600px' }}>
          <Message.Header>Grade graph</Message.Header>
          Painotettu keskiarvo lasketaan kaikista niistä opintojaksoista, joiden arviointiasteikko on 0–5.{' '}
          <b>Total mean</b> näyttää, kuinka keskiarvo on kehittynyt opintojen aikana. <b>Group mean</b> jakaa kurssit
          valitun kokoisiin ryhmiin ja laskee niiden keskiarvot. <b>Semester mean</b> laskee jokaisen lukukauden
          keskiarvon.
        </Message>
        <Menu compact style={{ marginBottom: '15px' }}>
          <Menu.Item active={graphMode === 'total'} onClick={() => setGraphMode('total')}>
            Show total mean
          </Menu.Item>
          <Menu.Item active={graphMode === 'group'} onClick={() => setGraphMode('group')}>
            Show group mean
          </Menu.Item>
          <Menu.Item active={graphMode === 'semester'} onClick={() => setGraphMode('semester')}>
            Show semester mean
          </Menu.Item>
        </Menu>
        {graphMode === 'group' && (
          <Input
            label="Group size"
            onChange={(_event, { value }) => {
              if (!Number.isNaN(Number(value))) setGroupSize(Number(value))
            }}
            value={groupSize}
          />
        )}
      </div>
      {graphMode === 'total' && <ReactHighcharts config={totalMeanOptions} />}
      {graphMode === 'group' && <ReactHighcharts config={groupMeanOptions} />}
      {graphMode === 'semester' && <ReactHighcharts config={semesterMeanOptions} />}
    </>
  )
}

export const StudentGraphs = ({ absences, graphYearStart, semesters, student, studyRightId }) => {
  const panes = [
    {
      menuItem: 'Credit graph',
      render: () => (
        <Tab.Pane>
          <CreditsGraph
            absences={absences}
            graphYearStart={graphYearStart}
            student={student}
            studyRightId={studyRightId}
          />
        </Tab.Pane>
      ),
    },
    {
      menuItem: 'Grade graph',
      render: () => (
        <Tab.Pane>
          <GradeGraph semesters={semesters} student={student} />
        </Tab.Pane>
      ),
    },
  ]
  return <Tab panes={panes} />
}
