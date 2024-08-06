export const countTimeCategories = (times: number[], goal: number) => {
  const statistics = { onTime: 0, yearOver: 0, wayOver: 0 }
  times.forEach(time => {
    if (time <= goal) {
      statistics.onTime += 1
    } else if (time <= goal + 12) {
      statistics.yearOver += 1
    } else {
      statistics.wayOver += 1
    }
  })
  return statistics
}
