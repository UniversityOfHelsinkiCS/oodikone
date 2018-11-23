const SPRING = { start: 1, end: 7 }

const isSpring = date => SPRING.start <= date.month() && date.month() <= SPRING.end

const getSemester = date => isSpring(date) ? 'SPRING' : 'FALL'

const getSemesterAndYear = date => `${date.year()}-${getSemester(date)}`

module.exports = {
  getSemester,
  getSemesterAndYear
}
