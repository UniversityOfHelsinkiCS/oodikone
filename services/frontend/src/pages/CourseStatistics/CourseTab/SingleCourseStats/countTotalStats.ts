import { FAILED_GRADES } from '@/constants/grades'
import { FormattedStats } from '@/types/courseStat'

const parseGrade = (grade: string) => {
  const parsedGrade = Number(grade) ? Math.round(Number(grade)).toString() : grade
  if (parsedGrade === 'LA') {
    return 'LUB'
  }
  return parsedGrade
}

export const countTotalStats = (formattedStats: FormattedStats[]) => {
  const initialStats: FormattedStats = {
    code: 9999,
    name: 'Total',
    coursecode: '000',
    attempts: {
      categories: {
        passed: 0,
        failed: 0,
      },
      passRate: 0,
      grades: {},
      totalAttempts: 0,
      totalEnrollments: 0,
    },
    students: {
      grades: {},
      passRate: 0,
      failRate: 0,
      total: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalEnrollments: 0,
      enrolledStudentsWithNoGrade: 0,
    },
  }

  const totals = formattedStats.reduce((acc, curr) => {
    if (curr.rowObfuscated) {
      return acc
    }

    let { passed } = acc.attempts.categories
    let { failed } = acc.attempts.categories
    const cgrades = acc.attempts.grades
    const bestEffortGrades = acc.students.grades

    Object.keys(curr.attempts.grades).forEach(grade => {
      const parsedGrade = parseGrade(grade)
      if (!cgrades[parsedGrade]) {
        cgrades[parsedGrade] = 0
      }
      cgrades[parsedGrade] += curr.attempts.grades[grade]

      if (FAILED_GRADES.includes(parsedGrade.toLowerCase())) {
        failed += curr.attempts.grades[grade]
      } else {
        passed += curr.attempts.grades[grade]
      }
    })

    Object.keys(curr.students.grades).forEach(grade => {
      const parsedGrade = parseGrade(grade)
      if (!bestEffortGrades[parsedGrade]) {
        bestEffortGrades[parsedGrade] = 0
      }
      bestEffortGrades[parsedGrade] += curr.students.grades[grade]
    })

    return {
      ...acc,
      coursecode: curr.coursecode,
      attempts: {
        categories: { passed, failed },
        grades: cgrades,
        passRate: acc.attempts.passRate,
        totalAttempts: acc.attempts.totalAttempts! + curr.attempts.totalEnrollments! || passed + failed,
        totalEnrollments: (acc.attempts.totalEnrollments ?? 0) + (curr.attempts.totalEnrollments ?? 0),
      },
      students: {
        total: acc.students.total + curr.students.total,
        totalEnrollments: (acc.students.totalEnrollments ?? 0) + (curr.students.totalEnrollments ?? 0),
        totalPassed: acc.students.totalPassed + curr.students.totalPassed,
        totalFailed: acc.students.totalFailed + (curr.students.totalFailed || 0),
        enrolledStudentsWithNoGrade:
          (acc.students.enrolledStudentsWithNoGrade ?? 0) + (curr.students.enrolledStudentsWithNoGrade ?? 0),
        grades: bestEffortGrades,
        passRate: acc.students.passRate,
        failRate: acc.students.failRate,
      },
    }
  }, initialStats)

  totals.students.passRate = totals.students.totalPassed / totals.students.total
  totals.students.failRate = 1 - totals.students.passRate
  const { failed, passed } = totals.attempts.categories
  totals.attempts.passRate = (100 * passed) / (passed + failed)

  return totals
}
