import dayjs from 'dayjs'

const MIN_YEAR = 1899
const MAX_YEAR = 2112

const isSpring = date => dayjs(date).month() < 9
const isPre2016Course = course => !Number.isNaN(Number(course.code.charAt(0)))
const getYearText = (year, spring) => (spring ? `Spring ${year}` : `Fall ${year}`)

export const formatPassRate = (passRate: string | null) => {
  if (!passRate) {
    return '-'
  }
  return `${passRate} %`
}

const getCourseYears = course => ({
  startYear: dayjs(course.min_attainment_date).year(),
  endYear: dayjs(course.max_attainment_date).year(),
})

export const getActiveYears = course => {
  const { startYear, endYear } = getCourseYears(course)
  if (!startYear && !endYear) {
    return 'No attainments yet'
  }
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

  if (startYearText === endYearText) {
    return startYearText
  }

  return `${startYearText} — ${endYearText}`
}
