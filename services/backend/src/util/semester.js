const moment = require('moment')

const SPRING = { start: 0, end: 6 }

const isSpring = date => SPRING.start <= date.month() && date.month() <= SPRING.end

const getSemester = date => (isSpring(date) ? 'SPRING' : 'FALL')

const semesterStart = {
  SPRING: '01-01',
  FALL: '07-31',
}

const semesterEnd = {
  SPRING: '07-31',
  FALL: '12-31',
}
const getPassingSemester = (startYear, date) => {
  const mDate = moment(date).add(1, 'day')
  const year = mDate.year()
  const semester = getSemester(mDate)
  const yearDiff = year - startYear
  const yearCount = semester === 'SPRING' ? yearDiff - 1 : yearDiff

  if (year < startYear || (semester === 'SPRING' && yearDiff <= 0)) {
    return 'BEFORE'
  }

  return yearCount < 6 ? `${yearCount}-${semester}` : 'LATER'
}

const getAcademicYearDates = (year, yearsCombined) => {
  const startYear = typeof year === 'number' ? year : Number(year.slice(0, 4))
  const correctEndYear = yearsCombined ? new Date().getFullYear() : startYear
  return {
    startDate: `${startYear}-${semesterStart['FALL']}`,
    endDate: `${moment(correctEndYear, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`,
  }
}

const getYearStartAndEndDates = (year, isAcademicYear) => {
  if (isAcademicYear) {
    const firstYear = year.slice(0, 4)
    return {
      startDate: new Date(`${firstYear}-${semesterStart['FALL']}`).toISOString(),
      endDate: new Date(
        `${moment(firstYear, 'YYYY').add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`
      ).toISOString(),
    }
  }

  return {
    startDate: new Date(`${year}-01-01`).toISOString(),
    endDate: new Date(`${year}-12-31`).toISOString(),
  }
}

module.exports = {
  getPassingSemester,
  getAcademicYearDates,
  getYearStartAndEndDates,
  semesterEnd,
  semesterStart,
}
