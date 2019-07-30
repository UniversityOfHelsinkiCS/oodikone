import { useState, useEffect } from 'react'
import moment from 'moment'
import jwtDecode from 'jwt-decode'
import Datetime from 'react-datetime'
import { uniqBy, filter } from 'lodash'
import pathToRegexp from 'path-to-regexp'
import qs from 'query-string'
import { API_DATE_FORMAT, DISPLAY_DATE_FORMAT, TOKEN_NAME } from '../constants'
import toskaLogo from '../assets/toska.png'
import irtomikko from '../assets/irtomikko.png'
import { sendLog, login } from '../apiConnection'

export const setToken = token => localStorage.setItem(TOKEN_NAME, token)

export const textAndDescriptionSearch = (dropDownOptions, param) =>
  filter(dropDownOptions, option => (option.text ?
    option.text.toLowerCase().concat(option.description.toLowerCase())
      .includes(param.toLowerCase())
    :
    null
  ))

export const decodeToken = (token) => {
  try {
    return jwtDecode(token)
  } catch (e) {
    return {}
  }
}
export const images = {
  toskaLogo,
  irtomikko
}

export const TOKEN_VERSION = 1 // When token structure changes, increment in userservice, backend and frontend

export const tokenAccessInvalid = (token) => {
  const decodedToken = decodeToken(token)
  // Expired
  if (!decodedToken || decodedToken.exp < (new Date().getTime() / 1000)) {
    return true
  }
  // Misses fields
  if (decodedToken.version !== TOKEN_VERSION) {
    console.log('Token is of invalid version, re-logging in')
    return true
  }
  // User is not enabled
  return !decodedToken.enabled
}

export const getTokenWithoutRefresh = () => {
  const token = localStorage.getItem(TOKEN_NAME)
  if (token && !tokenAccessInvalid(token)) {
    return token
  }
  return null
}

export const getToken = async (forceNew = false) => {
  let token = getTokenWithoutRefresh()
  if (!token || forceNew) {
    try {
      token = await login()
      setToken(token)
    } catch (e) {
      console.log('mayhem, reloading')
      window.location.reload(true)
    }
  }
  return token
}

export const userRoles = () => {
  const token = getTokenWithoutRefresh()
  const decoded = decodeToken(token)
  const roles = decoded.roles.map(r => r.group_code)
  return roles
}
export const userRights = () => {
  const token = getTokenWithoutRefresh()
  const decoded = decodeToken(token)
  const { rights } = decoded
  return rights
}
export const userIsAdmin = () => {
  const roles = userRoles()
  return roles.includes('admin')
}
export const getAsUserWithoutRefreshToken = () => {
  const token = getTokenWithoutRefresh()
  if (!token) return null
  const decoded = decodeToken(token)
  return decoded.mockedBy ? decoded.userId : null
}
export const getRolesWithoutRefreshToken = () => {
  const token = getTokenWithoutRefresh()
  if (!token) return []
  const decoded = decodeToken(token)
  const roles = decoded.roles.map(r => r.group_code)
  return roles
}
export const getRightsWithoutRefreshToken = () => {
  const token = getTokenWithoutRefresh()
  if (!token) return []
  const decoded = decodeToken(token)
  const { rights } = decoded
  return rights
}
export const getIdWithoutRefreshToken = () => {
  const token = getTokenWithoutRefresh()
  if (!token) return []
  const decoded = decodeToken(token)
  return decoded.id
}
export const getUserName = () => {
  const token = getTokenWithoutRefresh()
  return token ? decodeToken(token).userId : null
}

export const setUserLanguage = (language) => {
  localStorage.setItem('language', language)
}

export const getUserLanguage = () => {
  let lang = localStorage.getItem('language')
  if (!lang) {
    const token = getTokenWithoutRefresh()
    lang = decodeToken(token).language
    setUserLanguage(lang)
  }
  return lang
}

export const userIsEnabled = () => {
  const token = getTokenWithoutRefresh()
  return token ? decodeToken(token).enabled : false
}

export const containsOnlyNumbers = str => str.match('^\\d+$')

export const momentFromFormat = (date, format) => moment(date, format)

export const reformatDate = (date, outputFormat) => (!date ? 'Unavailable' : moment(date).local().format(outputFormat))

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

export const getStudentTotalCredits = (student) => {
  const passedCourses = student.courses.filter(c => c.passed && !c.isStudyModuleCredit)
  const uniqueCourses = uniqBy(passedCourses, 'course.code')
  return uniqueCourses.reduce((a, b) => a + b.credits, 0)
}

export const getStudentGradeMean = (student) => {
  const gradedCourses = student.courses.filter(c => Number(c.grade))
  const gradeTotal = gradedCourses.reduce((a, b) => a + Number(b.grade), 0)
  const mean = gradeTotal / gradedCourses.length || 0
  return mean
}

export const getStudentTotalCreditsFromMandatory = (student, mandatoryCourses) => student.courses
  .filter(c =>
    c.passed &&
    !c.isStudyModuleCredit &&
    mandatoryCourses.find(cr => cr.code === c.course.code))
  .reduce((a, b) => a + b.credits, 0)

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

export const getCompiledPath = (template, parameters) => {
  const toPath = pathToRegexp.compile(template)
  return toPath(parameters)
}

// https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
export const roundToTwo = num => +(`${Math.round(`${num}e+2`)}e-2`)

export const getTextIn = (texts, language) => {
  if (texts) {
    return texts[language] || texts.fi || texts.en || texts.sv || Object.values(texts)[0]
  }
  return null
}

export const useTabs = (id, initialTab, { location, replace }) => {
  const [tab, setTab] = useState(-1)
  const [didMount, setDidMount] = useState(false)

  const pushToUrl = (newTab) => {
    replace({
      pathname: location.pathname,
      search: qs.stringify({ ...qs.parse(location.search), [id]: newTab })
    })
  }

  useEffect(() => {
    const params = qs.parse(location.search)
    const queryTab = params[id]
    setTab(queryTab === undefined ? initialTab : JSON.parse(queryTab))
    setDidMount(true)
  }, [])

  useEffect(() => {
    if (tab !== undefined && didMount) pushToUrl(tab)
  }, [tab])

  return [
    tab,
    (e, { activeIndex }) => {
      setTab(activeIndex)
    }
  ]
}

export const cancelablePromise = (promise) => {
  let hasCanceled = false

  const wrappedPromise = new Promise(async (res, rej) => {
    try {
      await promise
      if (hasCanceled) res(false)
      res(true)
    } catch (e) {
      console.log('e', e)
      rej(e)
    }
  })

  return {
    promise: wrappedPromise,
    cancel: () => {
      hasCanceled = true
    }
  }
}

export const useSearchHistory = (id, capacity = 5) => {
  const [searchHistory, setSearchHistory] = useState([])
  const [didMount, setDidMount] = useState(false)

  useEffect(() => {
    setSearchHistory(getSearchHistoryStore()[id] || [])
    setDidMount(true)
  }, [])

  useEffect(() => {
    didMount && saveSearchHistory()
  }, [searchHistory])

  const getSearchHistoryStore = () => JSON.parse(localStorage.getItem('searchHistoryStore')) || {}

  const saveSearchHistoryStore = (newStore) => localStorage.setItem('searchHistoryStore', JSON.stringify(newStore))

  const saveSearchHistory = () => {
    const searchHistoryStore = getSearchHistoryStore()
    searchHistoryStore[id] = searchHistory
    saveSearchHistoryStore(searchHistoryStore)
  }

  const addItem = (item) => {
    if (!searchHistory[id]) searchHistory[id] = []
    setSearchHistory(searchHistory.concat({ ...item, timestamp: new Date() }).slice(-capacity))
  }

  return [ searchHistory, addItem ]
}
