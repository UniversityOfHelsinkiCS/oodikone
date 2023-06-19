import React from 'react'
import { Icon } from 'semantic-ui-react'
import { getTextIn, reformatDate, getAllProgrammesOfStudent } from 'common'

const noProgrammeAtEnrollment = {
  en: 'No programme at time of course enrollment',
  fi: 'Ei ohjelmaa ilmoittautumisen hetkellä',
}

const noProgramme = {
  en: 'No programme',
  fi: 'Ei ohjelmaa',
}

const getStudyProgrammeFunctions = ({
  selectedStudents,
  students,
  programmeCode,
  coursecode,
  studentToProgrammeStartMap,
  elementDetails,
  language,
}) => {
  if (!students || !selectedStudents || !elementDetails) return {}

  const getProgrammesAtEnrollment = student => {
    const filteredEnrollments = student.enrollments
      ? student.enrollments
          // eslint-disable-next-line camelcase
          .filter(({ course_code }) => coursecode.includes(course_code))
          .sort((a, b) => new Date(b.enrollment_date_time) - new Date(a.enrollment_date_time))
      : []
    if (!filteredEnrollments.length) return [noProgrammeAtEnrollment]
    return getAllProgrammesOfStudent(
      student.studyrights,
      student.studentNumber,
      { [student.studentNumber]: filteredEnrollments[0].enrollment_date_time },
      elementDetails
    )
  }

  const getStudentsProgrammes = student => {
    if (coursecode?.length > 0) return getProgrammesAtEnrollment(student)
    return getAllProgrammesOfStudent(student.studyrights, student.studentNumber, null, elementDetails)
  }

  const getProgrammeToShow = (student, programmes) => {
    // For course statistics (student.enrollments exists) show newest programme at the time of course enrollment
    // For other views: If programme associated, show newest OTHER programme (And the rest on hover), if no programme associated, show newest.
    if (!programmes) return coursecode ? noProgrammeAtEnrollment : noProgramme
    if (coursecode?.length > 0) {
      const programmesAtEnrollment = getProgrammesAtEnrollment(student)
      if (programmesAtEnrollment) return programmesAtEnrollment[0].name
    }
    if (programmeCode) {
      const otherProgrammes = programmes.filter(prog => prog.code !== programmeCode)
      return otherProgrammes.length > 0 ? otherProgrammes[0].name : programmes[0].name
    }
    if (programmes.length > 0) return programmes[0].name
    return noProgramme
  }

  const studentProgrammesMap = selectedStudents.reduce((res, sn) => {
    res[sn] = {
      programmes: getStudentsProgrammes(students[sn]),
    }
    if (coursecode?.length > 0) res[sn].programmes = res[sn].programmes.filter(p => p.active)

    const programmeToShow = getProgrammeToShow(students[sn], res[sn].programmes)

    if (programmeToShow) res[sn].programmeToShow = getTextIn(programmeToShow, language)
    res[sn].getProgrammesList = delimiter =>
      res[sn].programmes
        .map(p => {
          if (p.graduated) {
            return `${getTextIn(p.name, language)} (graduated)`
          }
          if (!p.active) {
            return `${getTextIn(p.name, language)} (inactive)`
          }
          return getTextIn(p.name, language)
        })
        .join(delimiter)
    return res
  }, {})

  const getStudyProgrammeContent = s => {
    const programme = studentProgrammesMap[s.studentNumber]?.programmeToShow

    if (!programme) return getTextIn(noProgramme, language)
    if (studentProgrammesMap[s.studentNumber]?.programmes.length > 1) {
      return (
        <div>
          {programme} <Icon name="plus square outline" color="grey" size="large" />
        </div>
      )
    }
    return programme
  }
  const getStudyStartDate = s => {
    if (programmeCode !== undefined) {
      return reformatDate(studentToProgrammeStartMap[s.studentNumber], 'YYYY-MM-DD')
    }

    const programme = studentProgrammesMap[s.studentNumber]?.programmes[0]
    if (programme?.startdate) {
      return reformatDate(programme.startdate, 'YYYY-MM-DD')
    }
    return '-'
  }
  return { getStudyProgrammeContent, studentProgrammesMap, getStudyStartDate }
}

export default getStudyProgrammeFunctions
