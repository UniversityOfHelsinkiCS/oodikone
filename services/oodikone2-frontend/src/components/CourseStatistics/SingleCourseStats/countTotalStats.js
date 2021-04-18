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

        if (['Eisa', 'Hyl.', '0', 'Luop'].includes(grade)) {
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

      const newNeverPassed = failedFirst
        ? acc.students.categories.neverPassed + neverPassed
        : acc.students.categories.neverPassed

      return {
        ...acc,
        coursecode: curr.coursecode,
        attempts: { categories: { passed, failed }, grades: cgrades },
        students: {
          categories: {
            passedFirst: newPassedFirst,
            passedEventually: newPassedEventually,
            neverPassed: newNeverPassed
          }
        }
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
          failed: 0
        },
        passRate: 0,
        grades: {}
      },
      students: {
        categories: {
          passedFirst: 0,
          passedEventually: 0,
          neverPassed: 0
        },
        passRate: 0,
        failRate: 0,
        total: 0
      },
      studentnumbers: []
    }
  )

  // Count pass- and failrates also for "Total"-lines
  const { passedFirst = 0, passedRetry = 0, failedFirst = 0, failedRetry = 0 } = totals.students.categories
  const total = passedFirst + passedRetry + failedFirst + failedRetry
  totals.students.total = total
  totals.students.passRate = (passedFirst + passedRetry) / total
  totals.students.failRate = (failedFirst + failedRetry) / total

  const { failed, passed } = totals.attempts.categories
  totals.attempts.passRate = (100 * passed) / (passed + failed)

  return totals
}

export default countTotalStats
