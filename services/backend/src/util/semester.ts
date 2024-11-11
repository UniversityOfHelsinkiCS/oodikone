import moment from 'moment'

const isSpring = (date: moment.Moment) => {
  return 0 <= date.month() && date.month() <= 6
}

const getSemester = (date: moment.Moment) => (isSpring(date) ? 'SPRING' : 'FALL')

export enum SemesterStart {
  SPRING = '01-01',
  FALL = '08-01',
}

export const getPassingSemester = (startYear: number, date: Date): string => {
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
