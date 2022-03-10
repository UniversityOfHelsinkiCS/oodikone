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
        if (!cgrades[grade]) cgrades[grade] = 0
        cgrades[grade] += curr.attempts.grades[grade]

        if (['EISA', 'Hyl.', 'HYL', '0', 'LUOP'].includes(grade)) {
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

      const { enrollmentsByState } = acc
      curr.enrollments.forEach(({ state }) => {
        enrollmentsByState[state] += 1
      })

      return {
        ...acc,
        coursecode: curr.coursecode,
        totalEnrollments: acc.totalEnrollments + curr.totalEnrollments,
        enrolledStudentsWithNoGrade: acc.enrolledStudentsWithNoGrade + curr.enrolledStudentsWithNoGrade,
        attempts: { categories: { passed, failed }, grades: cgrades },
        students: {
          categories: {
            passedFirst: newPassedFirst,
            passedEventually: newPassedEventually,
            neverPassed: newNeverPassed,
          },
        },
        enrollmentsByState: { ...enrollmentsByState },
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
      },
      totalEnrollments: 0,
      enrolledStudentsWithNoGrade: 0,
      enrollmentsByState: {
        ENROLLED: 0,
        NOT_ENROLLED: 0,
        REJECTED: 0,
        CONFIRMED: 0,
        ABORTED_BY_STUDENT: 0,
        ABORTED_BY_TEACHER: 0,
        PROCESSING: 0,
      },
      studentnumbers: [],
    }
  )

  // Count pass- and failrates also for "Total"-lines
  const { passedFirst = 0, passedEventually = 0, neverPassed = 0 } = totals.students.categories
  const total = passedFirst + passedEventually + neverPassed
  totals.students.total = total
  totals.students.passRate = (passedFirst + passedEventually) / total
  totals.students.failRate = neverPassed / total

  const { failed, passed } = totals.attempts.categories
  totals.attempts.passRate = (100 * passed) / (passed + failed)

  return totals
}

export default countTotalStats
