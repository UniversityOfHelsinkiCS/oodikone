import moment from 'moment'
import jwtDecode from 'jwt-decode'
import { API_DATE_FORMAT, DISPLAY_DATE_FORMAT } from '../constants'
import { checkAuth } from '../apiConnection'

let decodedToken

export const decodeToken = (token) => {
  if (!decodedToken) {
    decodedToken = jwtDecode(token)
  }
  return decodedToken
}

export const tokenInvalid = (token) => {
  // Expired
  if (!decodedToken || decodedToken.exp < (new Date().getTime() / 1000)) {
    const newToken = decodeToken(token)
    if (newToken.exp < (new Date().getTime() / 1000)) {
      return true
    }
    decodedToken = newToken
  }
  // Misses fields
  const fields = ['enabled', 'userId', 'name']
  return fields.map(key => Object.keys(decodedToken).includes(key)).includes(false)
}

export const userIsAdmin = async () => {
  const token = await checkAuth()
  return token ? decodeToken(token).admin : false
}

export const userIsEnabled = async () => {
  const token = await checkAuth()
  return token ? decodeToken(token).enabled : false
}

export const containsOnlyNumbers = str => str.match('^\\d+$')

export const momentFromFormat = (date, format) => moment(date, format)

export const reformatDate = (date, outputFormat) => moment(date).format(outputFormat)

export const isInDateFormat = (date, format) => moment(date, format, true).isValid()

export const dateFromApiToDisplay = date =>
  moment(date, API_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)

export const sortDatesWithFormat = (d1, d2, dateFormat) =>
  moment(d1, dateFormat) - moment(d2, dateFormat)

export const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date)

export const byName = (a, b) => a.name.localeCompare(b.name)

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

export const getStudentTotalCredits = student => student.courses.reduce((a, b) => a + b.credits, 0)
