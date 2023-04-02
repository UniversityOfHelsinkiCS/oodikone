import { createSelector } from '@reduxjs/toolkit'
import { reformatDate } from '../common'

const getStudents = students => students.data

export const formatStudents = students =>
  students.map(({ studentNumber, credits, started, lastname, firstnames, studyrights }) => {
    const date = reformatDate(started, 'DD.MM.YYYY')
    return { studentNumber, started: date, credits, lastname, firstnames, studyrights }
  })
export const makeFormatStudentRows = () => createSelector(getStudents, formatStudents)
