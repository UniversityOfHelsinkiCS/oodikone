import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'

import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { flattenDeep } from 'lodash-es'
import { useState } from 'react'

import { getStudyRightElementTargetDates } from '@/common'
import { StudentCreditAccumulation } from '@/components/Charts/StudentCreditAccumulation'
import { StudentGradeGraphs } from '@/components/Charts/StudentGradeGraphs'
import { StyledMessage } from '@/components/common/StyledMessage'
import type { Absence } from '@/types/students'
import { StudentPageStudent } from '@oodikone/shared/types/studentData'

const getEarliestAttainmentDate = ({ courses }) => {
  if (!courses?.length) return null
  // Courses are already sorted by date in the backend
  return courses[0].date
}

const getEarliestStudyRightStartDate = ({ studyRights }) => {
  if (!studyRights?.length) return null

  const startDates = studyRights
    .map(({ startDate }) => new Date(startDate).getTime())
    .filter(time => !Number.isNaN(time))

  if (!startDates.length) return null
  return new Date(Math.min(...startDates))
}

const getCoursesIncludedInStudyPlan = (student, studyPlan) =>
  student.courses.filter(({ course }) => studyPlan.included_courses.includes(course.code))

const resolveGraphStartDate = (student, graphYearStart, selectedStudyPlan, studyRightTargetStart) => {
  const earliestAttainmentDate = getEarliestAttainmentDate(student)
  const earliestStudyRightStartDate = getEarliestStudyRightStartDate(student)
  if (!selectedStudyPlan)
    return Math.min(
      new Date(earliestAttainmentDate ?? earliestStudyRightStartDate ?? graphYearStart ?? new Date()).getTime(),
      new Date(graphYearStart ?? new Date()).getTime()
    )
  const filteredCourses = getCoursesIncludedInStudyPlan(student, selectedStudyPlan)

  if (!filteredCourses.length) {
    return new Date(studyRightTargetStart ?? earliestStudyRightStartDate ?? graphYearStart ?? new Date()).getTime()
  }

  const candidateTimes = [
    ...flattenDeep<number>(filteredCourses.map(({ date }) => new Date(date).getTime())),
    new Date(studyRightTargetStart ?? earliestStudyRightStartDate ?? graphYearStart ?? new Date()).getTime(),
  ].filter(time => Number.isFinite(time))

  return candidateTimes.length ? Math.min(...candidateTimes) : new Date(graphYearStart ?? new Date()).getTime()
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

const CreditsGraph = ({
  graphYearStart,
  student,
  absences,
  selectedStudyPlanId,
}: {
  graphYearStart: string | null
  student: StudentPageStudent
  absences: Absence[]
  selectedStudyPlanId: string | null
}) => {
  const selectedStudyPlan = student.studyplans.find(({ id }) => id === selectedStudyPlanId)
  const studyRightId = selectedStudyPlan?.sis_study_right_id
  const selectedStudyRight = student.studyRights.find(({ id }) => id === studyRightId)
  const selectedStudyRightElement = selectedStudyRight?.studyRightElements.find(
    ({ code }) => code === selectedStudyPlan?.programme_code
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
    <StudentCreditAccumulation
      absences={absences}
      endDate={endDate}
      selectedStudyPlan={selectedStudyPlan}
      startDate={selectedStart}
      student={student}
      studyRightId={studyRightId}
    />
  )
}

const GradeGraphs = ({ student }: { student: StudentPageStudent }) => {
  const [graphMode, setGraphMode] = useState<'total' | 'group' | 'semester'>('total')
  const [groupSize, setGroupSize] = useState(5)

  return (
    <>
      <Stack alignItems="center" spacing={2}>
        <StyledMessage showIcon title="Grade graph" variant="standard">
          Painotettu keskiarvo lasketaan kaikista niistä opintojaksoista, joiden arviointiasteikko on 0–5.{' '}
          <b>Total mean</b> näyttää, kuinka keskiarvo on kehittynyt opintojen aikana. <b>Group mean</b> jakaa kurssit
          valitun kokoisiin ryhmiin ja laskee niiden keskiarvot. <b>Semester mean</b> laskee jokaisen lukukauden
          keskiarvon.
        </StyledMessage>

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
            size="small"
            value={groupSize}
          />
        )}
      </Stack>
      <StudentGradeGraphs graphMode={graphMode} groupSize={groupSize} student={student} />
    </>
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
  student: StudentPageStudent
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
        {activeTab === 1 && <GradeGraphs student={student} />}
      </Box>
    </Paper>
  )
}
