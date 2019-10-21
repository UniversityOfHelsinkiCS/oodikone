import { useState, useEffect, useRef } from 'react'
import moment from 'moment'
import jwtDecode from 'jwt-decode'
import Datetime from 'react-datetime'
import { uniqBy, filter, maxBy } from 'lodash'
import pathToRegexp from 'path-to-regexp'
import qs from 'query-string'
import { API_DATE_FORMAT, DISPLAY_DATE_FORMAT, SEARCH_HISTORY_VERSION } from '../constants'
import toskaLogo from '../assets/toska.png'
import irtomikko from '../assets/irtomikko.png'

const MOCK_USERID = 'MOCK_USERID'
export const setMocking = userid =>
  userid ? localStorage.setItem(MOCK_USERID, userid) : localStorage.removeItem(MOCK_USERID)
export const getMocked = () => localStorage.getItem(MOCK_USERID)
const TEST_USERID = 'TEST_USERID'
export const setTestUser = userid =>
  userid ? localStorage.setItem(TEST_USERID, userid) : localStorage.removeItem(TEST_USERID)
export const getTestUser = () => localStorage.getItem(TEST_USERID)

export const textAndDescriptionSearch = (dropDownOptions, param) =>
  filter(dropDownOptions, option =>
    option.text
      ? option.text
          .toLowerCase()
          .concat(option.description.toLowerCase())
          .includes(param.toLowerCase())
      : null
  )

export const decodeToken = token => {
  try {
    return jwtDecode(token)
  } catch (e) {
    return null
  }
}

export const images = {
  toskaLogo,
  irtomikko
}

export const getUserRoles = roles => (roles ? roles.map(r => r.group_code) : [])
export const getUserIsAdmin = roles => getUserRoles(roles).includes('admin')

export const containsOnlyNumbers = str => str.match('^\\d+$')

export const momentFromFormat = (date, format) => moment(date, format)

export const reformatDate = (date, outputFormat) =>
  !date
    ? 'Unavailable'
    : moment(date)
        .local()
        .format(outputFormat)

export const isInDateFormat = (date, format) => moment(date, format, true).isValid()
export const isValidYear = year =>
  year.isSameOrBefore(Datetime.moment(), 'year') && year.isAfter(Datetime.moment('1900', 'YYYY'), 'year')
export const dateFromApiToDisplay = date => moment(date, API_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)

export const sortDatesWithFormat = (d1, d2, dateFormat) => moment(d1, dateFormat) - moment(d2, dateFormat)

export const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date)

export const byName = (a, b) => a.name.localeCompare(b.name)

export const byCodeDesc = (a, b) => b.code.localeCompare(a.code)

export const studyRightRegex = new RegExp(/.*master|bachelor|doctor|licentiate|specialist.*/)

export const studyrightTypes = { degree: '10', programme: '20', speciality: '30' } // speciality???

export const getStudentTotalCredits = student => {
  const passedCourses = student.courses.filter(c => c.passed && !c.isStudyModuleCredit)
  const uniqueCourses = uniqBy(passedCourses, 'course.code')
  return uniqueCourses.reduce((a, b) => a + b.credits, 0)
}

export const getStudentGradeMean = student => {
  const gradedCourses = student.courses.filter(c => Number(c.grade))
  const gradeTotal = gradedCourses.reduce((a, b) => a + Number(b.grade), 0)
  const mean = gradeTotal / gradedCourses.length || 0
  return mean
}

export const getStudentTotalCreditsFromMandatory = (student, mandatoryCourses) =>
  student.courses
    .filter(c => c.passed && !c.isStudyModuleCredit && mandatoryCourses.find(cr => cr.code === c.course.code))
    .reduce((a, b) => a + b.credits, 0)

export const getTotalCreditsFromCourses = courses =>
  courses.filter(c => c.passed && !c.isStudyModuleCredit).reduce((a, b) => a + b.credits, 0)

export const copyToClipboard = text => {
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

export const getTextIn = (texts, language) => {
  if (texts) {
    return texts[language] || texts.fi || texts.en || texts.sv || Object.values(texts)[0]
  }
  return null
}

export const useTabs = (id, initialTab, { location, replace }) => {
  const [tab, setTab] = useState(-1)
  const [didMount, setDidMount] = useState(false)

  const pushToUrl = newTab => {
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

export const cancelablePromise = promise => {
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

  const getSearchHistoryStore = () => JSON.parse(localStorage.getItem('searchHistoryStore')) || {}

  const saveSearchHistoryStore = newStore => localStorage.setItem('searchHistoryStore', JSON.stringify(newStore))

  const saveSearchHistory = () => {
    const searchHistoryStore = getSearchHistoryStore()
    searchHistoryStore[id] = searchHistory
    saveSearchHistoryStore(searchHistoryStore)
  }

  useEffect(() => {
    if (localStorage.getItem('searchHistoryVersion') !== SEARCH_HISTORY_VERSION) {
      saveSearchHistoryStore({})
      localStorage.setItem('searchHistoryVersion', SEARCH_HISTORY_VERSION)
    }

    setSearchHistory(getSearchHistoryStore()[id] || [])
    setDidMount(true)
  }, [])

  useEffect(() => {
    if (didMount) {
      saveSearchHistory()
    }
  }, [searchHistory])

  const addItem = item => {
    const filteredSearchHistory = searchHistory.filter(sh => sh.text !== item.text)
    setSearchHistory(
      filteredSearchHistory.concat({ ...item, timestamp: new Date(), id: new Date().getTime() }).slice(-capacity)
    )
  }

  const updateItem = item => {
    const updatedSearchHistory = [{ ...item, timestamp: new Date() }].concat(
      searchHistory.filter(s => s.id !== item.id)
    )
    setSearchHistory(updatedSearchHistory)
  }

  return [searchHistory, addItem, updateItem]
}

export const flattenStudyrights = studyrights => {
  const studyrightcodes = []
  studyrights.forEach(sr => {
    sr.studyrightElements.forEach(srE => {
      studyrightcodes.push(srE.code)
    })
  })
  return studyrightcodes
}

export const getStudentToTargetCourseDateMap = (students, codes) => {
  const codeSet = new Set(codes)
  return students.reduce((acc, student) => {
    const targetCourse = student.courses
      .filter(c => codeSet.has(c.course.code))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    acc[student.studentNumber] = targetCourse ? targetCourse.date : null
    return acc
  }, {})
}

export const getNewestProgramme = (studyrights, studentNumber = null, studentToTargetCourseDateMap = null) => {
  const studyprogrammes = []
  studyrights.forEach(sr => {
    const studyrightElements = sr.studyrightElements.filter(
      srE =>
        srE.element_detail.type === 20 &&
        (studentToTargetCourseDateMap && studentNumber
          ? moment(studentToTargetCourseDateMap[studentNumber]).isBetween(moment(srE.startdate), moment(srE.enddate))
          : true)
    )
    if (studyrightElements.length > 0) {
      const newestStudyrightElement = studyrightElements.sort(
        (a, b) => new Date(b.startdate) - new Date(a.startdate)
      )[0]
      studyprogrammes.push({
        name: sr.highlevelname,
        startdate: newestStudyrightElement.startdate,
        code: newestStudyrightElement.element_detail.code
      })
    }
  })
  const programme = studyprogrammes.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0]
  if (programme) {
    return programme
  }
  return { name: 'No programme', startdate: '', code: '00000' }
}

export const getHighestGradeOfCourseBetweenRange = (courses, lowerBound, upperBound) => {
  const grades = []
  courses.forEach(course => {
    if (
      new Date(lowerBound).getTime() <= new Date(course.date).getTime() &&
      new Date(course.date).getTime() <= new Date(upperBound).getTime()
    ) {
      if (course.grade === 'Hyv.') {
        grades.push({ grade: course.grade, value: 1 })
      } else if (!Number(course.grade)) {
        grades.push({ grade: course.grade, value: 0 })
      } else {
        grades.push({ grade: course.grade, value: Number(course.grade) })
      }
    }
  })
  return maxBy(grades, grade => grade.value)
}

export const useInterval = (callback, delay) => {
  const savedCallback = useRef()
  const savedId = useRef()

  const clear = () => {
    if (savedId.current) {
      clearInterval(savedId.current)
    }
  }

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const tick = () => savedCallback.current()
    clear()
    if (delay !== null) {
      savedId.current = setInterval(tick, delay)
    }
    return clear
  }, [delay])
}

export const useDidMount = () => {
  const [didMount, setDidMount] = useState(false)
  useEffect(() => {
    setDidMount(true)
  }, [])
  return didMount
}

export const useProgress = loading => {
  const didMount = useDidMount()
  const [progress, setProgress] = useState(100)
  const [delay, setDelay] = useState(null)
  const amountToProgress = delay ? Math.ceil(Math.random() * 4) : 0

  useInterval(() => {
    setProgress(progress + amountToProgress > 50 ? 50 : progress + amountToProgress)
  }, delay)

  useEffect(() => {
    if (delay && progress >= 50) {
      setDelay(null)
    }
  }, [progress])

  const restartProgress = () => {
    setProgress(0)
    setDelay(500)
  }

  const finishProgress = () => {
    setDelay(null)
    setImmediate(() => setProgress(100))
  }

  useEffect(() => {
    if (loading) restartProgress()
    else if (didMount) finishProgress()
  }, [loading])

  const onProgress = p => {
    if (p > 0) {
      setProgress(50 + Math.floor(p / 2))
    }
  }

  return {
    progress,
    onProgress
  }
}

export const validateInputLength = (input, minLength) => input && input.trim().length >= minLength

export const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')
