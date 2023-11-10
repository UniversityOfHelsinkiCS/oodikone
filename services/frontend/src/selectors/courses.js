import { createSelector } from '@reduxjs/toolkit'
import { orderBy } from 'lodash'
import { byDateDesc } from '../common'

// const sortAlternatives = alternatives => {
//   const result = orderBy(
//     alternatives,
//     [
//       a => {
//         if (a.code.match(/^A/)) return 4 // open university codes come last
//         if (a.code.match(/^\d/)) return 2 // old numeric codes come second
//         if (a.code.match(/^[A-Za-z]/)) return 1 // new letter based codes come first
//         return 3 // unknown, comes before open uni?
//       },
//       a => a.latestInstanceDate || new Date(),
//       'code',
//     ],
//     ['asc', 'desc', 'desc']
//   )
//   return result
// }

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

// If special case of Open Uni course that starts with A let's just sort them length, that
// should be good enough in this case.
// const getAlternatives = course => sortAlternatives(course.alternatives)

const filterCourseSearchResults = (courses, combineAlternatives /*  unifyOpenUniCourses */) => {
  const mergedCourses = {}
  // const sortedCourses = sortAlternatives(courses)
  courses.forEach(course => {
    // const groupId = /* isAvoin(course) && !unifyOpenUniCourses ? course.code : */ course.subsId
    const groupId = combineAlternatives ? course.subsId : course.code

    if (!(course.max_attainment_date && course.min_attainment_date)) {
      return
    }

    if (!mergedCourses[groupId]) {
      mergedCourses[groupId] = {
        ...course,
        substitutions: combineAlternatives ? sortSubstitutions(course) : [],
        // alternatives: [{ code: course.code, latestInstanceDate: new Date(course.latest_instance_date) }],
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
      // mergedCourse.alternatives.push({
      //   code: course.code,
      //   latestInstanceDate: new Date(course.latest_instance_date),
      // })
    }
  })

  const result = Object.values(mergedCourses)
  // const result = Object.values(mergedCourses).map(course => ({
  // ...course,
  // alternatives: combineAlternatives
  //   ? getAlternatives(course)
  //   : [{ code: course.code, latestInstanceDate: course.latest_instance_date }],
  // }))

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

// export const getCourseSearchResults = createSelector(getCourseSearchSelector, courses => {
//   if (!courses) {
//     return []
//   }
//   return filterCourseSearchResults(courses)
// })

export const getCourseSearchResults = createSelector(
  [getCourseSearchSelector, (state, combineSubstitutions) => combineSubstitutions],
  (courses, combineSubstitutions) => {
    if (!courses) {
      return []
    }
    return filterCourseSearchResults(courses, combineSubstitutions)
  }
)
