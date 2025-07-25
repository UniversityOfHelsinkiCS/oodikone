import dayjs, { type Dayjs } from 'dayjs'

import { DateFormat } from '@/constants/date'

export const getAge = (birthDate: string | Date | Dayjs, integer = true, dateToCompare = new Date()) =>
  dayjs(dateToCompare).diff(birthDate, 'years', !integer)

export const getTimestamp = () => formatDate(new Date(), DateFormat.ISO_DATE)

export const isWithinSixMonths = (date: string) => dayjs(date) > dayjs().subtract(6, 'months')

export const reformatDate = (date: string | Date | null | undefined, outputFormat: string) =>
  formatDate(date, outputFormat as DateFormat)

// Prefer this to using moment as the library is MEGA slow
// goal is to get rid of moment completely
export const formatDate = (dateToFormat: string | Date | Dayjs | null | undefined, outputFormat: DateFormat) => {
  if (!dateToFormat) return 'Unavailable'

  const date = dayjs.isDayjs(dateToFormat) ? dateToFormat.toDate() : new Date(dateToFormat)

  if (isNaN(date.getTime())) return 'Unavailable'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  switch (outputFormat) {
    case DateFormat.YEAR_DATE:
      return `${year}`
    case DateFormat.ISO_DATE:
      return `${year}-${month}-${day}`
    case DateFormat.ISO_DATE_DEV:
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    case DateFormat.DISPLAY_DATE:
      return `${day}.${month}.${year}`
    case DateFormat.DISPLAY_DATE_DEV:
      return `${day}.${month}.${year} ${hour}:${minute}:${second}`
    case DateFormat.DISPLAY_DATETIME:
      return `${day}.${month}.${year} ${hour}:${minute}`
    case DateFormat.LONG_DATE_TIME:
      return `${day} ${getMonthName(date.getMonth())} ${year} at ${hour}:${minute}:${second}`
    default:
      return `${year}-${month}-${day}`
  }
}

const getMonthName = (monthIndex: number) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return months[monthIndex]
}

export const getCalendarYears = (years: string[]) => {
  return years.reduce((all, year) => {
    if (year === 'Total') {
      return all
    }
    return all.concat(Number(year.slice(0, 4)))
  }, [] as number[])
}

/**
 * Returns date formatted as 'DD-MM-YYYY' using UTC time.
 */
export const formatISODate = (initialDate: string | Date) => {
  const date = new Date(initialDate)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${day}-${month}-${year}`
}
