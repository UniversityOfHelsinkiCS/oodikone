const countTotalStats = (formattedStats, userHasAccessToAllStats) => {
  const totals = formattedStats.reduce(
    (acc, curr) => {
      if (curr.rowObfuscated) {
        return acc
      }

      let { passed } = acc.attempts.categories
      let { failed } = acc.attempts.categories
      const cgrades = acc.attempts.grades

      Object.keys(curr.attempts.grades).forEach(grade => {
        let parsedGrade = Number(grade) ? Math.round(Number(grade)).toString() : grade
        if (parsedGrade === 'LA') parsedGrade = 'LUB' // merge LA and LUB grades
        if (!cgrades[parsedGrade]) cgrades[parsedGrade] = 0
        cgrades[parsedGrade] += curr.attempts.grades[grade]

        if (['eisa', 'hyl.', 'hyl', '0', 'luop'].includes(parsedGrade.toLowerCase())) {
          failed += curr.attempts.grades[grade]
        } else {
          passed += curr.attempts.grades[grade]
        }
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

      Object.keys(curr.students.enrollmentsByState).forEach(k => {
        if (acc.students.enrollmentsByState[k] === undefined) acc.students.enrollmentsByState[k] = 0
        acc.students.enrollmentsByState[k] += curr.students.enrollmentsByState[k] || 0
      })

      Object.keys(curr.attempts.enrollmentsByState).forEach(k => {
        if (acc.attempts.enrollmentsByState[k] === undefined) acc.attempts.enrollmentsByState[k] = 0
        acc.attempts.enrollmentsByState[k] += curr.attempts.enrollmentsByState[k] || 0
      })

      return {
        ...acc,
        coursecode: curr.coursecode,
        attempts: {
          categories: { passed, failed },
          grades: cgrades,
          enrollmentsByState: { ...acc.attempts.enrollmentsByState },
          totalEnrollments: acc.students.totalEnrollments + (curr.students.totalEnrollments || 0),
        },
        students: {
          totalEnrollments: acc.students.totalEnrollments + (curr.students.totalEnrollments || 0),
          totalPassed: acc.students.totalPassed + curr.students.totalPassed,
          totalFailed: acc.students.totalFailed + curr.students.totalFailed,
          enrolledStudentsWithNoGrade:
            acc.students.enrolledStudentsWithNoGrade + (curr.students.enrolledStudentsWithNoGrade || 0),
          categories: {
            passedFirst: newPassedFirst,
            passedEventually: newPassedEventually,
            neverPassed: newNeverPassed,
          },
          enrollmentsByState: { ...acc.students.enrollmentsByState },
          withEnrollments: {
            total: acc.students.withEnrollments.total + curr.students.withEnrollments.total,
            totalFailed: acc.students.withEnrollments.totalFailed + curr.students.withEnrollments.totalFailed,
          },
        },
      }
    },
    {
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
        totalEnrollments: 0,
        enrollmentsByState: {
          ENROLLED: 0,
          REJECTED: 0,
          ABORTED: 0,
        },
      },
      students: {
        categories: {
          passedFirst: 0,
          passedEventually: 0,
          neverPassed: 0,
        },
        passRate: 0,
        failRate: 0,
        total: 0,
        totalPassed: 0,
        totalFailed: 0,
        totalEnrollments: 0,
        enrolledStudentsWithNoGrade: 0,
        enrollmentsByState: {
          ENROLLED: 0,
          REJECTED: 0,
          ABORTED: 0,
        },
        withEnrollments: {
          total: 0,
          totalFailed: 0,
        },
      },
      studentnumbers: [],
    }
  )

  // Count pass- and failrates also for "Total"-lines
  const { passedFirst = 0, passedEventually = 0, neverPassed = 0 } = totals.students.categories
  const { enrolledStudentsWithNoGrade = 0 } = totals.students
  const total = passedFirst + passedEventually + neverPassed
  totals.students.total = total
  totals.students.passRate = (passedFirst + passedEventually) / total
  totals.students.failRate = neverPassed / total

  totals.students.withEnrollments.passRate = (passedFirst + passedEventually) / (total + enrolledStudentsWithNoGrade)
  totals.students.withEnrollments.failRate =
    (neverPassed + enrolledStudentsWithNoGrade) / (total + enrolledStudentsWithNoGrade)

  const { failed, passed } = totals.attempts.categories
  totals.attempts.passRate = (100 * passed) / (passed + failed)

  return totals
}

export default countTotalStats
