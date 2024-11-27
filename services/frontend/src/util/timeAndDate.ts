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
