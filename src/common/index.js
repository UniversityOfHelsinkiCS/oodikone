import moment from 'moment'

import { API_DATE_FORMAT, DISPLAY_DATE_FORMAT } from '../constants'

export const containsOnlyNumbers = str => str.match('^\\d+$')

export const momentFromFormat = (date, format) => moment(date, format)

export const reformatDate = (date, outputFormat) => moment(date).format(outputFormat)

export const isInDateFormat = (date, format) => moment(date, format, true).isValid()

export const dateFromApiToDisplay = date =>
  moment(date, API_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)

export const sortDatesWithFormat = (d1, d2, dateFormat) =>
  moment(d1, dateFormat) - moment(d2, dateFormat)

/* This should be done in backend */
export const removeInvalidCreditsFromStudent = student => ({
  ...student,
  courses: student.courses.map((course) => {
    if (course.credits >= 25) {
      course.credits = 0
    }
    return course
  })
})

export const removeInvalidCreditsFromStudents = students =>
  students.map(student => removeInvalidCreditsFromStudent(student))

export const flattenAndCleanPopulations = populations =>
  populations.filter(population => !population.pending)
    .map(population => population.data)
    .map(student => removeInvalidCreditsFromStudents(student))

export const getStudentTotalCredits = student => student.courses.reduce((a, b) => a + b.credits, 0)
