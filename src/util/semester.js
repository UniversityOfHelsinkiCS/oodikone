const moment = require('moment')

const SPRING = { start: 1, end: 7 }

const isSpring = date => SPRING.start <= date.month() && date.month() <= SPRING.end

const getSemester = date => isSpring(date) ? 'SPRING' : 'FALL'

const getPassingSemester = (startYear, date) => {
  const mDate = moment(date)
  const year = mDate.year()
  const semester = getSemester(mDate)
  const yearDiff = year - startYear
  const yearCount = semester === 'SPRING' ? yearDiff - 1 : yearDiff

  if (year < startYear) {
    return 'BEFORE'
  }

  return (yearCount < 6) ? `${yearCount}-${semester}` : 'LATER'
}

module.exports = {
  getPassingSemester
}
