import { dateDaysFromNow } from '@oodikone/shared/util/datetime'

const isSpring = (date: Date) => {
  return 0 <= date.getMonth() && date.getMonth() <= 6
}

const getSemester = (date: Date) => (isSpring(date) ? 'SPRING' : 'FALL')

export enum SemesterStart {
  SPRING = '01-01',
  FALL = '08-01',
}

export const getPassingSemester = (startYear: number, initialDate: Date): string => {
  const date = dateDaysFromNow(initialDate, 1)
  const year = date.getFullYear()
  const semester = getSemester(date)
  const yearDiff = year - startYear
  const yearCount = semester === 'SPRING' ? yearDiff - 1 : yearDiff

  if (year < startYear || (semester === 'SPRING' && yearDiff <= 0)) {
    return 'BEFORE'
  }

  return yearCount < 6 ? `${yearCount}-${semester}` : 'LATER'
}
