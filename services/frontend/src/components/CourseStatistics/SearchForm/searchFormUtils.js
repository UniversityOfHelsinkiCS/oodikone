// import { orderBy } from 'lodash'

// handle special case where the course's actual code starts with "A" so it is mistakenly taken as Open Uni course
// const isAvoin = course => !!course.code.match(/^[A][0-9]|^AY/)

/* const sortAlternatives = alternatives => {
  const result = orderBy(
    alternatives,
    [
      a => {
        if (a.code.match(/^A/)) return 4 // open university codes come last
        if (a.code.match(/^\d/)) return 2 // old numeric codes come second
        if (a.code.match(/^[A-Za-z]/)) return 1 // new letter based codes come first
        return 3 // unknown, comes before open uni?
      },
      a => a.latestInstanceDate || new Date(),
      'code',
    ],
    ['asc', 'desc', 'desc']
  )

  return result
} */

// If special case of Open Uni course that starts with A let's just sort them length, that
// should be good enough in this case.

/* const getAlternatives = course => sortAlternatives(course.alternatives)

const filterCourseSearchResults = courses => {
  const mergedCourses = {}
  const sortedCourses = sortAlternatives(courses)
  sortedCourses.forEach(course => {
    const groupId = course.subsId

    if (!(course.max_attainment_date && course.min_attainment_date)) {
      return
    }

    if (!mergedCourses[groupId]) {
      mergedCourses[groupId] = {
        ...course,
        alternatives: [{ code: course.code, latestInstanceDate: new Date(course.latest_instance_date) }],
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
      mergedCourse.alternatives.push({
        code: course.code,
        latestInstanceDate: new Date(course.latest_instance_date),
      })
    }
  })

  const result = Object.values(mergedCourses).map(course => ({
    ...course,
    alternatives: getAlternatives(course),
  }))

  return result
} */
