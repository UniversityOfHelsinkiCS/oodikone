import { range } from 'lodash'

import { StudyProgrammeCourse } from '@oodikone/shared/types'

export const filterDataByYear = (data: StudyProgrammeCourse[], fromYear: number, toYear: number) => {
  const yearRange = range(fromYear, Number(toYear) + 1)
  const filteredAndMergedCourses = data
    .filter(course => {
      const arr = Object.keys(course.years).some(key => yearRange.includes(Number(key)))
      return arr
    })
    .map(course => {
      const values = Object.entries(course.years).reduce(
        (acc, curr) => {
          if (yearRange.includes(Number(curr[0]))) {
            acc.totalAllStudents += curr[1].totalAllStudents
            acc.totalAllPassed += curr[1].totalPassed
            acc.totalAllNotCompleted += curr[1].totalNotCompleted
            acc.totalAllCredits += curr[1].totalAllCredits
            acc.totalProgrammeStudents += curr[1].totalProgrammeStudents
            acc.totalProgrammeCredits += curr[1].totalProgrammeCredits
            acc.totalOtherProgrammeStudents += curr[1].totalOtherProgrammeStudents
            acc.totalOtherProgrammeCredits += curr[1].totalOtherProgrammeCredits
            acc.totalWithoutStudyRightStudents += curr[1].totalWithoutStudyRightStudents
            acc.totalWithoutStudyRightCredits += curr[1].totalWithoutStudyRightCredits
            acc.totalTransferCredits += curr[1].totalTransferCredits
            acc.totalTransferStudents += curr[1].totalTransferStudents
          }

          return acc
        },
        {
          totalAllStudents: 0,
          totalAllPassed: 0,
          totalAllNotCompleted: 0,
          totalAllCredits: 0,
          totalProgrammeStudents: 0,
          totalProgrammeCredits: 0,
          totalOtherProgrammeStudents: 0,
          totalOtherProgrammeCredits: 0,
          totalWithoutStudyRightStudents: 0,
          totalWithoutStudyRightCredits: 0,
          totalTransferCredits: 0,
          totalTransferStudents: 0,
        }
      )
      return {
        ...values,
        code: course.code,
        name: course.name,
        isStudyModule: course.isStudyModule,
      }
    })

  return filteredAndMergedCourses
}
