import moment from 'moment'

import { ISO_DATE_FORMAT } from '@/constants/date'

export const getAge = (date: string) => {
  const today = new Date()
  const birthDate = new Date(date)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export const getTimestamp = () => moment().format(ISO_DATE_FORMAT)

export const isWithinSixMonths = (date: string) => moment(date) > moment().subtract(6, 'months')

export const momentFromFormat = (date: string, format: string) => moment(date, format)

export const reformatDate = (date: string, outputFormat: string) => {
  if (!date) {
    return 'Unavailable'
  }
  const parsedDate = moment(date).local().format(outputFormat)
  return parsedDate
}
