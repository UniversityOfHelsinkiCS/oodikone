import moment from 'moment'
import jwtDecode from 'jwt-decode'
import Datetime from 'react-datetime'
import { API_DATE_FORMAT, DISPLAY_DATE_FORMAT, TOKEN_NAME } from '../constants'
import toskaLogo from '../assets/toska.png'

import { sendLog, login } from '../apiConnection'

export const setToken = token => localStorage.setItem(TOKEN_NAME, token)

export const decodeToken = (token) => {
  try {
    return jwtDecode(token)
  } catch (e) {
    return {}
  }
}
export const images = {
  toskaLogo
}
export const tokenAccessInvalid = (token) => {
  const decodedToken = decodeToken(token)
  // Expired
  if (!decodedToken || decodedToken.exp < (new Date().getTime() / 1000)) {
    return true
  }
  // Misses fields
  const fields = ['enabled', 'userId', 'name']
  if (fields.some(key => !Object.keys(decodedToken).includes(key))) {
    return true
  }
  // User is not enabled
  return !decodedToken.enabled
}

export const getToken = async (forceNew = false) => {
  let token = localStorage.getItem(TOKEN_NAME)
  if (!token || tokenAccessInvalid(token) || forceNew) {
    token = await login()
    setToken(token)
  }
  return token
}

export const userIsAdmin = async () => {
  const token = await getToken()
  return token ? decodeToken(token).admin : false
}
export const getUserName = async () => {
  const token = await getToken()
  return token ? decodeToken(token).userId : false
}

export const setUserLanguage = (language) => {
  localStorage.setItem('language', language)
}

export const getUserLanguage = async () => {
  let lang = localStorage.getItem('language')
  if (!lang) {
    const token = await getToken()
    lang = decodeToken(token).language
    setUserLanguage(lang)
  }
  return lang
}

export const userIsEnabled = async () => {
  const token = await getToken()
  return token ? decodeToken(token).enabled : false
}

export const containsOnlyNumbers = str => str.match('^\\d+$')

export const momentFromFormat = (date, format) => moment(date, format)

export const reformatDate = (date, outputFormat) => (!date ? 'Unavailable' : moment(date).format(outputFormat))

export const isInDateFormat = (date, format) => moment(date, format, true).isValid()
export const isValidYear = year => (year.isSameOrBefore(Datetime.moment(), 'year')
  && year.isAfter(Datetime.moment('1900', 'YYYY'), 'year'))
export const dateFromApiToDisplay = date =>
  moment(date, API_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)

export const sortDatesWithFormat = (d1, d2, dateFormat) =>
  moment(d1, dateFormat) - moment(d2, dateFormat)

export const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date)

export const byName = (a, b) => a.name.localeCompare(b.name)

export const byCodeDesc = (a, b) => b.code.localeCompare(a.code)

export const studyRightRegex = new RegExp(/.*master|bachelor|doctor|licentiate|specialist.*/)

export const studyrightTypes = { degree: '10', programme: '20', speciality: '30' } // speciality???
/* This should be done in backend */
export const removeInvalidCreditsFromStudent = student => ({
  ...student,
  courses: student.courses.map((course) => {
    if (course.credits) {
      course.credits = course.credits // DOES NOTHING NOW, TOO AFRAID TO REMOVE
    }
    return course
  })
})

export const removeInvalidCreditsFromStudents = students =>
  students.map(student => removeInvalidCreditsFromStudent(student))

export const getStudentTotalCredits = student => student.courses
  .filter(c => c.passed && !c.isStudyModuleCredit).reduce((a, b) => a + b.credits, 0)

export const getTotalCreditsFromCourses = courses =>
  courses.filter(c => c.passed && !c.isStudyModuleCredit).reduce((a, b) => a + b.credits, 0)

export const log = async (msg, meta) => {
  const token = await getToken()
  const decoded = decodeToken(token)
  const combinedMeta = { ...decoded, ...meta }
  sendLog({ message: msg, full_message: combinedMeta })
}

export const copyToClipboard = (text) => {
  const textField = document.createElement('textarea')
  textField.innerText = text
  document.body.appendChild(textField)
  textField.select()
  document.execCommand('copy')
  textField.remove()
}
