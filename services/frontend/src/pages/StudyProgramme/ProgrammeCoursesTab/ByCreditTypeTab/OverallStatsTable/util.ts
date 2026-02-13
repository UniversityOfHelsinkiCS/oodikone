import { range } from 'lodash-es'

import { Name, StudyProgrammeCourse } from '@oodikone/shared/types'
import { createEmptyStats } from '@oodikone/shared/util/studyProgramme'

export const filterDataByYear = (
  data: StudyProgrammeCourse[],
  fromYear: number,
  toYear: number,
  getTextIn: (arg0: Name) => string | null | undefined
) => {
  const yearRange = range(fromYear, Number(toYear) + 1)
  const filteredAndMergedCourses = data
    .filter(course => {
      const arr = Object.keys(course.years).some(key => yearRange.includes(Number(key)))
      return arr
    })
    .map(course => {
      const values = Object.entries(course.years).reduce((acc, curr) => {
        if (yearRange.includes(Number(curr[0]))) {
          acc.allStudents += curr[1].allStudents
          acc.allPassed += curr[1].allPassed
          acc.allNotPassed += curr[1].allNotPassed
          acc.allCredits += curr[1].allCredits
          acc.degreeStudents += curr[1].degreeStudents
          acc.degreeStudentsCredits += curr[1].degreeStudentsCredits
          acc.exchangeStudents += curr[1].exchangeStudents
          acc.exchangeStudentsCredits += curr[1].exchangeStudentsCredits
          acc.otherUniversityStudents += curr[1].otherUniversityStudents
          acc.otherUniversityCredits += curr[1].otherUniversityCredits
          acc.otherStudents += curr[1].otherStudents
          acc.otherStudentsCredits += curr[1].otherStudentsCredits
          acc.transferStudents += curr[1].transferStudents
          acc.transferStudentsCredits += curr[1].transferStudentsCredits

          acc.separateStudents += curr[1].separateStudents
          acc.separateStudentsCredits += curr[1].separateStudentsCredits

          acc.openStudents += curr[1].openStudents
          acc.openStudentsCredits += curr[1].openStudentsCredits
        }

        return acc
      }, createEmptyStats(!!course.isStudyModule))
      return {
        ...values,
        code: course.code,
        name: getTextIn(course.name),
      }
    })

  return filteredAndMergedCourses
}
