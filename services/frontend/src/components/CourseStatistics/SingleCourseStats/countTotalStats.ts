const parseGrade = (grade: string) => {
  const parsedGrade = Number(grade) ? Math.round(Number(grade)).toString() : grade
  if (parsedGrade === 'LA') {
    return 'LUB'
  }
  return parsedGrade
}

export const countTotalStats = (formattedStats, userHasAccessToAllStats: boolean) => {
  const initialStats = {
    code: 9999,
    name: 'Total',
    coursecode: '000',
    userHasAccessToAllStats,
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
      categories: {
        passedFirst: 0,
        passedEventually: 0,
        neverPassed: 0,
      },
      grades: {},
      passRate: 0,
      failRate: 0,
      total: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalEnrollments: 0,
      enrolledStudentsWithNoGrade: 0,
    },
    studentnumbers: [],
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

      if (['eisa', 'hyl.', 'hyl', '0', 'luop'].includes(parsedGrade.toLowerCase())) {
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

    const { passedFirst, passedEventually, neverPassed } = curr.students.categories

    const newPassedFirst = passedFirst
      ? acc.students.categories.passedFirst + passedFirst
      : acc.students.categories.passedFirst

    const newPassedEventually = passedEventually
      ? acc.students.categories.passedEventually + passedEventually
      : acc.students.categories.passedEventually

    const newNeverPassed = neverPassed
      ? acc.students.categories.neverPassed + neverPassed
      : acc.students.categories.neverPassed

    return {
      ...acc,
      coursecode: curr.coursecode,
      attempts: {
        categories: { passed, failed },
        grades: cgrades,
        totalAttempts: acc.attempts.totalAttempts + curr.attempts.totalEnrollments || passed + failed,
        totalEnrollments: acc.attempts.totalEnrollments + (curr.attempts.totalEnrollments || 0),
      },
      students: {
        total: acc.students.total + curr.students.total,
        totalEnrollments: acc.students.totalEnrollments + (curr.students.totalEnrollments || 0),
        totalPassed: acc.students.totalPassed + curr.students.totalPassed,
        totalFailed: acc.students.totalFailed + (curr.students.totalFailed || 0),
        enrolledStudentsWithNoGrade:
          acc.students.enrolledStudentsWithNoGrade + (curr.students.enrolledStudentsWithNoGrade || 0),
        categories: {
          passedFirst: newPassedFirst,
          passedEventually: newPassedEventually,
          neverPassed: newNeverPassed,
        },
        grades: bestEffortGrades,
      },
    }
  }, initialStats)

  const { passedFirst = 0, passedEventually = 0, neverPassed = 0 } = totals.students.categories
  const { enrolledStudentsWithNoGrade = 0 } = totals.students
  const total = passedFirst + passedEventually + neverPassed + enrolledStudentsWithNoGrade
  totals.students.passRate = (passedFirst + passedEventually) / total
  totals.students.failRate = neverPassed / total
  const { failed, passed } = totals.attempts.categories
  totals.attempts.passRate = (100 * passed) / (passed + failed)

  return totals
}
