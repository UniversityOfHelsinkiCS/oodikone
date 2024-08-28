import { isEmpty, orderBy } from 'lodash'
import { useState } from 'react'
import { Loader, Message } from 'semantic-ui-react'

import { bachelorHonoursProgrammes as bachelorCodes } from '@/common'
import { StudentInfoCard } from '@/components/StudentStatistics/StudentInfoCard'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useGetStudentQuery } from '@/redux/students'
import { BachelorHonours } from './BachelorHonours'
import { CourseParticipationTable } from './CourseParticipationTable'
import { StudentGraphs } from './StudentGraphs'
import { StudyrightsTable } from './StudyrightsTable'
import { TagsTable } from './TagsTable'

const getAbsentYears = (studyRights, semesters) => {
  const semesterEnrollments = studyRights.reduce((acc, { semesterEnrollments }) => {
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
      } else if (enrollment.type === 2) {
        currentEnrollment.enrollmenttype = enrollment.type
        currentEnrollment.statutoryAbsence = enrollment.statutoryAbsence ?? false
      }
    }
    return acc
  }, {})

  const minimumSemesterCode = Math.min(...Object.keys(semesterEnrollments))
  const maximumSemesterCode = Math.max(...Object.keys(semesterEnrollments))

  for (let i = minimumSemesterCode + 1; i < maximumSemesterCode; i++) {
    if (!semesterEnrollments[i]) {
      semesterEnrollments[i] = { semestercode: i, enrollmenttype: 3, statutoryAbsence: false }
    }
  }

  const mergedEnrollments = Object.values(semesterEnrollments)
    .filter(enrollments => enrollments.enrollmenttype !== 1)
    .map(enrollment => ({
      ...enrollment,
      startdate: new Date(semesters[enrollment.semestercode].startdate).getTime(),
      enddate: new Date(semesters[enrollment.semestercode].enddate).getTime(),
    }))

  return mergedEnrollments
}

export const StudentDetails = ({ studentNumber }) => {
  const [graphYearStart, setGraphYear] = useState(null)
  const [selectedStudyPlanId, setSelectedStudyPlanId] = useState(null)
  const { data: semestersAndYears } = useGetSemestersQuery()
  const { data: student, isLoading, isError } = useGetStudentQuery(studentNumber)
  let honoursCode

  if (isLoading) {
    return <Loader active />
  }

  if (isError || student.error) {
    return <Message header="Student not found or no sufficient permissions" icon="warning sign" negative size="big" />
  }

  if (!student || !studentNumber || isEmpty(student) || !semestersAndYears) {
    return null
  }

  if (student.studyRights) {
    const bachelorStudyRights = orderBy(
      student.studyRights
        .filter(studyRight => [1, 5].includes(studyRight.extentCode))
        .flatMap(studyRight => studyRight.studyRightElements)
        .filter(element => element.phase === 1),
      ['startDate'],
      ['desc']
    )
    const [newestBachelorProgramme] = bachelorStudyRights
    if (bachelorCodes.includes(newestBachelorProgramme?.code)) {
      honoursCode = newestBachelorProgramme.code
    }
  }

  const handleStudyPlanChange = id => {
    if (id === selectedStudyPlanId) {
      setSelectedStudyPlanId(null)
      setGraphYear(null)
    } else {
      setSelectedStudyPlanId(id)
      const { programme_code: programmeCode, sis_study_right_id: studyRightId } = student.studyplans.find(
        studyPlan => studyPlan.id === id
      )
      const studyRight = student.studyRights.find(studyRight => studyRight.id === studyRightId)
      const programme = studyRight.studyRightElements.find(element => element.code === programmeCode)
      setGraphYear(programme.startDate)
    }
  }

  const absences = getAbsentYears(student.studyRights, semestersAndYears.semesters)

  return (
    <>
      <StudentInfoCard student={student} />
      <StudentGraphs
        absences={absences}
        graphYearStart={graphYearStart}
        selectedStudyPlanId={selectedStudyPlanId}
        semesters={semestersAndYears}
        student={student}
      />
      <TagsTable student={student} />
      <StudyrightsTable
        handleStudyPlanChange={handleStudyPlanChange}
        selectedStudyPlanId={selectedStudyPlanId}
        student={student}
      />
      {honoursCode && <BachelorHonours absentYears={absences} programmeCode={honoursCode} student={student} />}
      <CourseParticipationTable selectedStudyPlanId={selectedStudyPlanId} student={student} />
    </>
  )
}
