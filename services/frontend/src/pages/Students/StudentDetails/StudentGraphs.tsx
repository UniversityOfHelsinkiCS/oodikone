import {
  Alert,
  AlertTitle,
  Box,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import accessibility from 'highcharts/modules/accessibility'
import exportData from 'highcharts/modules/export-data'
import exporting from 'highcharts/modules/exporting'
import { chunk, flattenDeep, groupBy } from 'lodash'
import moment from 'moment'
import { useMemo, useState } from 'react'
import ReactHighcharts from 'react-highcharts/ReactHighstock'

import { getStudyRightElementTargetDates } from '@/common'
import { CreditAccumulationGraphHighCharts } from '@/components/CreditAccumulationGraphHighCharts'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { DISPLAY_DATE_FORMAT } from '@/constants/date'
import { SemestersData, useGetSemestersQuery } from '@/redux/semesters'
import { reformatDate } from '@/util/timeAndDate'
import { Absence } from '.'

exporting(ReactHighcharts.Highcharts)
exportData(ReactHighcharts.Highcharts)
accessibility(ReactHighcharts.Highcharts)

const getEarliestAttainmentDate = ({ courses }) => {
  if (!courses?.length) return null
  // Courses are already sorted by date in the backend
  return courses[0].date
}

const getCoursesIncludedInStudyPlan = (student, studyPlan) =>
  student.courses.filter(({ course }) => studyPlan.included_courses.includes(course.code))

const resolveGraphStartDate = (student, graphYearStart, selectedStudyPlan, studyRightTargetStart) => {
  const earliestAttainmentDate = getEarliestAttainmentDate(student)
  if (!selectedStudyPlan)
    return Math.min(new Date(earliestAttainmentDate).getTime(), new Date(graphYearStart || new Date()).getTime())
  const filteredCourses = getCoursesIncludedInStudyPlan(student, selectedStudyPlan)

  return Math.min(
    ...flattenDeep<number>(filteredCourses.map(({ date }) => new Date(date).getTime())),
    new Date(studyRightTargetStart).getTime()
  )
}

const resolveGraphEndDate = (
  dates: number[],
  coursesIncludedInStudyPlan: string[],
  student: any,
  studyRightTargetEnd: Date,
  selectedStudyRightElement: any
) => {
  if (!coursesIncludedInStudyPlan.length) return Math.max(...(dates || []), new Date().getTime())
  const filteredCourses = student.courses.filter(({ course }) => coursesIncludedInStudyPlan.includes(course.code))

  const comparedValues = [
    new Date(studyRightTargetEnd).getTime(),
    ...flattenDeep<number>(filteredCourses.map(({ date }) => new Date(date).getTime())),
  ]
  if (selectedStudyRightElement?.graduated) {
    const graduationDate = new Date(selectedStudyRightElement.endDate)
    // Add 50 days to graduation date to make sure the graduation text is visible in the graph
    graduationDate.setDate(graduationDate.getDate() + 50)
    comparedValues.push(graduationDate.getTime())
  }

  return Math.max(...comparedValues)
}

const CreditsGraph = ({ graphYearStart, student, absences, selectedStudyPlanId }) => {
  const selectedStudyPlan = student.studyplans.find(({ id }) => id === selectedStudyPlanId)
  const studyRightId = selectedStudyPlan?.sis_study_right_id
  const selectedStudyRight = student.studyRights.find(({ id }) => id === studyRightId)
  const selectedStudyRightElement = selectedStudyRight?.studyRightElements.find(
    ({ code }) => code === selectedStudyPlan.programme_code
  )
  const creditDates = student.courses.map(({ date }) => new Date(date).getTime())
  const [studyRightTargetStart, studyRightTargetEnd] = getStudyRightElementTargetDates(
    selectedStudyRightElement,
    absences
  )
  const selectedStart = new Date(
    resolveGraphStartDate(student, graphYearStart, selectedStudyPlan, studyRightTargetStart)
  )
  const endDate = resolveGraphEndDate(
    creditDates,
    selectedStudyPlan?.included_courses ?? [],
    student,
    studyRightTargetEnd,
    selectedStudyRightElement
  )
  return (
    <CreditAccumulationGraphHighCharts
      absences={absences}
      endDate={endDate}
      programmeCodes={null}
      selectedStudyPlan={selectedStudyPlan}
      showBachelorAndMaster={null}
      singleStudent
      startDate={selectedStart}
      students={[student]}
      studyPlanFilterIsActive={null}
      studyRightId={studyRightId}
    />
  )
}

const semesterChunkify = (courses, semesters, getTextIn: ReturnType<typeof useLanguage>['getTextIn']) => {
  const semesterChunks = courses.reduce((acc, curr) => {
    const semester = semesters.find(
      semester => moment(curr.date).isSameOrAfter(semester.startdate) && moment(curr.date).isBefore(semester.enddate)
    )
    const semesterData = acc.find(data => data.semester === semester.name)
    if (semesterData) {
      semesterData.data.push(curr)
    } else {
      acc.push({ data: [curr], semester: semester.name })
    }
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

const gradeMeanSeries = (
  student: any,
  chunksize: number,
  semesters: SemestersData | undefined,
  getTextIn: ReturnType<typeof useLanguage>['getTextIn']
) => {
  const filteredCourses = student.courses.filter(
    course => !Number.isNaN(Number(course.grade)) && !course.isStudyModuleCredit && course.passed
  )

  const coursesGroupedByDate = groupBy(filteredCourses, 'date')

  const gradesAndMeans = Object.values(coursesGroupedByDate).reduce(
    (acc, courses) => {
      for (const course of courses) {
        acc.grades.push({
          grade: Number(course.grade),
          date: course.date,
          credits: course.credits,
        })
        // Weighted average: each grade is multiplied by the amount of credits the course is worth
        acc.totalGradeSum += Number(course.grade) * course.credits
        acc.totalCredits += course.credits
      }
      acc.mean.push({ y: acc.totalGradeSum / acc.totalCredits, x: new Date(courses[0].date).getTime() })
      return acc
    },
    {
      grades: [] as Array<{ grade: number; date: string; credits: number }>,
      mean: [] as Array<{ y: number; x: number }>,
      totalGradeSum: 0,
      totalCredits: 0,
    }
  )

  const size = Number(chunksize) ? chunksize : 3
  const chunks = chunk(gradesAndMeans.grades, size)

  const groupMeans = chunks.reduce<Array<{ name: string; y: number; x: number }>>((acc, curr) => {
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

  const semesterMeans = semesterChunkify(gradesAndMeans.grades, Object.values(semesters?.semesters ?? {}), getTextIn)

  return {
    totalMeans: [{ data: gradesAndMeans.mean }],
    groupMeans: [{ data: groupMeans }],
    semesterMeans: [{ data: semesterMeans }],
  }
}

const GradeGraph = ({ student }: { student: any }) => {
  const { getTextIn } = useLanguage()
  const [groupSize, setGroupSize] = useState(5)
  const [graphMode, setGraphMode] = useState('total')
  const { data: semesters } = useGetSemestersQuery()
  const series = useMemo(
    () => gradeMeanSeries(student, groupSize, semesters, getTextIn),
    [student, groupSize, semesters, getTextIn]
  )
  const { totalMeans, groupMeans, semesterMeans } = series

  const defaultOptions = {
    chart: {
      type: 'spline',
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
    <Stack alignItems="center" spacing={2}>
      <Alert severity="info" sx={{ maxWidth: '75%' }}>
        <AlertTitle>Grade graph</AlertTitle>
        Painotettu keskiarvo lasketaan kaikista niistä opintojaksoista, joiden arviointiasteikko on 0–5.{' '}
        <b>Total mean</b> näyttää, kuinka keskiarvo on kehittynyt opintojen aikana. <b>Group mean</b> jakaa kurssit
        valitun kokoisiin ryhmiin ja laskee niiden keskiarvot. <b>Semester mean</b> laskee jokaisen lukukauden
        keskiarvon.
      </Alert>
      <ToggleButtonGroup
        color="primary"
        exclusive
        onChange={(_event, newMode) => setGraphMode(newMode)}
        value={graphMode}
      >
        <ToggleButton value="total">Show total mean</ToggleButton>
        <ToggleButton value="group">Show group mean</ToggleButton>
        <ToggleButton value="semester">Show semester mean</ToggleButton>
      </ToggleButtonGroup>
      {graphMode === 'group' && (
        <TextField
          data-cy="group-size-input"
          label="Group size"
          onChange={event => {
            if (!Number.isNaN(Number(event.target.value))) {
              setGroupSize(Number(event.target.value))
            }
          }}
          value={groupSize}
        />
      )}
      <Box width="100%">
        {graphMode === 'total' && <ReactHighcharts config={totalMeanOptions} />}
        {graphMode === 'group' && <ReactHighcharts config={groupMeanOptions} />}
        {graphMode === 'semester' && <ReactHighcharts config={semesterMeanOptions} />}
      </Box>
    </Stack>
  )
}

export const StudentGraphs = ({
  absences,
  graphYearStart,
  student,
  selectedStudyPlanId,
}: {
  absences: Absence[]
  graphYearStart: string | null
  student: any
  selectedStudyPlanId: string | null
}) => {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <Paper variant="outlined">
      <Tabs onChange={(_event, newValue: number) => setActiveTab(newValue)} value={activeTab}>
        <Tab label="Credit graph" />
        <Tab label="Grade graph" />
      </Tabs>
      <Box sx={{ padding: 2 }}>
        {activeTab === 0 && (
          <CreditsGraph
            absences={absences}
            graphYearStart={graphYearStart}
            selectedStudyPlanId={selectedStudyPlanId}
            student={student}
          />
        )}
        {activeTab === 1 && <GradeGraph student={student} />}
      </Box>
    </Paper>
  )
}
