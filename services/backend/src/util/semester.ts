import moment from 'moment'

enum SpringSemester {
  START_MONTH = 0,
  END_MONTH = 6,
}

const isSpring = (date: moment.Moment): boolean => {
  return SpringSemester.START_MONTH <= date.month() && date.month() <= SpringSemester.END_MONTH
}

const getSemester = (date: moment.Moment): 'FALL' | 'SPRING' => (isSpring(date) ? 'SPRING' : 'FALL')

export enum SemesterStart {
  SPRING = '01-01',
  FALL = '08-01',
}

// Sometimes start date is in UTC and sometimes not, add flexibility to this
// End date must be then also in UTC, otherwice students may land into two academic years
export enum SemesterEnd {
  SPRING = '07-31T20:59:59.000Z',
  FALL = '12-31T20:59:59.000Z',
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
