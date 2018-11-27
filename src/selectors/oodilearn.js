import { createSelector } from 'reselect'

const notNumeric = str => !Number(str)

const formatGradeName = name => name.slice(0, -2)

const getSearchedCourses = (state) => {
  const { settings, oodilearnCourses } = state
  const { language } = settings
  return oodilearnCourses.data.map(({ code, name }) => ({
    code,
    name: name[language]
  }))
}

const getGradeProfiles = (state) => {
  const { data } = state.oodilearnCourse
  if (!data) {
    return null
  }
  const result = Object.entries(data).reduce((acc, next) => {
    const [key, profile] = next
    const grade = formatGradeName(key)
    const entry = { grade, profile: {} }
    Object.entries(profile).forEach(([dimension, value]) => {
      entry.profile[dimension] = parseFloat(value.toFixed(2))
    })
    return notNumeric(grade) ? [entry, ...acc] : [...acc, entry]
  }, [])
  return result
}

const courseProfileSeries = createSelector(
  [getGradeProfiles],
  (gradeProfiles) => {
    if (!gradeProfiles) {
      return null
    }
    const categories = []
    const series = {}
    const profiles = {}
    gradeProfiles.forEach(({ grade, profile }) => {
      categories.push(grade)
      profiles[grade] = profile
      Object.entries(profile).forEach(([dimension, value]) => {
        const category = series[dimension] || (series[dimension] = { name: dimension, type: 'spline', data: [] })
        category.data.push(value)
      })
    })
    return {
      categories,
      series: Object.values(series),
      profiles
    }
  }
)

export default {
  getSearchedCourses,
  courseProfileSeries
}
