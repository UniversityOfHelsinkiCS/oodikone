import moment from 'moment'

import { ISO_DATE_FORMAT } from '@/constants/date'

export const getAge = (birthDate: string, integer = true, dateToCompare = moment()) => {
  const age = dateToCompare.diff(moment(birthDate), 'years', true)
  return integer ? Math.floor(age) : age
}

export const getTimestamp = () => moment().format(ISO_DATE_FORMAT)

export const isWithinSixMonths = (date: string) => moment(date) > moment().subtract(6, 'months')

export const momentFromFormat = (date: string, format: string) => moment(date, format)

export const reformatDate = (date: string | Date | null | undefined, outputFormat: string) => {
  if (!date) {
    return 'Unavailable'
  }
  const parsedDate = moment(date).local().format(outputFormat)
  return parsedDate
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

/**
 * Returns date formatted as 'DD.MM.YYYY'
 */
export const formatDisplayDate = (initialDate: string | Date) => {
  const date = new Date(initialDate)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${day}.${month}.${year}`
}
