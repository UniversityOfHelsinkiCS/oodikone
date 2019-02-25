import moment from 'moment'

const MIN_YEAR = 1899
const MAX_YEAR = 2112

const isSpring = date => moment(date).month() < 9
const isPre2016Course = course => !Number.isNaN(Number(course.code.charAt(0)))
const twoDigitYear = year => year.toString().substring(2, 4)
const getSemesterText = (start, end) => `${start}-${twoDigitYear(end)}`
const getYearDataText = (year, spring) => (spring ? getSemesterText(year - 1, year) : getSemesterText(year, year + 1))
const getYearText = (year, spring) => (spring ? `Spring ${year}` : `Fall ${year}`)

const getCourseYears = course => ({
  startYear: moment(course.min_attainment_date).year(),
  endYear: moment(course.max_attainment_date).year()
})

const getActiveYears = (course) => {
  const { startYear, endYear } = getCourseYears(course)
  if (!startYear && !endYear) return 'No attainments yet'
  const startYearText = getYearText(startYear, isSpring(course.min_attainment_date))
  const endYearText = getYearText(endYear, isSpring(course.max_attainment_date))
  if (endYear === MAX_YEAR && isPre2016Course(course)) {
    return `— ${getYearText(2016, false)}`
  }

  if (startYear === MIN_YEAR) {
    return `— ${endYearText}`
  }

  if (endYear === MAX_YEAR) {
    return `${startYearText} — `
  }
  if (startYearText === endYearText) return startYearText
  return `${startYearText} — ${endYearText}`
}

const getCourseSemesters = (course) => {
  const { startYear, endYear } = getCourseYears(course)
  return {
    start: getYearDataText(startYear, isSpring(course.min_attainment_date)),
    end: getYearDataText(endYear, isSpring(course.max_attainment_date))
  }
}

const maximumYear = years => (
  years.reduce((prev, curr) => {
    if (prev.value > curr.value) return prev
    return curr
  })
)

const getStartAndEndYearValues = (course, years) => {
  if (!course.min_attainment_date && !course.max_attainment_date) return { fromYear: null, toYear: null }
  const { start, end } = getCourseSemesters(course)
  const startYear = years.find(year => year.text === start)

  const endYear = Number(start.substring(0, 4) === MAX_YEAR) ?
    maximumYear(years) :
    years.find(year => year.text === end)
  const fromYear = startYear ? startYear.value : undefined
  const toYear = endYear ? endYear.value : undefined
  return { fromYear, toYear }
}

export {
  getActiveYears,
  getStartAndEndYearValues
}
