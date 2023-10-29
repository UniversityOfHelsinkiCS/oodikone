import moment from 'moment'
import { createContext, useContext } from 'react'

export const LanguageCenterContext = createContext(null)

export const useLanguageCenterContext = () => useContext(LanguageCenterContext)

export const filterFaculties = data => {
  return {
    ...data,
    attempts: data.attempts.filter(attempt => !attempt.faculty || attempt.faculty?.substring(0, 3).match(`^H\\d`)),
  }
}

export const shortenCourseName = (text, maxLength) =>
  text.length > maxLength ? `${text.substring(0, maxLength)} ... ` : text

export const filterAttemptsByDates = (date, { startDate, endDate }) => {
  const start = startDate.startdate ?? moment(new Date('1900-1-1'))
  const end = endDate.enddate ?? moment(new Date('2100-01-01'))
  return moment(new Date(date)).isBetween(start, end)
}
