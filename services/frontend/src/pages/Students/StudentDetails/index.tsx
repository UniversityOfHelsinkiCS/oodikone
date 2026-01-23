import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'

import { isEmpty, orderBy } from 'lodash-es'
import { useState } from 'react'
import { useParams } from 'react-router'

import { bachelorHonoursProgrammes as bachelorCodes } from '@/common'
import { useTitle } from '@/hooks/title'
import { SemestersData, useGetSemestersQuery } from '@/redux/semesters'
import { useGetStudentQuery } from '@/redux/students'

import type { Absence } from '@/types/students'
import { SISStudyRight } from '@oodikone/shared/models'
import { EnrollmentType, Phase } from '@oodikone/shared/types'
import { BachelorHonours } from './BachelorHonours'
import { CourseTables } from './CourseTables'
import { StudentGraphs } from './StudentGraphs'
import { StudentInfoCard } from './StudentInfoCard'
import { StudyrightsTable } from './StudyrightsTable'
import { TagsTable } from './TagsTable'

const getAbsentYears = (studyRights: SISStudyRight[], semesters: SemestersData['semesters']): Absence[] => {
  const semesterEnrollments = studyRights.reduce<
    Record<string, { semestercode: number; enrollmenttype: number; statutoryAbsence: boolean }>
  >((acc, { semesterEnrollments }) => {
    if (semesterEnrollments == null) return acc
    for (const enrollment of semesterEnrollments) {
      const currentEnrollment = acc[enrollment.semester]
      if (!currentEnrollment) {
        acc[enrollment.semester] = {
          semestercode: enrollment.semester,
          enrollmenttype: enrollment.type,
          statutoryAbsence: enrollment.statutoryAbsence ?? false,
        }
      } else if (currentEnrollment.enrollmenttype === 1) {
        continue
      } else if (enrollment.type === EnrollmentType.ABSENT) {
        currentEnrollment.enrollmenttype = enrollment.type
        currentEnrollment.statutoryAbsence = enrollment.statutoryAbsence ?? false
      }
    }
    return acc
  }, {})

  const minimumSemesterCode = Math.min(...Object.keys(semesterEnrollments).map(Number))
  const maximumSemesterCode = Math.max(...Object.keys(semesterEnrollments).map(Number))

  for (let i = minimumSemesterCode + 1; i < maximumSemesterCode; i++) {
    if (!semesterEnrollments[i]) {
      semesterEnrollments[i] = { semestercode: i, enrollmenttype: 3, statutoryAbsence: false }
    }
  }

  const mergedEnrollments = Object.values(semesterEnrollments)
    .filter(enrollments => enrollments.enrollmenttype !== 1)
    .map(enrollment => ({
      ...enrollment,
      startDate: new Date(semesters[enrollment.semestercode].startdate),
      endDate: new Date(semesters[enrollment.semestercode].enddate),
    }))

  return mergedEnrollments
}

export const StudentDetails = () => {
  const { studentNumber } = useParams()
  useTitle(studentNumber ? `${studentNumber} - Student statistics` : 'Student statistics')
  const [graphYearStart, setGraphYear] = useState<string | null>(null) // numeric
  const [selectedStudyPlanId, setSelectedStudyPlanId] = useState<string | null>(null)
  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters } = semesters ?? { semesters: {} }

  const {
    data: student,
    isLoading: isLoading,
    isError: isError,
  } = useGetStudentQuery({ studentNumber: studentNumber! }, { skip: !studentNumber })
  let honoursCode = ''

  if (isLoading) {
    return <CircularProgress />
  }

  if (isError) {
    return <Alert severity="error">Student not found or no sufficient permissions</Alert>
  }

  if (!student || !studentNumber || isEmpty(student) || !allSemesters) {
    return null
  }

  if (!Object.keys(allSemesters).length) {
    return null
  }

  if (student.studyRights) {
    const bachelorStudyRights = orderBy(
      student.studyRights
        .filter(studyRight => [1, 5].includes(studyRight.extentCode))
        .flatMap(studyRight => studyRight.studyRightElements)
        .filter(element => element.phase === Phase.ANY),
      ['startDate'],
      ['desc']
    )
    const [newestBachelorProgramme] = bachelorStudyRights
    if (bachelorCodes.includes(newestBachelorProgramme?.code)) {
      honoursCode = newestBachelorProgramme.code
    }
  }

  const handleStudyPlanChange = (id: string | null) => {
    if (id === selectedStudyPlanId) {
      setSelectedStudyPlanId(null)
      setGraphYear(null)
    } else {
      setSelectedStudyPlanId(id)
      const studyPlan = student.studyplans.find(studyPlan => studyPlan.id === id)
      const programmeCode = studyPlan?.programme_code
      const studyRightId = studyPlan?.sis_study_right_id
      const studyRight = student.studyRights.find(studyRight => studyRight.id === studyRightId)
      const programme = studyRight?.studyRightElements.find(element => element.code === programmeCode)
      setGraphYear(programme?.startDate.toString() ?? '')
    }
  }

  const absences = getAbsentYears(student.studyRights, allSemesters)

  return (
    <Stack spacing={2} width="100%">
      <StudentInfoCard student={student} />
      <StudentGraphs
        absences={absences}
        graphYearStart={graphYearStart}
        selectedStudyPlanId={selectedStudyPlanId}
        student={student}
      />
      <StudyrightsTable
        handleStudyPlanChange={handleStudyPlanChange}
        selectedStudyPlanId={selectedStudyPlanId}
        student={student}
      />
      <TagsTable student={student} />
      {honoursCode ? <BachelorHonours absentYears={absences} programmeCode={honoursCode} student={student} /> : null}
      <CourseTables selectedStudyPlanId={selectedStudyPlanId} student={student} />
    </Stack>
  )
}
