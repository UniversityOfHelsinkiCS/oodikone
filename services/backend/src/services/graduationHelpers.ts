/** Map years to semesters */
export const GraduationTarget = {
  HALF_YEAR: 1,
  ONE_YEAR: 2,
  TWO_YEARS: 4,
  THREE_YEARS: 6,
  THREE_POINT_FIVE_YEARS: 7,
  FOUR_YEARS: 8,
  FIVE_YEARS: 10,
  SIX_YEARS: 12,
} as const

/** Uses semesters, not months */
export const countTimeCategories = (times: number[], target: number) => {
  const statistics = { onTime: 0, yearOver: 0, wayOver: 0 }

  for (const time of times) {
    if (time <= target) {
      statistics.onTime++
    } else if (time <= target + GraduationTarget.ONE_YEAR) {
      statistics.yearOver++
    } else {
      statistics.wayOver++
    }
  }
  return statistics
}
