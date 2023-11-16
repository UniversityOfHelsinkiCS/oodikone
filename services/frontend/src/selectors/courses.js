import { createSelector } from '@reduxjs/toolkit'
import { orderBy } from 'lodash'
import { byDateDesc } from '../common'

const sortSubstitutions = course => {
  const result = orderBy(
    course.substitutions,
    [
      a => {
        if (a.match(/^A/)) return 4 // open university codes come last
        if (a.match(/^\d/)) return 2 // old numeric codes come second
        if (a.match(/^[A-Za-z]/)) return 1 // new letter based codes come first
        return 3 // unknown, comes before open uni?
      },
    ],
    ['asc']
  )
  return result
}

const filterCourseSearchResults = (courses, combineSubstitutions) => {
  const mergedCourses = {}
  courses.forEach(course => {
    const groupId = combineSubstitutions ? course.subsId : course.code

    if (!(course.max_attainment_date && course.min_attainment_date)) {
      return
    }

    if (!mergedCourses[groupId]) {
      mergedCourses[groupId] = {
        ...course,
        substitutions: combineSubstitutions ? sortSubstitutions(course) : [],
        min_attainment_date: new Date(course.min_attainment_date),
        max_attainment_date: new Date(course.max_attainment_date),
      }
    } else {
      const mergedCourse = mergedCourses[groupId]
      mergedCourse.min_attainment_date = new Date(
        Math.min(mergedCourse.min_attainment_date, new Date(course.min_attainment_date))
      )
      mergedCourse.max_attainment_date = new Date(
        Math.max(mergedCourse.max_attainment_date, new Date(course.max_attainment_date))
      )
    }
  })

  const result = Object.values(mergedCourses)

  return result
}

const getData = obj => obj
const getCourseSearchSelector = state => state.courseSearch.data.courses

export const sortCourses = courseList =>
  Object.values(courseList.data)
    .sort(byDateDesc)
    .map(course => ({
      ...course,
      title: `${course.name} (${course.code})`,
      key: `${course.name}-${course.code}`,
      selected: courseList.selected.some(c => course.code === c.code),
    }))

export const makeSortCourses = () => createSelector(getData, sortCourses)

export const getCourseSearchResults = createSelector(
  [getCourseSearchSelector, (state, combineSubstitutions) => combineSubstitutions],
  (courses, combineSubstitutions) => {
    if (!courses) {
      return []
    }
    return filterCourseSearchResults(courses, combineSubstitutions)
  }
)
