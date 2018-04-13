import { createSelector } from 'reselect'
import { byDateDesc, reformatDate, byName } from '../common'

const getData = obj => obj.data

export const sortInstances = (courseInstances) => {
  if (courseInstances) {
    return courseInstances.sort(byDateDesc).map(instance => ({
      key: instance.id,
      text: `${reformatDate(instance.date, 'DD.MM.YYYY')} (${instance.students} students)`,
      value: instance.id,
      ...instance
    }))
  }
  return []
}

export const sortCourses = (courseList) => {
  return courseList.sort(byName).map(course => ({ ...course, key: `${course.name}-${course.code}` }))
}

export const makeSortCourseInstances = () => createSelector(
  getData,
  sortInstances
)

export const makeSortCourses = () => createSelector(
  getData,
  sortCourses
)
