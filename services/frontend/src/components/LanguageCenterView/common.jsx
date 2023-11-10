import moment from 'moment'
import React, { createContext, useContext } from 'react'

export const LanguageCenterContext = createContext(null)

export const useLanguageCenterContext = () => useContext(LanguageCenterContext)

export const shortenCourseName = (text, maxLength) =>
  text.length > maxLength ? `${text.substring(0, maxLength)} ... ` : text

export const courseNameColumn = getTextIn => ({
  key: 'course-name',
  title: 'Course',
  getRowVal: row => row.code,
  getRowContent: row => (
    <div title={getTextIn(row.name)} style={{ display: 'flex', flexDirection: 'column' }}>
      <b>{row.code}</b>
      <i style={{ color: 'gray', fontWeight: 'normal' }}>{row.name && shortenCourseName(getTextIn(row.name), 46)}</i>
    </div>
  ),
})

export const filterAttemptsByDates = (date, { startDate, endDate }) => {
  const start = startDate.startdate ?? moment(new Date('1900-1-1'))
  const end = endDate.enddate ?? moment(new Date('2100-01-01'))
  return moment(new Date(date)).isBetween(start, end)
}

export const getRatio = stats => {
  if (stats.notCompleted < stats.completed) return 100
  if (stats.completed === 0) return 0
  if (stats.notCompleted === 0) return null
  const value = stats.completed / stats.notCompleted
  return Math.round(value * 100)
}
