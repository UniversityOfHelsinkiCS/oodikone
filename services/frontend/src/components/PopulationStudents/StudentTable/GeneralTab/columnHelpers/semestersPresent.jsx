import moment from 'moment'
import React from 'react'
import { Popup } from 'semantic-ui-react'

import { getCurrentSemester, isFall, isMastersProgramme } from '@/common'

export const getSemestersPresentFunctions = ({
  allSemesters,
  allSemestersMap,
  filteredStudents,
  getTextIn,
  programmeCode,
  studentToSecondStudyrightEndMap,
  studentToStudyrightEndMap,
  year,
}) => {
  if (allSemesters?.length === 0 || !filteredStudents)
    return {
      getSemesterEnrollmentsContent: () => {},
      getSemesterEnrollmentsVal: () => {},
    }

  const { semestercode: currentSemesterCode } = getCurrentSemester(allSemestersMap) || {}

  const getFirstAndLastSemester = () => {
    const associatedYear = year !== 'All' && year
    if (associatedYear) {
      return {
        first: allSemesters.find(
          semester => `${semester.yearcode + 1949}` === associatedYear && isFall(semester.semestercode)
        )?.semestercode,
        last: isFall(currentSemesterCode) ? currentSemesterCode + 1 : currentSemesterCode,
      }
    }

    const { first } = filteredStudents.reduce(
      ({ first }, student) => {
        if (!student.semesterenrollments) return { first: 9999, last: 0 }
        const newFirst = Math.min(first, ...student.semesterenrollments.map(e => e.semestercode))
        return { first: isFall(newFirst) ? newFirst : newFirst - 1 }
      },
      { first: 9999 }
    )
    const last = isFall(currentSemesterCode) ? currentSemesterCode - 2 : currentSemesterCode
    return {
      first: last - first > 14 ? last - 13 : first,
      last,
    }
  }

  const { first: firstSemester, last: lastSemester } =
    allSemesters.length > 0 ? getFirstAndLastSemester() : { first: 9999, last: 0 }

  const enrollmentTypeText = (type, statutoryAbsence) => {
    if (type === 1) return 'Enrolled as present'
    if (type === 2 && statutoryAbsence) return 'Enrolled as absent (statutory)'
    if (type === 2) return 'Enrolled as absent'
    if (type === 3) return 'Not enrolled'
    return 'No study right'
  }

  const graduatedOnSemester = (student, sem, programmeCode) => {
    if (!programmeCode) return 0
    const firstGraduation = studentToStudyrightEndMap[student.studentNumber]
    const secondGraduation = studentToSecondStudyrightEndMap[student.studentNumber]
    if (
      firstGraduation &&
      moment(firstGraduation).isBetween(allSemestersMap[sem].startdate, allSemestersMap[sem].enddate)
    ) {
      if (!isMastersProgramme(programmeCode)) return 1
      return 2
    }
    if (
      secondGraduation &&
      moment(secondGraduation).isBetween(allSemestersMap[sem].startdate, allSemestersMap[sem].enddate)
    )
      return 2
    return 0
  }

  const getSemesterEnrollmentsContent = (student, studyright) => {
    if (allSemesters.length === 0) return ''
    if (!student.semesterenrollments && !studyright) return ''
    const semesterIcons = []

    const getSemesterJSX = (sem, enrollmenttype, statutoryAbsence, graduated, key) => {
      let type = 'none'
      if (enrollmenttype === 1) type = 'present'
      if (enrollmenttype === 2) type = 'absent'
      if (enrollmenttype === 2 && statutoryAbsence) type = 'absent-statutory'
      if (enrollmenttype === 3) type = 'passive'

      const onHoverString = () => {
        const graduationText = graduated !== 0 ? `(graduated as ${graduated === 1 ? 'Bachelor' : 'Master'})` : ''
        return `${enrollmentTypeText(enrollmenttype, statutoryAbsence)} in ${getTextIn(
          allSemestersMap[sem].name
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
            <div className={`enrollment-label-no-margin label-${type} ${isFall(sem) ? '' : 'margin-right'}`} key={key}>
              {graduated > 0 && graduationCrown}
            </div>
          }
        />
      )
    }

    for (let sem = firstSemester; sem <= lastSemester; sem++) {
      const { enrollmenttype, statutoryAbsence } = student.semesterEnrollmentsMap
        ? student.semesterEnrollmentsMap[sem] || {}
        : studyright[0].semesterEnrollments?.find(e => e.semestercode === sem) || {}
      semesterIcons.push(
        getSemesterJSX(
          sem,
          enrollmenttype,
          statutoryAbsence,
          graduatedOnSemester(student, sem, programmeCode),
          `${student.studentNumber}-${sem}`
        )
      )
    }

    return <div style={{ display: 'flex', gap: '4px' }}>{semesterIcons}</div>
  }

  const getSemesterEnrollmentsVal = (student, studyright) => {
    if (!student && !studyright) return 0
    const enrollmentsToCount = studyright ? studyright.semesterEnrollments : student.semesterenrollments
    return enrollmentsToCount.reduce(
      (prev, cur) =>
        prev +
        (cur.semestercode >= firstSemester && cur.semestercode <= lastSemester && cur.enrollmenttype === 1 ? 1 : 0),
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
