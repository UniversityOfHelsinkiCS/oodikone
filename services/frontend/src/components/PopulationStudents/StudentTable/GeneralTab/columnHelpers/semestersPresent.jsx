import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { Popup } from 'semantic-ui-react'

import { getCurrentSemester, isFall, isMastersProgramme } from '@/common'

dayjs.extend(isBetween)

export const getSemestersPresentFunctions = ({
  allSemesters,
  allSemestersMap,
  filteredStudents,
  getTextIn,
  programmeCode,
  studentToSecondStudyrightEndMap,
  studentToStudyrightEndMap,
  year,
  semestersToAddToStart,
}) => {
  if (!allSemesters || !filteredStudents)
    return {
      getSemesterEnrollmentsContent: () => null,
      getSemesterEnrollmentsVal: () => {},
      getFirstSemester: () => {},
      getLastSemester: () => {},
    }

  const { semestercode: currentSemesterCode } = getCurrentSemester(allSemestersMap) || {}

  const last = currentSemesterCode + 1 * isFall(currentSemesterCode)
  const getFirstAndLastSemester = () => {
    const associatedYear = year !== 'All' && year
    if (associatedYear) {
      const first = Object.values(allSemesters).find(
        semester => new Date(semester.startdate).getTime() === new Date(Date.UTC(associatedYear, 7, 1)).getTime()
      ).semestercode

      return { first: first - (semestersToAddToStart ?? 0), last }
    }

    return { first: last - 13, last }
  }

  const { first: firstSemester, last: lastSemester } =
    Object.keys(allSemesters).length > 0 ? getFirstAndLastSemester() : { first: 0, last: 0 }

  const enrollmentTypeText = (type, statutoryAbsence) => {
    if (type === 1) return 'Enrolled as present'
    if (type === 2 && statutoryAbsence) return 'Enrolled as absent (statutory)'
    if (type === 2) return 'Enrolled as absent'
    if (type === 3) return 'Not enrolled'
    return 'No study right'
  }

  const graduatedOnSemester = (student, semester, programmeCode) => {
    if (!programmeCode) return 0
    const firstGraduation = studentToStudyrightEndMap[student.studentNumber]
    const secondGraduation = studentToSecondStudyrightEndMap[student.studentNumber]
    if (
      firstGraduation &&
      dayjs(firstGraduation).isBetween(allSemestersMap[semester].startdate, allSemestersMap[semester].enddate)
    ) {
      if (!isMastersProgramme(programmeCode)) return 1
      return 2
    }
    if (
      secondGraduation &&
      dayjs(secondGraduation).isBetween(allSemestersMap[semester].startdate, allSemestersMap[semester].enddate)
    ) {
      if (isMastersProgramme(programmeCode)) return 1
      return 2
    }
    return 0
  }

  const getSemesterEnrollmentsContent = (student, studyright) => {
    if (allSemesters.length === 0) return null
    if (!student.semesterEnrollmentsMap && !studyright) return null
    const semesterIcons = []

    const getSemesterJSX = (semester, enrollmenttype, statutoryAbsence, graduated, key) => {
      let type = 'none'
      if (enrollmenttype === 1) type = 'present'
      if (enrollmenttype === 2) type = 'absent'
      if (enrollmenttype === 2 && statutoryAbsence) type = 'absent-statutory'
      if (enrollmenttype === 3) type = 'passive'

      const onHoverString = () => {
        const graduationText = graduated !== 0 ? `(graduated as ${graduated === 1 ? 'Bachelor' : 'Master'})` : ''
        return `${enrollmentTypeText(enrollmenttype, statutoryAbsence)} in ${getTextIn(
          allSemestersMap[semester].name
        )} ${graduationText}`
      }

      const graduationCrown = (
        <svg
          fill="none"
          height="23"
          style={{ overflow: 'visible' }}
          viewBox="17 54 70 70"
          width="23"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M69.8203 29.1952L61.0704 56.1246H18.7499L10 29.1952L27.2632 38.9284L39.9102 15L52.5571 38.9284L69.8203 29.1952Z"
            fill="#fff238"
            stroke="#696969"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {graduated === 2 && (
            <path d="M 40 52.5 l 9 -12 l -9 -12 l -9 12 l 9 12" fill="rgb(97, 218, 255)" stroke="rgb(232, 116, 14)" />
          )}
        </svg>
      )

      return (
        <Popup
          content={onHoverString()}
          key={key}
          on="hover"
          position="bottom center"
          size="tiny"
          trigger={
            <div
              className={`enrollment-label-no-margin label-${type} ${isFall(semester) ? '' : 'margin-right'}`}
              key={key}
            >
              {graduated > 0 && graduationCrown}
            </div>
          }
        />
      )
    }

    for (let semester = firstSemester; semester <= lastSemester; semester++) {
      let enrollmenttype
      let statutoryAbsence

      if (student.semesterEnrollmentsMap) {
        enrollmenttype = student.semesterEnrollmentsMap[semester]?.enrollmenttype
        statutoryAbsence = student.semesterEnrollmentsMap[semester]?.statutoryAbsence
      } else {
        const enrollment = studyright.semesterEnrollments?.find(enrollment => enrollment.semester === semester)
        enrollmenttype = enrollment?.type
        statutoryAbsence = enrollment?.statutoryAbsence
      }

      semesterIcons.push(
        getSemesterJSX(
          semester,
          enrollmenttype,
          statutoryAbsence,
          graduatedOnSemester(student, semester, programmeCode),
          `${student.studentNumber}-${semester}`
        )
      )
    }

    return <div style={{ display: 'flex', gap: '4px' }}>{semesterIcons}</div>
  }

  const getSemesterEnrollmentsVal = (student, studyright) => {
    const enrollmentsToCount = studyright
      ? (studyright.semesterEnrollments ?? [])
      : Object.entries(student.semesterEnrollmentsMap || {}).map(([semester, data]) => ({
          semestercode: semester,
          enrollmenttype: data.enrollmenttype,
        }))

    return enrollmentsToCount.reduce(
      (acc, cur) =>
        acc + (cur.enrollmenttype === 1 && firstSemester <= cur.semestercode && cur.semestercode <= lastSemester),
      0
    )
  }

  const getFirstSemester = () => firstSemester

  const getLastSemester = () => lastSemester

  return {
    getFirstSemester,
    getLastSemester,
    getSemesterEnrollmentsContent,
    getSemesterEnrollmentsVal,
  }
}
