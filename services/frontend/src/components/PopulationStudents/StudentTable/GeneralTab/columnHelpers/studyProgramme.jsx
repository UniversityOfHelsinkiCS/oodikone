import React from 'react'

import { getAllProgrammesOfStudent, reformatDate } from '@/common'

const noProgrammeDuringCourse = {
  en: 'No programme at time of course',
  fi: 'Ei ohjelmaa kurssin aikana',
}

const noProgramme = {
  en: 'No programme',
  fi: 'Ei ohjelmaa',
}

export const getStudyProgrammeFunctions = ({
  coursecode,
  elementDetails,
  getTextIn,
  programmeCode,
  selectedStudents,
  students,
  studentToProgrammeStartMap,
}) => {
  if (!students || !selectedStudents || !elementDetails) return {}

  const getProgrammesAtEnrollment = student => {
    // returns null if no enrollment was found
    const filteredEnrollments = student.enrollments
      ? student.enrollments
          // eslint-disable-next-line camelcase
          .filter(({ course_code }) => coursecode.includes(course_code))
          .sort((a, b) => new Date(b.enrollment_date_time) - new Date(a.enrollment_date_time))
      : null
    if (filteredEnrollments === null) return null
    if (!filteredEnrollments.length) return null
    return getAllProgrammesOfStudent(
      student.studyrights,
      student.studentNumber,
      { [student.studentNumber]: filteredEnrollments[0].enrollment_date_time },
      elementDetails
    )
  }

  const getProgrammesAtCompletion = student => {
    const courseCompletions = student.courses
      // eslint-disable-next-line camelcase
      .filter(({ course_code }) => coursecode.includes(course_code))
      .sort((a, b) => {
        if (a.date < b.date) return 1
        if (a.date > b.date) return -1
        return 0
      })

    if (courseCompletions.length === 0) return [noProgrammeDuringCourse]

    const { date } = courseCompletions[0]

    const allProgs = getAllProgrammesOfStudent(
      student.studyrights,
      student.studentNumber,
      { [student.studentNumber]: date },
      elementDetails
    )

    return allProgs
  }

  const getStudentsProgrammes = student => {
    if (coursecode?.length > 0) {
      const programmesAtEnrollment = getProgrammesAtEnrollment(student)
      if (
        programmesAtEnrollment !== null &&
        programmesAtEnrollment?.length > 0 &&
        !programmesAtEnrollment[0].code.startsWith('0000')
      )
        return programmesAtEnrollment
      return getProgrammesAtCompletion(student)
    }
    return getAllProgrammesOfStudent(student.studyrights, student.studentNumber, null, elementDetails)
  }

  const getProgrammeToShow = programmes => {
    // For course statistics (student.enrollments exists) show newest programme at the time of course enrollment
    // For other views: If programme associated, show newest OTHER programme (And the rest on hover), if no programme associated, show newest.
    if (!programmes) return coursecode ? noProgrammeDuringCourse : noProgramme
    if (coursecode?.length > 0) {
      if (programmes.length > 0) return programmes[0].name
    }
    if (programmeCode) {
      const otherProgrammes = programmes.filter(programme => programme.code !== programmeCode)
      return otherProgrammes.length > 0 ? otherProgrammes[0].name : programmes[0].name
    }
    if (programmes.length > 0) return programmes[0].name
    return noProgramme
  }

  const studentProgrammesMap = selectedStudents.reduce((res, studentNumber) => {
    res[studentNumber] = {
      programmes: getStudentsProgrammes(students[studentNumber]),
    }

    const programmeToShow = getProgrammeToShow(res[studentNumber].programmes)

    if (programmeToShow) res[studentNumber].programmeToShow = getTextIn(programmeToShow)
    res[studentNumber].getProgrammesList = delimiter =>
      res[studentNumber].programmes
        .map(programme => {
          if (programme.graduated) {
            return `${getTextIn(programme.name)} (graduated)`
          }
          if (!programme.active && !programme.code?.startsWith('0000')) {
            return `${getTextIn(programme.name)} (inactive)`
          }
          return getTextIn(programme.name)
        })
        .join(delimiter)
    return res
  }, {})

  const getStudyProgrammeContent = student => {
    const programme = studentProgrammesMap[student.studentNumber]?.programmeToShow

    if (!programme) return getTextIn(noProgramme)
    const formattedProgramme = programme.length > 45 ? `${programme.substring(0, 43)}...` : programme
    if (studentProgrammesMap[student.studentNumber]?.programmes.length > 1) {
      return (
        <div>
          {formattedProgramme} + {studentProgrammesMap[student.studentNumber].programmes.length - 1}
        </div>
      )
    }
    return formattedProgramme
  }
  const getStudyStartDate = student => {
    if (programmeCode !== undefined) {
      return reformatDate(studentToProgrammeStartMap[student.studentNumber], 'YYYY-MM-DD')
    }

    const programme = studentProgrammesMap[student.studentNumber]?.programmes[0]
    if (programme?.startdate) {
      return reformatDate(programme.startdate, 'YYYY-MM-DD')
    }
    return '-'
  }
  return { getStudyProgrammeContent, studentProgrammesMap, getStudyStartDate }
}
