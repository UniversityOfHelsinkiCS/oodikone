const moment = require('moment')

const SPRING = { start: 0, end: 6 }

const isSpring = date => SPRING.start <= date.month() && date.month() <= SPRING.end

const getSemester = date => (isSpring(date) ? 'SPRING' : 'FALL')

const semesterStart = {
  SPRING: '01-01',
  FALL: '08-01',
}
// Sometimes startdate is in UTC sometimes not, add flexibility to this
// End date must be then also in UTC, othervice students may land into two academic years.
const semesterEnd = {
  SPRING: '07-31T20:59:59.000Z',
  FALL: '12-31T20:59:59.000Z',
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

const getAcademicYearDates = (year, since) => {
  if (year === 'Total') {
    return {
      startDate: `${since.getFullYear()}-${semesterStart['FALL']}`,
      endDate: `${moment(new Date()).add(1, 'years').format('YYYY')}-${semesterEnd['SPRING']}`,
    }
  }
  const startYear = typeof year === 'number' ? year : Number(year.slice(0, 4))
  const endYear =
    typeof year === 'number' ? moment(year, 'YYYY').add(1, 'years').format('YYYY') : Number(year.slice(7, 11))
  return {
    startDate: new Date(moment.tz(`${startYear}-${semesterStart['FALL']}`, 'Europe/Helsinki').format()).toUTCString(),
    endDate: new Date(`${endYear}-${semesterEnd['SPRING']}`).toUTCString(),
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
    endDate: new Date(`${year}-12-31T23:59:59.000Z`).toISOString(),
  }
}

module.exports = {
  getPassingSemester,
  getAcademicYearDates,
  getYearStartAndEndDates,
  semesterEnd,
  semesterStart,
}
