export const countTotalStats = (formattedStats, userHasAccessToAllStats) => {
  const totals = formattedStats.reduce(
    (acc, curr) => {
      if (curr.rowObfuscated) {
        return acc
      }
      const passed = acc.attempts.categories.passed + curr.attempts.categories.passed
      const failed = acc.attempts.categories.failed + curr.attempts.categories.failed
      const cgrades = acc.attempts.grades

      Object.keys(curr.attempts.grades).forEach(grade => {
        if (!cgrades[grade]) cgrades[grade] = 0
        cgrades[grade] += curr.attempts.grades[grade]
      })
      const { passedFirst, passedRetry, failedFirst, failedRetry } = curr.students.categories

      const newPassedFirst = passedFirst
        ? acc.students.categories.passedFirst + passedFirst
        : acc.students.categories.passedFirst

        const newPassedRetry = passedRetry
        ? acc.students.categories.passedRetry + passedRetry
        : acc.students.categories.passedRetry

        const newFailedFirst = failedFirst
        ? acc.students.categories.failedFirst + failedFirst
        : acc.students.categories.failedFirst

      const newFailedRetry = failedRetry
        ? acc.students.categories.failedRetry + failedRetry
        : acc.students.categories.failedRetry

        
      const sgrades = acc.students.grades

      Object.keys(curr.students.grades).forEach(grade => {
        if (!sgrades[grade]) sgrades[grade] = 0
        sgrades[grade] += curr.students.grades[grade]
      })

      return {
        ...acc,
        coursecode: curr.coursecode,
        attempts: { categories: { passed, failed }, grades: cgrades },
        students: { categories: { passedFirst: newPassedFirst, passedRetry: newPassedRetry, failedFirst: newFailedFirst, failedRetry: newFailedRetry }, grades: sgrades }
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
          passedRetry: 0,
          failedFirst: 0,
          failedRetry: 0
        },
        grades: {},
        total: 0,
        passRate: 0,
        failRate: 0
      }
    }
  )

  console.log("students", totals.students.categories)

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
