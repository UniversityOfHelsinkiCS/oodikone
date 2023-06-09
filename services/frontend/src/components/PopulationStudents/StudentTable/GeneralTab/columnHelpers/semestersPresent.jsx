import React from 'react'
import moment from 'moment'
import { getTextIn } from 'common'

const getSemestersPresentFunctions = ({
  allSemesters,
  allSemestersMap,
  group,
  year,
  filteredStudents,
  studentToStudyrightEndMap,
  studentToSecondStudyrightEndMap,
  language,
}) => {
  if (allSemesters?.length === 0 || !filteredStudents)
    return {
      getSemesterEnrollmentsContent: () => {},
      getSemesterEnrollmentsProps: () => {},
      getSemesterEnrollmentsForExcel: () => {},
    }

  const currentSemesterCode = (() => {
    const now = new Date()
    const isSpring = now.getMonth() <= 7
    return allSemesters.find(sem => sem.name.en === `${isSpring ? 'Spring' : 'Autumn'} ${new Date().getFullYear()}`)
      ?.semestercode
  })()

  const isFall = semester => semester % 2 === 1

  const getFirstAndLastSemester = () => {
    const associatedYear = group?.tags?.year || (year !== 'All' && year)
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
  const enrollmentTypeText = type => {
    if (type === 1) return 'Present'
    if (type === 2) return 'Absent'
    if (type === 3) return 'Inactive'
    return 'Unknown enrollment type'
  }

  const graduatedOnSemester = (student, sem) => {
    const firstGraduation = studentToStudyrightEndMap[student.studentNumber]
    const secondGraduation = studentToSecondStudyrightEndMap[student.studentNumber]
    if (
      firstGraduation &&
      moment(firstGraduation).isBetween(allSemestersMap[sem].startdate, allSemestersMap[sem].enddate)
    )
      return 1
    if (
      secondGraduation &&
      moment(secondGraduation).isBetween(allSemestersMap[sem].startdate, allSemestersMap[sem].enddate)
    )
      return 2
    return 0
  }

  const getSemesterEnrollmentsContent = student => {
    if (allSemesters.length === 0) return ''
    if (!student.semesterenrollments) return ''
    const semesterIcons = []

    const getSemesterJSX = (enrollmenttype, graduated, isSpring, key) => {
      let type = 'none'
      if (enrollmenttype === 1) type = 'present'
      if (enrollmenttype === 2) type = 'absent'
      if (enrollmenttype === 3) type = 'passive'

      const graduationCrown = (
        <svg
          style={{ overflow: 'visible' }}
          width="23"
          height="23"
          viewBox="17 54 70 70"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M69.8203 29.1952L61.0704 56.1246H18.7499L10 29.1952L27.2632 38.9284L39.9102 15L52.5571 38.9284L69.8203 29.1952Z"
            stroke="#696969"
            fill="#fff238"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {graduated === 2 && (
            <path d="M 40 52.5 l 9 -12 l -9 -12 l -9 12 l 9 12" fill="rgb(97, 218, 255)" stroke="rgb(232, 116, 14)" />
          )}
        </svg>
      )

      return (
        <div key={key} className={`enrollment-label-no-margin label-${type} ${isSpring ? 'margin-right' : ''}`}>
          {graduated > 0 && graduationCrown}
        </div>
      )
    }

    for (let sem = firstSemester; sem <= lastSemester; sem++) {
      semesterIcons.push(
        getSemesterJSX(
          student.semesterEnrollmentsMap[sem],
          graduatedOnSemester(student, sem),
          sem % 2 === 0,
          `${student.studentNumber}-${sem}`
        )
      )
    }

    return <div style={{ display: 'flex', gap: '4px' }}>{semesterIcons}</div>
  }

  const getSemesterEnrollmentsProps = student => {
    if (allSemesters?.length === 0) return {}
    if (!student.semesterenrollments?.length > 0) return {}
    const title = student.semesterenrollments.reduce((enrollmentsString, current) => {
      if (current.semestercode >= firstSemester && current.semestercode <= lastSemester) {
        const graduation = graduatedOnSemester(student, current.semestercode)
        const graduationText = `(graduated as ${graduation === 1 ? 'Bachelor' : 'Master'})`
        return `${enrollmentsString}${enrollmentTypeText(current.enrollmenttype)} in ${getTextIn(
          allSemestersMap[current.semestercode].name,
          language
        )} ${graduation > 0 ? graduationText : ''} \n`
      }
      return enrollmentsString
    }, '')
    return { title }
  }

  const getSemesterEnrollmentsForExcel = student => {
    if (allSemesters?.length === 0) return ''
    if (!student.semesterenrollments?.length > 0) return ''
    let enrollmentsString = `Starting from ${getTextIn(
      allSemestersMap[student.semesterenrollments[0].semestercode].name,
      language
    )}: `
    for (let sem = firstSemester; sem <= lastSemester; sem++) {
      const type = student.semesterEnrollmentsMap[sem]
      let sign = '_'
      if (type === 1) sign = '+'
      if (type === 2) sign = 'o'
      enrollmentsString += sign
    }

    return enrollmentsString
  }

  return { getSemesterEnrollmentsContent, getSemesterEnrollmentsProps, getSemesterEnrollmentsForExcel }
}

export default getSemestersPresentFunctions
